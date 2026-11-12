/**
 * Safe runtime environment checks for FESTIVALMINT AI.
 * Keeps secrets strictly server-side and provides structured diagnostics
 * distinguishing missing, placeholder, malformed, and configured credentials.
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

export type CredentialStatus = 'configured' | 'missing' | 'placeholder' | 'invalid_format';
export type VerificationStage = 'not_verified' | 'verified' | 'failed';

export interface DetailedIntegrationDiagnostics {
  supabasePublic: {
    present: boolean;
    structurallyValid: boolean;
    status: CredentialStatus;
    urlValid: boolean;
    keyFormat: 'publishable' | 'legacy_jwt' | 'unknown' | 'none';
    externalAuth: VerificationStage;
    fullIntegration: VerificationStage;
  };
  supabaseServer: {
    present: boolean;
    structurallyValid: boolean;
    status: CredentialStatus;
    keyFormat: 'secret' | 'legacy_jwt' | 'unknown' | 'none';
    externalAuth: VerificationStage;
    fullIntegration: VerificationStage;
  };
  gemini: {
    providerConfigured: 'gemini' | 'openai';
    present: boolean;
    structurallyValid: boolean;
    status: CredentialStatus;
    model: string;
    externalAuth: VerificationStage;
    fullIntegration: VerificationStage;
  };
  paypalServer: {
    env: 'sandbox' | 'live';
    present: boolean;
    clientIdValid: boolean;
    clientSecretValid: boolean;
    structurallyValid: boolean;
    status: CredentialStatus;
    externalAuth: VerificationStage;
    fullIntegration: VerificationStage;
  };
  paypalBrowserClient: {
    present: boolean;
    matchesServerClientId: boolean | null;
    usingServerClientIdFallback: boolean;
    structurallyValid: boolean;
    status: CredentialStatus;
    fullIntegration: VerificationStage;
  };
  paypalWebhook: {
    present: boolean;
    structurallyValid: boolean;
    status: CredentialStatus;
    fullIntegration: VerificationStage;
  };
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

export function isPlaceholderValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isConfiguredValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !isPlaceholderValue(trimmed);
}

export function classifySupabasePublicKeyFormat(
  key: string
): 'publishable' | 'legacy_jwt' | 'unknown' | 'none' {
  if (!key || isPlaceholderValue(key)) return 'none';
  if (/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(key)) return 'publishable';
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return 'legacy_jwt';
  return 'unknown';
}

export function classifySupabaseSecretKeyFormat(
  key: string
): 'secret' | 'legacy_jwt' | 'unknown' | 'none' {
  if (!key || isPlaceholderValue(key)) return 'none';
  if (/^sb_secret_[A-Za-z0-9_-]{12,}$/.test(key)) return 'secret';
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return 'legacy_jwt';
  return 'unknown';
}

export function isValidSupabaseUrl(url: string): boolean {
  if (!isConfiguredValue(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function isValidGeminiKey(key: string): boolean {
  return isConfiguredValue(key) && /^AIza[A-Za-z0-9_-]{20,}$/.test(key);
}

export function isValidPayPalCredentialFormat(value: string): boolean {
  return isConfiguredValue(value) && /^[A-Za-z0-9_-]{40,}$/.test(value);
}

export function isValidPayPalWebhookFormat(value: string): boolean {
  return isConfiguredValue(value) && /^[A-Za-z0-9_-]{10,}$/.test(value);
}

export function getPublicSupabaseEnv() {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const validUrl = isValidSupabaseUrl(url);
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

export function getDetailedIntegrationDiagnostics(): DetailedIntegrationDiagnostics {
  const rawSbUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const rawSbPublic = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const rawSbSecret = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  const sbUrlValid = isValidSupabaseUrl(rawSbUrl);
  const sbPublicFormat = classifySupabasePublicKeyFormat(rawSbPublic);
  const sbPublicValid = sbUrlValid && (sbPublicFormat === 'publishable' || sbPublicFormat === 'legacy_jwt');

  const sbPublicStatus: CredentialStatus = !rawSbUrl || !rawSbPublic
    ? 'missing'
    : isPlaceholderValue(rawSbUrl) || isPlaceholderValue(rawSbPublic)
      ? 'placeholder'
      : sbPublicValid
        ? 'configured'
        : 'invalid_format';

  const sbSecretFormat = classifySupabaseSecretKeyFormat(rawSbSecret);
  const sbSecretValid = sbUrlValid && (sbSecretFormat === 'secret' || sbSecretFormat === 'legacy_jwt');
  const sbServerStatus: CredentialStatus = !rawSbSecret
    ? 'missing'
    : isPlaceholderValue(rawSbSecret)
      ? 'placeholder'
      : sbSecretValid
        ? 'configured'
        : 'invalid_format';

  const providerConfigured = readEnv('AI_PROVIDER').toLowerCase() === 'openai' ? 'openai' : 'gemini';
  const rawGemini = readEnv('GEMINI_API_KEY') || (providerConfigured === 'gemini' ? readEnv('AI_API_KEY') : '');
  const geminiValid = isValidGeminiKey(rawGemini);
  const geminiStatus: CredentialStatus = !rawGemini
    ? 'missing'
    : isPlaceholderValue(rawGemini)
      ? 'placeholder'
      : geminiValid
        ? 'configured'
        : 'invalid_format';

  const paypalEnvMode = readEnv('PAYPAL_ENV').toLowerCase() === 'live' ? 'live' : 'sandbox';
  const rawPayPalClientId = readEnv('PAYPAL_CLIENT_ID');
  const rawPayPalSecret = readEnv('PAYPAL_CLIENT_SECRET');
  const clientIdValid = isValidPayPalCredentialFormat(rawPayPalClientId);
  const clientSecretValid = isValidPayPalCredentialFormat(rawPayPalSecret);
  const paypalServerValid = clientIdValid && clientSecretValid;
  const paypalServerStatus: CredentialStatus = !rawPayPalClientId || !rawPayPalSecret
    ? 'missing'
    : isPlaceholderValue(rawPayPalClientId) || isPlaceholderValue(rawPayPalSecret)
      ? 'placeholder'
      : paypalServerValid
        ? 'configured'
        : 'invalid_format';

  const rawPublicPayPal = readEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID');
  const publicPayPalPresent = Boolean(rawPublicPayPal);
  const effectivePublicPayPal = rawPublicPayPal || (clientIdValid ? rawPayPalClientId : '');
  const publicPayPalValid = isValidPayPalCredentialFormat(effectivePublicPayPal);
  const browserStatus: CredentialStatus = !rawPublicPayPal
    ? 'missing'
    : isPlaceholderValue(rawPublicPayPal)
      ? 'placeholder'
      : isValidPayPalCredentialFormat(rawPublicPayPal)
        ? 'configured'
        : 'invalid_format';

  const rawWebhookId = readEnv('PAYPAL_WEBHOOK_ID');
  const webhookValid = isValidPayPalWebhookFormat(rawWebhookId);
  const webhookStatus: CredentialStatus = !rawWebhookId
    ? 'missing'
    : isPlaceholderValue(rawWebhookId)
      ? 'placeholder'
      : webhookValid
        ? 'configured'
        : 'invalid_format';

  return {
    supabasePublic: {
      present: Boolean(rawSbUrl && rawSbPublic && !isPlaceholderValue(rawSbUrl) && !isPlaceholderValue(rawSbPublic)),
      structurallyValid: sbPublicValid,
      status: sbPublicStatus,
      urlValid: sbUrlValid,
      keyFormat: sbPublicFormat,
      externalAuth: 'not_verified',
      fullIntegration: 'not_verified',
    },
    supabaseServer: {
      present: Boolean(rawSbSecret && !isPlaceholderValue(rawSbSecret)),
      structurallyValid: sbSecretValid,
      status: sbServerStatus,
      keyFormat: sbSecretFormat,
      externalAuth: 'not_verified',
      fullIntegration: 'not_verified',
    },
    gemini: {
      providerConfigured,
      present: Boolean(rawGemini && !isPlaceholderValue(rawGemini)),
      structurallyValid: geminiValid,
      status: geminiStatus,
      model: readEnv('GEMINI_MODEL') || 'gemini-2.5-flash',
      externalAuth: 'not_verified',
      fullIntegration: 'not_verified',
    },
    paypalServer: {
      env: paypalEnvMode,
      present: Boolean(rawPayPalClientId && rawPayPalSecret),
      clientIdValid,
      clientSecretValid,
      structurallyValid: paypalServerValid,
      status: paypalServerStatus,
      externalAuth: 'not_verified',
      fullIntegration: 'not_verified',
    },
    paypalBrowserClient: {
      present: publicPayPalPresent,
      matchesServerClientId:
        publicPayPalPresent && rawPayPalClientId ? rawPublicPayPal === rawPayPalClientId : null,
      usingServerClientIdFallback: !publicPayPalPresent && Boolean(rawPayPalClientId),
      structurallyValid: publicPayPalValid,
      status: browserStatus,
      fullIntegration: 'not_verified',
    },
    paypalWebhook: {
      present: Boolean(rawWebhookId),
      structurallyValid: webhookValid,
      status: webhookStatus,
      fullIntegration: 'not_verified',
    },
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
