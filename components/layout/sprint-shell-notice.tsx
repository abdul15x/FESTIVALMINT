import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { getIntegrationReadiness } from '@/lib/env';

export function SprintShellCard({
  title,
  description,
  sprintTarget,
  backHref = '/',
  backLabel = 'Return to Landing Page',
}: {
  title: string;
  description: string;
  sprintTarget: string;
  backHref?: string;
  backLabel?: string;
}) {
  const readiness = getIntegrationReadiness();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="mint">{sprintTarget}</Badge>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Link href={backHref} className={buttonClasses('outline', 'sm')}>
          {backLabel}
        </Link>
      </div>

      {!readiness.supabasePublic && (
        <Alert tone="warning" title="Environment Configuration Needed">
          Add your Supabase, AI provider, and PayPal Sandbox keys to{' '}
          <code className="font-mono text-xs">.env.local</code> (from{' '}
          <code className="font-mono text-xs">.env.example</code>) before enabling live auth and
          database persistence in Sprint 2+.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Module Foundation Ready</CardTitle>
          <CardDescription>
            Routing, layout shell, database schema, and RLS contracts for this screen are
            established. Interactive workflows activate in {sprintTarget}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-800">Supabase Connection</p>
              <p className="mt-1 font-mono text-slate-600">
                {readiness.supabasePublic ? 'Configured' : 'Pending .env.local'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-800">AI Provider</p>
              <p className="mt-1 font-mono text-slate-600">
                {readiness.aiProvider ?? 'Pending .env.local'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-800">PayPal Sandbox</p>
              <p className="mt-1 font-mono text-slate-600">
                {readiness.paypalServer ? 'Configured' : 'Pending .env.local'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
