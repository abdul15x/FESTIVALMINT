import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['admin'] });
  const db = createAdminSupabaseClient() ?? supabase;

  const [
    { count: pendingOrganizers },
    { count: pendingEvents },
    { count: totalProposals },
    { data: recentAudits },
  ] = await Promise.all([
    db
      .from('organizer_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    db
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review'),
    db.from('proposals').select('*', { count: 'exact', head: true }),
    db
      .from('audit_logs')
      .select('id, action, entity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return (
    <DashboardShell role="admin" userName={context.profile.full_name}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">
              University Admin Governance
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Verify student societies, moderate event submissions, and monitor platform integrity.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/reviews" className={buttonClasses('primary', 'md')}>
              <ShieldCheck className="h-4 w-4" />
              Review Queue
            </Link>
            <Link href="/admin/users" className={buttonClasses('outline', 'md')}>
              <Users className="h-4 w-4" />
              Users
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Pending Societies</p>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-700">
                {pendingOrganizers ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Pending Event Reviews</p>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-700">
                {pendingEvents ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Total Platform Proposals</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-950">
                {totalProposals ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Trail</CardTitle>
            <CardDescription>Immutable log of administrative moderation actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentAudits || recentAudits.length === 0 ? (
              <p className="text-sm text-slate-500">No audit events recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAudits.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="navy">{log.action}</Badge>
                      <span className="font-mono text-slate-600">{log.entity_type}</span>
                    </div>
                    <span className="font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
