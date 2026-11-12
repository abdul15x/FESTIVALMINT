import { NextResponse } from 'next/server';
import { getIntegrationReadiness } from '@/lib/env';

export async function GET() {
  const readiness = getIntegrationReadiness();

  return NextResponse.json(
    {
      status: 'ok',
      service: 'festivalmint-ai',
      timestamp: new Date().toISOString(),
      integrations: {
        supabasePublic: readiness.supabasePublic,
        supabaseAdmin: readiness.supabaseAdmin,
        aiProvider: readiness.aiProvider ?? 'unconfigured',
        paypalServer: readiness.paypalServer,
        paypalClient: readiness.paypalClient,
        paypalWebhook: readiness.paypalWebhook,
      },
    },
    { status: 200 }
  );
}

