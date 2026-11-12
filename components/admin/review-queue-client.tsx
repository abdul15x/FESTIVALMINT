'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RotateCcw, Loader2, ShieldCheck, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { SegmentedTabs } from '@/components/motion/primitives';

export interface PendingOrganizerItem {
  id: string;
  society_name: string;
  university_name: string | null;
  campus_city: string;
  category: string;
  official_email: string;
  verification_status: string;
}

export interface PendingEventItem {
  id: string;
  title: string;
  category: string;
  city: string;
  country: string;
  expected_attendees: number;
  status: string;
}

export function ReviewQueueClient({
  organizers,
  events,
}: {
  organizers: PendingOrganizerItem[];
  events: PendingEventItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'organizers' | 'events'>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitDecision(
    entityType: 'organizer_profile' | 'event',
    entityId: string,
    decision: 'approve' | 'reject' | 'request_changes'
  ) {
    setBusyId(entityId);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          decision,
          note: notes[entityId] ?? '',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Review submission failed.');
        return;
      }
      setFeedback(json.message ?? 'Review recorded.');
      router.refresh();
    } catch {
      setError('Network error submitting review.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SegmentedTabs
        layoutId="admin-review-tabs"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'all', label: 'All Pending', badge: organizers.length + events.length },
          { id: 'organizers', label: 'Societies', badge: organizers.length },
          { id: 'events', label: 'Events', badge: events.length },
        ]}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {(tab === 'all' || tab === 'organizers') && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0c121e]">
            Organizer Society Verifications ({organizers.length})
          </h2>
          {organizers.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-5 w-5 text-emerald-700" />}
              title="All societies verified"
              description="No organizer societies are currently awaiting approval."
            />
          ) : (
            organizers.map((org) => (
              <Card key={org.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-[#0c121e]">{org.society_name}</h3>
                      <Badge dot variant="amber">
                        {org.verification_status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-600">
                      {org.university_name ?? 'University'} · {org.campus_city} · {org.category} ·{' '}
                      <span className="font-mono">{org.official_email}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:w-80">
                    <Input
                      placeholder="Optional review note"
                      value={notes[org.id] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [org.id]: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === org.id}
                        onClick={() => submitDecision('organizer_profile', org.id, 'approve')}
                      >
                        {busyId === org.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === org.id}
                        onClick={() => submitDecision('organizer_profile', org.id, 'request_changes')}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === org.id}
                        onClick={() => submitDecision('organizer_profile', org.id, 'reject')}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}

      {(tab === 'all' || tab === 'events') && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0c121e]">
            Event Submissions ({events.length})
          </h2>
          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck2 className="h-5 w-5 text-emerald-700" />}
              title="Event queue is clear"
              description="All submitted university events have been reviewed."
            />
          ) : (
            events.map((ev) => (
              <Card key={ev.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-[#0c121e]">{ev.title}</h3>
                      <Badge dot variant="amber">
                        {ev.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-600">
                      {ev.category} · {ev.city}, {ev.country} ·{' '}
                      <span className="font-mono">{ev.expected_attendees}</span> est. attendees
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:w-80">
                    <Input
                      placeholder="Optional moderation note"
                      value={notes[ev.id] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [ev.id]: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === ev.id}
                        onClick={() => submitDecision('event', ev.id, 'approve')}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === ev.id}
                        onClick={() => submitDecision('event', ev.id, 'request_changes')}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Draft
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === ev.id}
                        onClick={() => submitDecision('event', ev.id, 'reject')}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}
    </div>
  );
}
