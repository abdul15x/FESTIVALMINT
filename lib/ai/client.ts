import { z } from 'zod';
import { getAiConfig, getGeminiCandidateModels } from '@/lib/env';

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkAiRateLimit(key: string, maxRequests = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export function sanitizeForPrompt(value: string, maxLength = 2000): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<\/?untrusted_data>/gi, '')
    .trim()
    .slice(0, maxLength);
}

export type StructuredAiResult<T> =
  | {
      ok: true;
      data: T;
      provider: 'gemini' | 'openai';
      model: string;
    }
  | {
      ok: false;
      reason:
        | 'unconfigured'
        | 'timeout'
        | 'rate_limited'
        | 'auth_error'
        | 'provider_error'
        | 'invalid_schema';
      message: string;
    };

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function generateStructuredJson<T>(options: {
  systemInstruction: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  timeoutMs?: number;
}): Promise<StructuredAiResult<T>> {
  const config = getAiConfig();
  if (!config) {
    return {
      ok: false,
      reason: 'unconfigured',
      message: 'No AI API key configured in environment.',
    };
  }

  const totalTimeoutMs = options.timeoutMs ?? 20_000;
  const deadlineMs = Date.now() + totalTimeoutMs;

  try {
    let rawText = '';
    let activeModel = config.model;

    if (config.provider === 'gemini') {
      const candidateModels = getGeminiCandidateModels(config.model);

      let lastRes: Response | null = null;
      let sawTimeout = false;

      for (let i = 0; i < candidateModels.length; i++) {
        const remainingMs = deadlineMs - Date.now();
        if (remainingMs <= 0) {
          sawTimeout = true;
          break;
        }

        const candidateModel = candidateModels[i];
        activeModel = candidateModel;
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          candidateModel
        )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

        // Cap each fallback attempt so one stalled model leaves budget for healthy fallbacks.
        const attemptMs =
          i < candidateModels.length - 1 ? Math.min(10_000, remainingMs) : remainingMs;
        const attemptController = new AbortController();
        const attemptTimer = setTimeout(() => attemptController.abort(), attemptMs);

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: attemptController.signal,
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: options.systemInstruction }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: options.userPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.25,
                responseMimeType: 'application/json',
              },
            }),
          });

          lastRes = res;
          // Try next available Gemini model when current model is removed (404),
          // quota-exhausted (429), or temporarily overloaded (503).
          if (res.status === 404 || res.status === 429 || res.status === 503) {
            continue;
          }
          break;
        } catch (attemptErr) {
          if (attemptErr instanceof Error && attemptErr.name === 'AbortError') {
            sawTimeout = true;
            continue;
          }
          throw attemptErr;
        } finally {
          clearTimeout(attemptTimer);
        }
      }

      if (!lastRes) {
        return {
          ok: false,
          reason: sawTimeout ? 'timeout' : 'provider_error',
          message: sawTimeout
            ? 'AI request timed out.'
            : 'Failed to reach any configured Gemini model.',
        };
      }

      if (!lastRes.ok) {
        const status = lastRes.status;
        const reason =
          status === 429
            ? 'rate_limited'
            : status === 401 || status === 403
              ? 'auth_error'
              : 'provider_error';
        return {
          ok: false,
          reason,
          message: `Gemini API returned HTTP ${status}`,
        };
      }

      const payload = (await lastRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } else {
      const openaiController = new AbortController();
      const openaiTimer = setTimeout(() => openaiController.abort(), totalTimeoutMs);
      let res: Response;
      try {
        res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          signal: openaiController.signal,
          body: JSON.stringify({
            model: config.model,
            temperature: 0.25,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: options.systemInstruction },
              { role: 'user', content: options.userPrompt },
            ],
          }),
        });
      } finally {
        clearTimeout(openaiTimer);
      }

      if (!res.ok) {
        const reason =
          res.status === 429
            ? 'rate_limited'
            : res.status === 401 || res.status === 403
              ? 'auth_error'
              : 'provider_error';
        return {
          ok: false,
          reason,
          message: `OpenAI API returned HTTP ${res.status}`,
        };
      }

      const payload = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      rawText = payload.choices?.[0]?.message?.content ?? '';
    }

    const parsedJson = JSON.parse(extractJsonText(rawText)) as unknown;
    const validated = options.schema.safeParse(parsedJson);
    if (!validated.success) {
      return {
        ok: false,
        reason: 'invalid_schema',
        message: 'AI output did not satisfy required JSON schema.',
      };
    }

    return {
      ok: true,
      data: validated.data,
      provider: config.provider,
      model: activeModel,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        reason: 'timeout',
        message: 'AI request timed out.',
      };
    }
    return {
      ok: false,
      reason: 'provider_error',
      message: 'Failed to parse or retrieve structured AI response.',
    };
  }
}
