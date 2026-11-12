'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

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
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-950">
          Organizer Society Verifications ({organizers.length})
        </h2>
        {organizers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">
              No organizer societies pending verification.
            </CardContent>
          </Card>
        ) : (
          organizers.map((org) => (
            <Card key={org.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{org.society_name}</h3>
                    <Badge variant="amber">{org.verification_status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {org.university_name ?? 'University'} • {org.campus_city} • {org.category} •{' '}
                    {org.official_email}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:w-80">
                  <Input
                    placeholder="Optional audit/review note"
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

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-950">
          Event Submissions ({events.length})
        </h2>
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">
              No events currently awaiting review.
            </CardContent>
          </Card>
        ) : (
          events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{ev.title}</h3>
                    <Badge variant="amber">{ev.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {ev.category} • {ev.city}, {ev.country} • {ev.expected_attendees} est. attendees
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
    </div>
  );
}
