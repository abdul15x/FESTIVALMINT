import { z } from 'zod';
import { getAiConfig } from '@/lib/env';

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    let rawText = '';
    let activeModel = config.model;

    if (config.provider === 'gemini') {
      const candidateModels = [
        config.model,
        ...['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'].filter(
          (m) => m !== config.model
        ),
      ];

      let lastRes: Response | null = null;
      for (const candidateModel of candidateModels) {
        activeModel = candidateModel;
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          candidateModel
        )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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
        if (res.status === 404) {
          continue;
        }
        break;
      }

      if (!lastRes || !lastRes.ok) {
        const status = lastRes?.status ?? 500;
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
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        signal: controller.signal,
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
  } finally {
    clearTimeout(timer);
  }
}
