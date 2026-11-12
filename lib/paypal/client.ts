import {
  AbortError,
  ApiError,
  ArgumentsValidationError,
  CheckoutPaymentIntent,
  Client,
  CustomError,
  Environment,
  OrdersController,
  ResponseValidationError,
} from '@paypal/paypal-server-sdk';
import type {
  HttpClientOptions,
  OAuthToken,
  RetryConfiguration,
} from '@paypal/paypal-server-sdk';
import { getPayPalServerEnv } from '@/lib/env';

export {
  AbortError,
  ApiError,
  ArgumentsValidationError,
  CheckoutPaymentIntent,
  Client,
  CustomError,
  Environment,
  OrdersController,
  ResponseValidationError,
};

const DEFAULT_PAYPAL_TIMEOUT_MS = 15_000;

export interface PayPalSdkClientBundle {
  client: Client;
  ordersController: OrdersController;
  env: 'sandbox' | 'live';
  baseUrl: string;
  webhookId: string;
}

export interface CreatePayPalSdkClientOptions {
  clientId: string;
  clientSecret: string;
  env: 'sandbox' | 'live';
  webhookId?: string;
  timeoutMs?: number;
  oAuthToken?: OAuthToken;
  retryConfig?: Partial<RetryConfiguration>;
  httpClientOptions?: Partial<HttpClientOptions>;
  unstable_httpClientOptions?: unknown;
}

/**
 * Constructs a PayPal Server SDK Client using APIMatic TypeScript SDK guidelines:
 * - Explicit non-zero `timeout` (SDK DEFAULT_CONFIGURATION.timeout is 0 = infinite wait)
 * - Explicit `retryConfig` (safe defaults: zero retries on mutating checkout POSTs)
 * - `oAuthClockSkew: 60` so OAuth tokens refresh early before expiration
 * - Optional `unstable_httpClientOptions` + `oAuthToken` seam for in-process stub testing
 */
export function createPayPalSdkClient(
  options: CreatePayPalSdkClientOptions
): PayPalSdkClientBundle {
  const timeout = options.timeoutMs ?? DEFAULT_PAYPAL_TIMEOUT_MS;
  const environment =
    options.env === 'live' ? Environment.Production : Environment.Sandbox;

  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: options.clientId,
      oAuthClientSecret: options.clientSecret,
      oAuthClockSkew: 60,
      ...(options.oAuthToken ? { oAuthToken: options.oAuthToken } : {}),
    },
    timeout,
    environment,
    httpClientOptions: {
      timeout,
      ...options.httpClientOptions,
      retryConfig: {
        maxNumberOfRetries: 0,
        maximumRetryWaitTime: 0,
        retryOnTimeout: false,
        httpMethodsToRetry: ['GET'],
        ...options.httpClientOptions?.retryConfig,
        ...options.retryConfig,
      },
    },
    ...(options.unstable_httpClientOptions !== undefined
      ? { unstable_httpClientOptions: options.unstable_httpClientOptions }
      : {}),
  });

  return {
    client,
    ordersController: new OrdersController(client),
    env: options.env,
    baseUrl:
      options.env === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com',
    webhookId: options.webhookId ?? '',
  };
}

let cachedClientKey: string | null = null;
let cachedBundle: PayPalSdkClientBundle | null = null;

/**
 * Reuses a long-lived `Client` singleton per (env, clientId, clientSecret, webhookId)
 * tuple so HTTP connection pooling and in-memory OAuth tokens persist across requests.
 */
export function createPayPalClient(): PayPalSdkClientBundle | null {
  const cfg = getPayPalServerEnv();
  if (!cfg.configured) {
    return null;
  }

  const key = `${cfg.env}:${cfg.clientId}:${cfg.clientSecret}:${cfg.webhookId}`;
  if (cachedBundle && cachedClientKey === key) {
    return cachedBundle;
  }

  cachedBundle = createPayPalSdkClient({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    env: cfg.env === 'live' ? 'live' : 'sandbox',
    webhookId: cfg.webhookId,
  });
  cachedClientKey = key;
  return cachedBundle;
}

export type PayPalHttpStatus =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

function normalizePayPalHttpStatus(status: number): PayPalHttpStatus {
  switch (status) {
    case 400:
    case 401:
    case 403:
    case 404:
    case 409:
    case 422:
    case 429:
    case 500:
    case 502:
    case 503:
    case 504:
      return status;
    default:
      return status >= 400 && status < 500 ? 400 : 502;
  }
}

export interface PayPalExtractedError {
  httpStatus: PayPalHttpStatus;
  code: string;
  message: string;
  debugId?: string;
  details?: Array<{ issue?: string; description?: string; field?: string }>;
}

/**
 * Normalizes errors thrown by `@paypal/paypal-server-sdk` following the APIMatic
 * TypeScript error-handling pattern:
 * - `CustomError` preserves wire snake_case `name`, `message`, `debug_id`, `details`
 * - `OAuthProviderError` is shadowed by a same-named model enum in the SDK root barrel
 *   (which triggers TS2359 if used with `instanceof`), so OAuth errors are matched via
 *   `err instanceof ApiError` + payload shape inspection (`error` / `error_description`).
 */
export function extractPayPalErrorInfo(err: unknown): PayPalExtractedError {
  if (err instanceof AbortError) {
    return {
      httpStatus: 504,
      code: 'PAYPAL_TIMEOUT',
      message: 'PayPal Sandbox request timed out before completing.',
    };
  }

  if (err instanceof ArgumentsValidationError) {
    return {
      httpStatus: 400,
      code: 'PAYPAL_INVALID_ARGUMENTS',
      message: err.message || 'Invalid PayPal SDK request arguments.',
    };
  }

  if (err instanceof ResponseValidationError) {
    return {
      httpStatus: 502,
      code: 'PAYPAL_RESPONSE_VALIDATION_ERROR',
      message: err.message || 'PayPal returned an unexpected response payload.',
    };
  }

  if (err instanceof CustomError) {
    const status = normalizePayPalHttpStatus(err.statusCode);
    const wire = err.result;
    const firstDetail = wire?.details?.[0];
    const detailText =
      firstDetail?.description ?? firstDetail?.issue ?? wire?.message ?? err.message;

    return {
      httpStatus: status,
      code: wire?.name ? `PAYPAL_${wire.name}` : 'PAYPAL_API_ERROR',
      message: detailText || 'PayPal Orders API rejected the request.',
      debugId: wire?.debug_id,
      details: wire?.details?.map((d) => ({
        issue: d.issue,
        description: d.description,
        field: d.field,
      })),
    };
  }

  if (err instanceof ApiError) {
    const status = normalizePayPalHttpStatus(err.statusCode);
    const wireObj =
      typeof err.result === 'object' && err.result !== null
        ? (err.result as Record<string, unknown>)
        : null;

    if (wireObj && 'error' in wireObj) {
      const oauthDesc =
        typeof wireObj.error_description === 'string' ? wireObj.error_description : null;
      const oauthErr = typeof wireObj.error === 'string' ? wireObj.error : null;
      return {
        httpStatus: status === 502 ? 401 : status,
        code: 'PAYPAL_OAUTH_ERROR',
        message:
          oauthDesc ||
          (oauthErr ? `PayPal OAuth error: ${oauthErr}` : null) ||
          'PayPal Sandbox OAuth authentication failed. Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.',
      };
    }

    let parsedMessage: string | undefined;
    let parsedDebugId: string | undefined;

    if (typeof err.body === 'string' && err.body.trim().length > 0) {
      try {
        const raw = JSON.parse(err.body) as {
          message?: string;
          name?: string;
          debug_id?: string;
        };
        parsedMessage = raw.message || raw.name;
        parsedDebugId = raw.debug_id;
      } catch {
        parsedMessage = err.body.slice(0, 240);
      }
    }

    return {
      httpStatus: status,
      code: 'PAYPAL_API_ERROR',
      message: parsedMessage || err.message || `PayPal API returned HTTP ${status}.`,
      debugId: parsedDebugId,
    };
  }

  return {
    httpStatus: 500,
    code: 'PAYPAL_INTERNAL_ERROR',
    message: err instanceof Error ? err.message : 'Unexpected PayPal integration error.',
  };
}

/**
 * Verifies a PayPal webhook event signature using PayPal's official
 * `/v1/notifications/verify-webhook-signature` REST API.
 * Note: `@paypal/paypal-server-sdk@2.5.0` does not ship a Webhooks controller, so
 * we acquire the OAuth Bearer token via `client.clientCredentialsAuthManager` and
 * post the signature payload to PayPal's verification endpoint.
 */
export async function verifyPayPalWebhookSignature(params: {
  headers: Headers;
  rawBody: Record<string, unknown>;
}): Promise<{ verified: boolean; reason?: string }> {
  const cfg = getPayPalServerEnv();
  const paypal = createPayPalClient();
  if (!cfg.webhookConfigured || !paypal) {
    return {
      verified: false,
      reason: 'PAYPAL_WEBHOOK_ID / PayPal client credentials are not configured.',
    };
  }

  const authAlgo = params.headers.get('paypal-auth-algo');
  const certUrl = params.headers.get('paypal-cert-url');
  const transmissionId = params.headers.get('paypal-transmission-id');
  const transmissionSig = params.headers.get('paypal-transmission-sig');
  const transmissionTime = params.headers.get('paypal-transmission-time');

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return { verified: false, reason: 'Missing required PayPal webhook signature headers.' };
  }

  let accessToken: string;
  try {
    const token = await paypal.client.clientCredentialsAuthManager.fetchToken();
    if (!token.accessToken) {
      return { verified: false, reason: 'PayPal OAuth token missing accessToken.' };
    }
    accessToken = token.accessToken;
  } catch (err) {
    const extracted = extractPayPalErrorInfo(err);
    return {
      verified: false,
      reason: `Failed to obtain PayPal OAuth token for webhook verify: ${extracted.message}`,
    };
  }

  const verifyRes = await fetch(
    `${paypal.baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: cfg.webhookId,
        webhook_event: params.rawBody,
      }),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!verifyRes.ok) {
    return { verified: false, reason: `PayPal webhook verify HTTP ${verifyRes.status}.` };
  }

  const verifyJson = (await verifyRes.json()) as { verification_status?: string };
  if (verifyJson.verification_status !== 'SUCCESS') {
    return {
      verified: false,
      reason: `Verification status: ${verifyJson.verification_status ?? 'UNKNOWN'}`,
    };
  }

  return { verified: true };
}
