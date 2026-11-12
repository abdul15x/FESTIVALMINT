import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { UserModerationClient } from '@/components/admin/user-moderation-client';
import type { ProfileRow } from '@/types/database';

export default async function AdminUsersPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['admin'] });
  const db = createAdminSupabaseClient() ?? supabase;

  const { data: users } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<ProfileRow[]>();

  return (
    <DashboardShell role="admin" userName={context.profile.full_name}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Access Control"
          title="User Moderation"
          description="Monitor marketplace members and suspend or reactivate workspace access cleanly."
        />
        <UserModerationClient users={users ?? []} currentAdminId={context.userId} />
      </div>
    </DashboardShell>
  );
}
