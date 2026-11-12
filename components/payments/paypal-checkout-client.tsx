'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CheckCircle2, FileBarChart2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';

interface ExistingPaymentInfo {
  id: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  captured_at: string | null;
}

export function PayPalCheckoutClient({
  proposalId,
  amountMinor,
  currency,
  proposalStatus,
  paypalClientId,
  paypalServerReady,
  existingPayment,
}: {
  proposalId: string;
  amountMinor: number;
  currency: string;
  proposalStatus: string;
  paypalClientId: string | null;
  paypalServerReady: boolean;
  existingPayment: ExistingPaymentInfo | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(proposalStatus);
  const [payment, setPayment] = useState<ExistingPaymentInfo | null>(existingPayment);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const createOrderPromiseRef = useRef<Promise<string> | null>(null);
  const captureInFlightRef = useRef(false);

  const isPaid = status === 'paid' || payment?.status === 'COMPLETED';
  const eligibleForCheckout = ['accepted', 'payment_pending'].includes(status);

  if (isPaid) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <CardTitle>PayPal Sandbox Payment Verified</CardTitle>
            <Badge variant="mint">COMPLETED</Badge>
          </div>
          <CardDescription>
            Server-side capture verification succeeded and sponsorship deliverables are now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5">
              <p className="text-xs text-slate-500">PayPal Order ID</p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-slate-900">
                {payment?.paypal_order_id ?? 'Recorded server-side'}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5">
              <p className="text-xs text-slate-500">PayPal Capture ID</p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-slate-900">
                {payment?.paypal_capture_id ?? 'Verified'}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5">
              <p className="text-xs text-slate-500">Verified Amount</p>
              <p className="mt-0.5 font-mono text-base font-bold text-slate-950">
                {formatMinorCurrency(payment?.amount_minor ?? amountMinor, payment?.currency ?? currency)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5">
              <p className="text-xs text-slate-500">Captured Timestamp</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">
                {payment?.captured_at ? formatShortDate(payment.captured_at) : 'Verified'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/sponsor/reports/${proposalId}`} className={buttonClasses('primary', 'md')}>
              <FileBarChart2 className="h-4 w-4" />
              View Deliverables &amp; Performance Report
            </Link>
            <Link href="/sponsor/proposals" className={buttonClasses('outline', 'md')}>
              Back to Proposals
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>PayPal Sandbox Checkout</CardTitle>
            <CardDescription>
              Order totals are locked on our server from the accepted proposal record and verified
              on capture via `@paypal/paypal-server-sdk`.
            </CardDescription>
          </div>
          <Badge variant="blue">Orders v2 Sandbox</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {processingMessage && <Alert tone="info">{processingMessage}</Alert>}

        {!eligibleForCheckout ? (
          <Alert tone="warning" title="Proposal Not Eligible for Checkout">
            Current proposal status is &ldquo;{status}&rdquo;. Only accepted or payment-pending
            proposals can initiate PayPal checkout.
          </Alert>
        ) : !paypalClientId || !paypalServerReady ? (
          <Alert tone="warning" title="PayPal Sandbox Credentials Required">
            <p className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Live PayPal Sandbox checkout buttons activate once credentials are configured.
            </p>
            <p className="mt-1 text-xs">
              Add <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>, <code>PAYPAL_CLIENT_ID</code>, and{' '}
              <code>PAYPAL_CLIENT_SECRET</code> in <code>.env.local</code> (see{' '}
              <code>CREDENTIALS_SETUP.md</code>). FestivalMint AI never simulates fake payment
              successes when keys are absent.
            </p>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Server-Verified Payment Summary
              </p>
              <p className="mt-1">
                Total charged in Sandbox:{' '}
                <strong className="font-mono text-slate-950">
                  {formatMinorCurrency(amountMinor, currency)}
                </strong>{' '}
                (<code>{currency.toUpperCase()}</code>). Sign in with your PayPal Sandbox Personal
                buyer account inside the popup.
              </p>
            </div>

            <div className="max-w-md">
              <PayPalScriptProvider
                options={{
                  clientId: paypalClientId,
                  currency: currency.toUpperCase(),
                  intent: 'capture',
                }}
              >
                <PayPalButtons
                  disabled={isCapturing}
                  style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                  createOrder={async () => {
                    if (isPaid || !eligibleForCheckout) {
                      throw new Error('Proposal is not eligible for PayPal checkout.');
                    }
                    if (createOrderPromiseRef.current) {
                      return createOrderPromiseRef.current;
                    }

                    setError(null);
                    setProcessingMessage('Verifying or preparing PayPal Sandbox order...');

                    const orderPromise = (async () => {
                      const res = await fetch('/api/paypal/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ proposalId }),
                      });
                      const json = await res.json();
                      if (!res.ok || !json.data?.orderId) {
                        const msg = json.message ?? 'Could not create PayPal Sandbox order.';
                        setError(msg);
                        throw new Error(msg);
                      }
                      const orderId = json.data.orderId as string;
                      setPayment((prev) => ({
                        id: prev?.id ?? orderId,
                        paypal_order_id: orderId,
                        paypal_capture_id: prev?.paypal_capture_id ?? null,
                        amount_minor: prev?.amount_minor ?? amountMinor,
                        currency: prev?.currency ?? currency,
                        status: (json.data.status as string | undefined) ?? 'CREATED',
                        captured_at: prev?.captured_at ?? null,
                      }));
                      return orderId;
                    })().finally(() => {
                      createOrderPromiseRef.current = null;
                      setProcessingMessage(null);
                    });

                    createOrderPromiseRef.current = orderPromise;
                    return orderPromise;
                  }}
                  onApprove={async (data) => {
                    if (captureInFlightRef.current) return;
                    captureInFlightRef.current = true;
                    setIsCapturing(true);
                    setError(null);
                    setProcessingMessage('Capturing and verifying payment on server...');
                    try {
                      const res = await fetch('/api/paypal/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          proposalId,
                          orderId: data.orderID,
                        }),
                      });
                      const json = await res.json();
                      if (!res.ok) {
                        setError(json.message ?? 'Server capture verification failed.');
                        return;
                      }
                      setPayment(json.data.payment ?? null);
                      setStatus('paid');
                      router.refresh();
                    } finally {
                      captureInFlightRef.current = false;
                      setIsCapturing(false);
                      setProcessingMessage(null);
                    }
                  }}
                  onCancel={() => {
                    createOrderPromiseRef.current = null;
                    captureInFlightRef.current = false;
                    setIsCapturing(false);
                    setProcessingMessage(null);
                    setError('PayPal checkout was cancelled before capture. No funds were captured.');
                  }}
                  onError={(err) => {
                    createOrderPromiseRef.current = null;
                    captureInFlightRef.current = false;
                    setIsCapturing(false);
                    setProcessingMessage(null);
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'PayPal Checkout encountered an unexpected error.'
                    );
                  }}
                />
              </PayPalScriptProvider>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
