import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  classifySupabasePublicKeyFormat,
  classifySupabaseSecretKeyFormat,
  getAiConfig,
  getDetailedIntegrationDiagnostics,
  getIntegrationReadiness,
  getPublicSupabaseEnv,
  isConfiguredValue,
} from '@/lib/env';
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

    // Modern Supabase Publishable + Secret key format support
    assert.equal(classifySupabasePublicKeyFormat('sb_publishable_TestKey1234567890'), 'publishable');
    assert.equal(classifySupabaseSecretKeyFormat('sb_secret_TestSecretKey1234567890'), 'secret');

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefg.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_TestKey1234567890';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_TestSecretKey1234567890';

    const diag = getDetailedIntegrationDiagnostics();
    assert.equal(diag.supabasePublic.status, 'configured');
    assert.equal(diag.supabasePublic.keyFormat, 'publishable');
    assert.equal(diag.supabaseServer.status, 'configured');
    assert.equal(diag.supabaseServer.keyFormat, 'secret');
    assert.equal(diag.supabasePublic.externalAuth, 'not_verified');
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

    // 404 model deprecation fallback check
    const requestedUrls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      requestedUrls.push(url);
      if (requestedUrls.length === 1) {
        return new Response(
          JSON.stringify({ error: { code: 404, message: 'model not available' } }),
          { status: 404 }
        );
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"okLabel":"fallback_ok"}' }] } }] }),
        { status: 200 }
      );
    }) as typeof fetch;
    const prevModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    try {
      const fallbackRes = await generateStructuredJson({
        systemInstruction: 'sys',
        userPrompt: 'usr',
        schema: testSchema,
      });
      assert.equal(fallbackRes.ok, true);
      if (fallbackRes.ok) {
        assert.equal(fallbackRes.data.okLabel, 'fallback_ok');
        assert.equal(fallbackRes.model, 'gemini-3.1-flash-lite');
      }
      assert.equal(requestedUrls.length, 2);
    } finally {
      if (prevModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevModel;
    }

    // 429 per-model quota fallback check
    const quotaUrls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      quotaUrls.push(url);
      if (quotaUrls.length === 1) {
        return new Response(JSON.stringify({ error: { code: 429, message: 'quota exceeded' } }), {
          status: 429,
        });
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"okLabel":"quota_fallback_ok"}' }] } }] }),
        { status: 200 }
      );
    }) as typeof fetch;
    const prevModelQuota = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-3-flash-preview';
    try {
      const quotaFallbackRes = await generateStructuredJson({
        systemInstruction: 'sys',
        userPrompt: 'usr',
        schema: testSchema,
      });
      assert.equal(quotaFallbackRes.ok, true);
      if (quotaFallbackRes.ok) {
        assert.equal(quotaFallbackRes.data.okLabel, 'quota_fallback_ok');
        assert.equal(quotaFallbackRes.model, 'gemini-3.1-flash-lite');
      }
      assert.equal(quotaUrls.length, 2);
    } finally {
      if (prevModelQuota === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevModelQuota;
    }

    // Per-model timeout fallback check
    let timeoutCalls = 0;
    globalThis.fetch = (async () => {
      timeoutCalls += 1;
      if (timeoutCalls === 1) {
        const err = new Error('model stalled');
        err.name = 'AbortError';
        throw err;
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"okLabel":"timeout_recovered"}' }] } }] }),
        { status: 200 }
      );
    }) as typeof fetch;
    const prevTimeoutModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-3.5-flash';
    try {
      const timeoutRecovered = await generateStructuredJson({
        systemInstruction: 'sys',
        userPrompt: 'usr',
        schema: testSchema,
      });
      assert.equal(timeoutRecovered.ok, true);
      if (timeoutRecovered.ok) {
        assert.equal(timeoutRecovered.data.okLabel, 'timeout_recovered');
        assert.equal(timeoutRecovered.model, 'gemini-3.1-flash-lite');
      }
      assert.equal(timeoutCalls, 2);
    } finally {
      if (prevTimeoutModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevTimeoutModel;
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

test('diagnostics accept AQ.* Gemini keys and flag identical PayPal Client ID and Secret', () => {
  const prevGeminiKey = process.env.GEMINI_API_KEY;
  const prevProvider = process.env.AI_PROVIDER;
  const prevPpId = process.env.PAYPAL_CLIENT_ID;
  const prevPpSecret = process.env.PAYPAL_CLIENT_SECRET;

  try {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'AQ.TestMockGeminiKeyFormat1234567890abcdefghij';

    const sampleClientId = 'AUj8MockPayPalClientIdForStructuralValidationOnly0123456789';
    process.env.PAYPAL_CLIENT_ID = sampleClientId;
    process.env.PAYPAL_CLIENT_SECRET = sampleClientId;

    const diag = getDetailedIntegrationDiagnostics();
    assert.equal(diag.gemini.structurallyValid, true);
    assert.equal(diag.gemini.status, 'configured');

    assert.equal(diag.paypalServer.clientIdValid, true);
    assert.equal(diag.paypalServer.clientIdEqualsSecret, true);
    assert.equal(diag.paypalServer.clientSecretValid, false);
    assert.equal(diag.paypalServer.structurallyValid, false);
    assert.equal(diag.paypalServer.status, 'invalid_format');
  } finally {
    if (prevGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevGeminiKey;
    if (prevProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = prevProvider;
    if (prevPpId === undefined) delete process.env.PAYPAL_CLIENT_ID;
    else process.env.PAYPAL_CLIENT_ID = prevPpId;
    if (prevPpSecret === undefined) delete process.env.PAYPAL_CLIENT_SECRET;
    else process.env.PAYPAL_CLIENT_SECRET = prevPpSecret;
  }
});

