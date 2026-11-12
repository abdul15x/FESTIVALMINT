/**
 * Safe runtime environment checks for FESTIVALMINT AI.
 * Keeps secrets strictly server-side and provides clear diagnostics
 * when external service credentials have not yet been supplied.
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

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}

export function getServerSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
}

export function getAiConfig() {
  const preferred = (process.env.AI_PROVIDER?.trim().toLowerCase() || 'gemini') as
    | 'gemini'
    | 'openai';
  const genericKey = process.env.AI_API_KEY?.trim() || '';
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    (preferred !== 'openai' || genericKey.startsWith('AIza') ? genericKey : '');
  const openaiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    (preferred === 'openai' || genericKey.startsWith('sk-') ? genericKey : '');

  if (preferred === 'openai' && openaiKey) {
    return {
      provider: 'openai' as const,
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    };
  }
  if (geminiKey) {
    return {
      provider: 'gemini' as const,
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
    };
  }
  if (openaiKey) {
    return {
      provider: 'openai' as const,
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    };
  }
  return null;
}

export function getPayPalServerEnv() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() || '';
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim() || '';
  const env = process.env.PAYPAL_ENV?.trim().toLowerCase() === 'live' ? 'live' : 'sandbox';

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
  const publicPayPalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || paypal.clientId;

  return {
    supabasePublic: sb.configured,
    supabaseAdmin: Boolean(sb.configured && sbService),
    aiProvider: ai ? ai.provider : null,
    paypalServer: paypal.configured,
    paypalClient: Boolean(publicPayPalClientId),
    paypalWebhook: paypal.webhookConfigured,
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000',
  };
}

