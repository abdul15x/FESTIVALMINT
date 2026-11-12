/**
 * Environment & External Integration Readiness Diagnostic for FESTIVALMINT AI.
 * Safely reports non-secret presence, structural validity, external auth, and
 * full-integration verification status without ever printing secret values.
 *
 * Usage:
 *   npm run readiness           # Safe offline structural & .env.local inspection
 *   npm run readiness -- --live # Also tests live external services when valid keys exist
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  getAiConfig,
  getDetailedIntegrationDiagnostics,
  getPublicSupabaseEnv,
  getServerSupabaseServiceKey,
} from '@/lib/env';
import {
  CheckoutPaymentIntent,
  createPayPalClient,
  extractPayPalErrorInfo,
} from '@/lib/paypal/client';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return false;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).trim();
    }
    if (!process.env[key]) process.env[key] = val;
  }
  return true;
}

async function runLiveChecks(diag) {
  // 1. Live Supabase Auth / Schema / Storage check
  if (diag.supabasePublic.structurallyValid && diag.supabaseServer.structurallyValid) {
    try {
      const { url } = getPublicSupabaseEnv();
      const serviceKey = getServerSupabaseServiceKey();
      const adminDb = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: listErr } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (listErr) {
        diag.supabaseServer.externalAuth = 'failed';
      } else {
        diag.supabasePublic.externalAuth = 'verified';
        diag.supabaseServer.externalAuth = 'verified';

        const [{ error: tblErr }, { data: buckets }] = await Promise.all([
          adminDb.from('events').select('id', { count: 'exact', head: true }),
          adminDb.storage.listBuckets(),
        ]);
        const hasEvidenceBucket = Boolean(buckets?.some((b) => b.id === 'evidence' && !b.public));
        if (!tblErr && hasEvidenceBucket) {
          diag.supabasePublic.fullIntegration = 'verified';
          diag.supabaseServer.fullIntegration = 'verified';
        }
      }
    } catch {
      diag.supabaseServer.externalAuth = 'failed';
    }
  }

  // 2. Live Gemini check
  const aiCfg = getAiConfig();
  if (aiCfg && aiCfg.provider === 'gemini') {
    const candidateModels = [
      aiCfg.model,
      ...['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'].filter(
        (m) => m !== aiCfg.model
      ),
    ];
    try {
      let verified = false;
      for (const candidateModel of candidateModels) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          candidateModel
        )}:generateContent?key=${encodeURIComponent(aiCfg.apiKey)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Return JSON: {"ok":true}' }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          diag.gemini.externalAuth = 'verified';
          diag.gemini.fullIntegration = 'verified';
          diag.gemini.model = candidateModel;
          verified = true;
          break;
        }
        if (res.status !== 404) {
          break;
        }
      }
      if (!verified) {
        diag.gemini.externalAuth = 'failed';
      }
    } catch {
      diag.gemini.externalAuth = 'failed';
    }
  }

  // 3. Live PayPal Sandbox OAuth + Order create check
  if (diag.paypalServer.structurallyValid) {
    const bundle = createPayPalClient();
    if (bundle) {
      try {
        const token = await bundle.client.clientCredentialsAuthManager.fetchToken();
        if (token.accessToken) {
          diag.paypalServer.externalAuth = 'verified';
          const orderRes = await bundle.ordersController.createOrder({
            body: {
              intent: CheckoutPaymentIntent.Capture,
              purchaseUnits: [
                {
                  referenceId: 'readiness-check',
                  amount: { currencyCode: 'USD', value: '1.00' },
                },
              ],
            },
            prefer: 'return=representation',
          });
          if (orderRes.result.id) {
            diag.paypalServer.fullIntegration = 'verified';
          }
        }
      } catch (err) {
        const mapped = extractPayPalErrorInfo(err);
        diag.paypalServer.externalAuth = 'failed';
        console.error(`PayPal live check failed (${mapped.httpStatus} ${mapped.code}): ${mapped.message}`);
      }
    }
  }
}

async function main() {
  const hasEnvLocal = loadEnvLocal();
  const isLiveMode = process.argv.includes('--live');
  const diagnostics = getDetailedIntegrationDiagnostics();

  if (isLiveMode) {
    await runLiveChecks(diagnostics);
  }

  console.log(
    JSON.stringify(
      {
        envLocalFound: hasEnvLocal,
        mode: isLiveMode ? 'live_verification' : 'offline_structural_check',
        diagnostics,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Readiness check error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
