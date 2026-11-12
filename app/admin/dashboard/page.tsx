import Link from 'next/link';
import { Activity, Building2, CalendarCheck2, Handshake, ShieldCheck, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
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
        <PageHeader
          eyebrow="Campus Governance"
          title="University Admin Command"
          description="Verify student societies, review campus event submissions, and oversee marketplace integrity."
          actions={
            <>
              <Link href="/admin/reviews" className={buttonClasses('primary', 'md')}>
                <ShieldCheck className="h-4 w-4" />
                Review Queue
              </Link>
              <Link href="/admin/users" className={buttonClasses('outline', 'md')}>
                <Users className="h-4 w-4" />
                Users
              </Link>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending Societies"
            value={pendingOrganizers ?? 0}
            detail="Awaiting campus verification"
            tone={(pendingOrganizers ?? 0) > 0 ? 'amber' : 'default'}
            icon={<Building2 className="h-4 w-4" />}
          />
          <StatCard
            label="Pending Event Reviews"
            value={pendingEvents ?? 0}
            detail="Awaiting publish sign-off"
            tone={(pendingEvents ?? 0) > 0 ? 'amber' : 'default'}
            icon={<CalendarCheck2 className="h-4 w-4" />}
          />
          <StatCard
            label="Total Marketplace Deals"
            value={totalProposals ?? 0}
            detail="Recorded sponsorship proposals"
            tone="mint"
            icon={<Handshake className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardHeader className="border-b border-stone-200/80 pb-4">
            <CardTitle>Recent Governance Activity</CardTitle>
            <CardDescription>Immutable ledger of administrative verification and moderation actions.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {!recentAudits || recentAudits.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="No governance actions logged yet"
                description="Administrative approvals, status updates, and moderation logs appear here automatically."
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {recentAudits.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Badge variant="navy">{log.action}</Badge>
                      <span className="font-mono text-stone-600">{log.entity_type}</span>
                    </div>
                    <span className="font-mono text-stone-400 tabular-nums">
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
