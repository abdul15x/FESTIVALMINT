'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileRow } from '@/types/database';

export function UserModerationClient({
  users,
  currentAdminId,
}: {
  users: ProfileRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus(user: ProfileRow) {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Moderation update failed.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error moderating user.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {users.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">No user accounts found.</CardContent>
        </Card>
      ) : (
        users.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-950">{u.full_name}</span>
                  <Badge variant="navy">{u.role}</Badge>
                  <Badge variant={u.status === 'active' ? 'mint' : 'red'}>{u.status}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">{u.email}</p>
              </div>
              {u.id !== currentAdminId && (
                <Button
                  size="sm"
                  variant={u.status === 'suspended' ? 'secondary' : 'outline'}
                  disabled={busyId === u.id}
                  onClick={() => toggleStatus(u)}
                >
                  {u.status === 'suspended' ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Reactivate
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Suspend
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
