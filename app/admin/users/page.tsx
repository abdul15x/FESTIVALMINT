import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
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
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">User Moderation</h1>
          <p className="mt-1 text-sm text-slate-600">
            Suspend or reactivate marketplace accounts safely.
          </p>
        </div>
        <UserModerationClient users={users ?? []} currentAdminId={context.userId} />
      </div>
    </DashboardShell>
  );
}
