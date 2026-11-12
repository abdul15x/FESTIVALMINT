import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { getAiConfig, getIntegrationReadiness, getPublicSupabaseEnv, isConfiguredValue } from '@/lib/env';
import { generateStructuredJson } from '@/lib/ai/client';

test('isConfiguredValue and env helpers reject template placeholders and accept real values', () => {
  assert.equal(isConfiguredValue(''), false);
  assert.equal(isConfiguredValue('https://your-project-ref.supabase.co'), false);
  assert.equal(isConfiguredValue('your-supabase-anon-key'), false);
  assert.equal(isConfiguredValue('your-supabase-service-role-key'), false);
  assert.equal(isConfiguredValue('https://abcdefg.supabase.co'), true);

  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const prevService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-supabase-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-supabase-service-role-key';

    const sb = getPublicSupabaseEnv();
    assert.equal(sb.configured, false);
    const readiness = getIntegrationReadiness();
    assert.equal(readiness.supabasePublic, false);
    assert.equal(readiness.supabaseAdmin, false);
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevAnon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = prevService;
  }
});

test('generateStructuredJson maps Gemini 429 rate limits, 401 auth errors, timeouts, invalid JSON, and valid responses', async () => {
  const prevProvider = process.env.AI_PROVIDER;
  const prevGeminiKey = process.env.GEMINI_API_KEY;
  const prevFetch = globalThis.fetch;
  const testSchema = z.object({ okLabel: z.string().min(2) });

  try {
    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;

    const unconfigured = await generateStructuredJson({
      systemInstruction: 'sys',
      userPrompt: 'usr',
      schema: testSchema,
    });
    assert.equal(unconfigured.ok, false);
    if (!unconfigured.ok) {
      assert.equal(unconfigured.reason, 'unconfigured');
    }

    process.env.GEMINI_API_KEY = 'AIzaTestMockKeyForUnitTestsOnly12345';
    assert.equal(getAiConfig()?.provider, 'gemini');

    // 429 rate-limit check
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'rate limit' }), { status: 429 })) as typeof fetch;
    const rateLimited = await generateStructuredJson({
      systemInstruction: 'sys',
      userPrompt: 'usr',
      schema: testSchema,
    });
    assert.equal(rateLimited.ok, false);
    if (!rateLimited.ok) {
      assert.equal(rateLimited.reason, 'rate_limited');
    }

    // 401 auth error check
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })) as typeof fetch;
    const authErr = await generateStructuredJson({
      systemInstruction: 'sys',
      userPrompt: 'usr',
      schema: testSchema,
    });
    assert.equal(authErr.ok, false);
    if (!authErr.ok) {
      assert.equal(authErr.reason, 'auth_error');
    }

    // AbortError timeout check
    globalThis.fetch = (async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }) as typeof fetch;
    const timedOut = await generateStructuredJson({
      systemInstruction: 'sys',
      userPrompt: 'usr',
      schema: testSchema,
    });
    assert.equal(timedOut.ok, false);
    if (!timedOut.ok) {
      assert.equal(timedOut.reason, 'timeout');
    }

    // Invalid schema check
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"wrong":1}' }] } }] }),
        { status: 200 }
      )) as typeof fetch;
    const badSchema = await generateStructuredJson({
      systemInstruction: 'sys',
      userPrompt: 'usr',
      schema: testSchema,
    });
    assert.equal(badSchema.ok, false);
    if (!badSchema.ok) {
      assert.equal(badSchema.reason, 'invalid_schema');
    }

    // Valid structured JSON check
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"okLabel":"verified"}' }] } }] }),
        { status: 200 }
      )) as typeof fetch;
    const success = await generateStructuredJson({
      systemInstruction: 'sys',
      userPrompt: 'usr',
      schema: testSchema,
    });
    assert.equal(success.ok, true);
    if (success.ok) {
      assert.equal(success.provider, 'gemini');
      assert.equal(success.data.okLabel, 'verified');
    }
  } finally {
    globalThis.fetch = prevFetch;
    if (prevProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = prevProvider;
    if (prevGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevGeminiKey;
  }
});

