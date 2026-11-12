import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
} from '@paypal/paypal-server-sdk';
import { getPayPalServerEnv } from '@/lib/env';

export { CheckoutPaymentIntent };

export function createPayPalClient() {
  const cfg = getPayPalServerEnv();
  if (!cfg.configured) {
    return null;
  }

  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: cfg.clientId,
      oAuthClientSecret: cfg.clientSecret,
    },
    timeout: 15_000,
    environment: cfg.env === 'live' ? Environment.Production : Environment.Sandbox,
  });

  return {
    client,
    ordersController: new OrdersController(client),
    env: cfg.env,
    baseUrl:
      cfg.env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    webhookId: cfg.webhookId,
  };
}

export async function verifyPayPalWebhookSignature(params: {
  headers: Headers;
  rawBody: Record<string, unknown>;
}): Promise<{ verified: boolean; reason?: string }> {
  const cfg = getPayPalServerEnv();
  if (!cfg.webhookConfigured) {
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

  const baseUrl =
    cfg.env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });

  if (!tokenRes.ok) {
    return { verified: false, reason: 'Failed to obtain PayPal OAuth token for webhook verify.' };
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    return { verified: false, reason: 'PayPal OAuth token missing access_token.' };
  }

  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
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
  });

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
