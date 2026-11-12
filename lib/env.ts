/**
 * Safe runtime environment checks for FESTIVALMINT AI.
 * Keeps secrets strictly server-side and provides clear diagnostics
 * when external service credentials are missing or still template placeholders.
 */

export interface IntegrationReadiness {
  supabasePublic: boolean;
  supabaseAdmin: boolean;
  aiProvider: 'gemini' | 'openai' | null;
  paypalServer: boolean;
  paypalClient: boolean;
  paypalWebhook: boolean;
  appUrl: string;
}

const PLACEHOLDER_PATTERNS = [
  /^your[-_]/i,
  /your-project-ref\.supabase\.co/i,
  /your-supabase-anon-key/i,
  /your-supabase-service-role-key/i,
  /your-gemini-api-key/i,
  /your-openai-api-key/i,
  /your-sandbox-/i,
  /placeholder/i,
];

function readEnv(name: string): string {
  const raw = process.env[name]?.trim() || '';
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

export function isConfiguredValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function getPublicSupabaseEnv() {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const validUrl = isConfiguredValue(url) && /^https?:\/\//i.test(url);
  const validAnon = isConfiguredValue(anonKey);

  return {
    url: validUrl ? url : '',
    anonKey: validAnon ? anonKey : '',
    configured: Boolean(validUrl && validAnon),
  };
}

export function getServerSupabaseServiceKey(): string {
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  return isConfiguredValue(key) ? key : '';
}

export function getAiConfig() {
  const rawPreferred = readEnv('AI_PROVIDER').toLowerCase();
  const preferred = rawPreferred === 'openai' ? ('openai' as const) : ('gemini' as const);
  const genericRaw = readEnv('AI_API_KEY');
  const genericKey = isConfiguredValue(genericRaw) ? genericRaw : '';

  const geminiExplicit = readEnv('GEMINI_API_KEY');
  const geminiKey =
    (isConfiguredValue(geminiExplicit) ? geminiExplicit : '') ||
    (preferred !== 'openai' || genericKey.startsWith('AIza') ? genericKey : '');

  const openaiExplicit = readEnv('OPENAI_API_KEY');
  const openaiKey =
    (isConfiguredValue(openaiExplicit) ? openaiExplicit : '') ||
    (preferred === 'openai' || genericKey.startsWith('sk-') ? genericKey : '');

  if (preferred === 'openai' && openaiKey) {
    return {
      provider: 'openai' as const,
      apiKey: openaiKey,
      model: readEnv('OPENAI_MODEL') || 'gpt-4o-mini',
    };
  }
  if (geminiKey) {
    return {
      provider: 'gemini' as const,
      apiKey: geminiKey,
      model: readEnv('GEMINI_MODEL') || 'gemini-2.5-flash',
    };
  }
  if (openaiKey) {
    return {
      provider: 'openai' as const,
      apiKey: openaiKey,
      model: readEnv('OPENAI_MODEL') || 'gpt-4o-mini',
    };
  }
  return null;
}

export function getPayPalServerEnv() {
  const rawClientId = readEnv('PAYPAL_CLIENT_ID');
  const rawClientSecret = readEnv('PAYPAL_CLIENT_SECRET');
  const rawWebhookId = readEnv('PAYPAL_WEBHOOK_ID');

  const clientId = isConfiguredValue(rawClientId) ? rawClientId : '';
  const clientSecret = isConfiguredValue(rawClientSecret) ? rawClientSecret : '';
  const webhookId = isConfiguredValue(rawWebhookId) ? rawWebhookId : '';
  const env = readEnv('PAYPAL_ENV').toLowerCase() === 'live' ? 'live' : 'sandbox';

  return {
    env,
    clientId,
    clientSecret,
    webhookId,
    configured: Boolean(clientId && clientSecret),
    webhookConfigured: Boolean(clientId && clientSecret && webhookId),
  };
}

export function getIntegrationReadiness(): IntegrationReadiness {
  const sb = getPublicSupabaseEnv();
  const sbService = getServerSupabaseServiceKey();
  const ai = getAiConfig();
  const paypal = getPayPalServerEnv();
  const explicitPublicPayPal = readEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID');
  const publicPayPalClientId =
    (isConfiguredValue(explicitPublicPayPal) ? explicitPublicPayPal : '') || paypal.clientId;

  return {
    supabasePublic: sb.configured,
    supabaseAdmin: Boolean(sb.configured && sbService),
    aiProvider: ai ? ai.provider : null,
    paypalServer: paypal.configured,
    paypalClient: Boolean(publicPayPalClientId),
    paypalWebhook: paypal.webhookConfigured,
    appUrl: readEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
  };
}
