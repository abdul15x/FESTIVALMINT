'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, MessageSquare, CreditCard, FileBarChart2, Loader2 } from 'lucide-react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/input';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';

export interface SponsorProposalItem {
  id: string;
  event_id: string;
  package_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  message: string | null;
  change_request_note: string | null;
  benefits_snapshot_json: unknown;
  expires_at: string | null;
  created_at: string;
  events: { title: string; city: string | null; starts_at: string; status: string } | null;
  organizer_profiles: { society_name: string; university_name: string | null } | null;
  sponsorship_packages: { name: string } | null;
}

const STATUS_BADGE: Record<string, 'neutral' | 'blue' | 'amber' | 'mint' | 'red'> = {
  sent: 'blue',
  changes_requested: 'amber',
  accepted: 'mint',
  payment_pending: 'amber',
  paid: 'mint',
  completed: 'mint',
  rejected: 'red',
  expired: 'neutral',
};

export function SponsorProposalsClient({
  initialProposals,
}: {
  initialProposals: SponsorProposalItem[];
}) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initialProposals);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function respond(
    proposalId: string,
    decision: 'accept' | 'reject' | 'request_changes'
  ) {
    setBusyId(proposalId);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          note: noteById[proposalId] ?? '',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not update proposal status.');
        return;
      }

      const updatedStatus: string = json.data.proposal.status;
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, status: updatedStatus, change_request_note: noteById[proposalId] || null }
            : p
        )
      );
      setFeedback(json.message ?? 'Proposal updated.');
      router.refresh();
    } catch {
      setError('Network error responding to proposal.');
    } finally {
      setBusyId(null);
    }
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm font-medium text-slate-900">No sponsorship proposals yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Browse approved campus events and select a package, or wait for organizer invitations.
          </p>
          <Link href="/sponsor/discover" className={`${buttonClasses('primary', 'sm')} mt-4`}>
            Discover Events
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {proposals.map((p) => {
        const benefits = Array.isArray(p.benefits_snapshot_json)
          ? p.benefits_snapshot_json.map(String)
          : [];
        const canRespond = ['sent', 'changes_requested'].includes(p.status);
        const canPay = ['accepted', 'payment_pending'].includes(p.status);
        const isPaid = ['paid', 'completed'].includes(p.status);

        return (
          <Card key={p.id}>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-bold text-slate-950">
                      {p.events?.title ?? 'University Event'}
                    </h2>
                    <Badge variant={STATUS_BADGE[p.status] ?? 'neutral'}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.organizer_profiles?.society_name ?? 'Society'}
                    {p.organizer_profiles?.university_name
                      ? ` · ${p.organizer_profiles.university_name}`
                      : ''}
                    {p.events?.starts_at ? ` · ${formatShortDate(p.events.starts_at)}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">
                    {p.sponsorship_packages?.name ?? 'Package'} Tier
                  </p>
                  <p className="font-display text-lg font-bold text-slate-950">
                    {formatMinorCurrency(p.amount_minor, p.currency)}
                  </p>
                </div>
              </div>

              {p.message && (
                <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700">
                  {p.message}
                </div>
              )}

              {benefits.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Locked Deliverables Snapshot
                  </p>
                  <ul className="grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    {benefits.slice(0, 6).map((b) => (
                      <li key={b} className="flex items-start gap-1.5">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.change_request_note && (
                <Alert tone="warning" title="Latest Response Note">
                  {p.change_request_note}
                </Alert>
              )}

              {canRespond && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <Textarea
                    rows={2}
                    placeholder="Optional note or requested adjustments before accepting..."
                    value={noteById[p.id] ?? ''}
                    onChange={(e) =>
                      setNoteById((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={() => respond(p.id, 'accept')}
                    >
                      {busyId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accept Proposal
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === p.id}
                      onClick={() => respond(p.id, 'request_changes')}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Request Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyId === p.id}
                      onClick={() => respond(p.id, 'reject')}
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <Link href={`/sponsor/events/${p.event_id}`} className={buttonClasses('ghost', 'sm')}>
                  View Event Details
                </Link>
                <div className="flex flex-wrap gap-2">
                  {canPay && (
                    <Link
                      href={`/sponsor/payments/${p.id}`}
                      className={buttonClasses('primary', 'sm')}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay with PayPal Sandbox
                    </Link>
                  )}
                  {isPaid && (
                    <Link
                      href={`/sponsor/reports/${p.id}`}
                      className={buttonClasses('secondary', 'sm')}
                    >
                      <FileBarChart2 className="h-3.5 w-3.5" />
                      Fulfillment & ROI Report
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
