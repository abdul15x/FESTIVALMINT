'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { splitCommaList } from '@/lib/validation/auth';
import {
  EVENT_BENEFITS_OPTIONS,
  EVENT_CATEGORIES,
  SPONSORSHIP_NEEDS_OPTIONS,
} from '@/lib/validation/events';
import type { EventRow } from '@/types/database';

function toLocalDateTimeInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function EventForm({
  mode,
  initialEvent,
  initialBenefits = ['Logo placement', 'Booth', 'Workshop', 'Social media post'],
}: {
  mode: 'create' | 'edit';
  initialEvent?: EventRow;
  initialBenefits?: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [description, setDescription] = useState(initialEvent?.description ?? '');
  const [category, setCategory] = useState<string>(initialEvent?.category ?? 'technology');
  const [city, setCity] = useState(initialEvent?.city ?? 'Lahore');
  const [country, setCountry] = useState(initialEvent?.country ?? 'Pakistan');
  const [venue, setVenue] = useState(initialEvent?.venue ?? '');
  const [startsAt, setStartsAt] = useState(
    () =>
      toLocalDateTimeInput(initialEvent?.starts_at) ||
      toLocalDateTimeInput(new Date(Date.now() + 21 * 86_400_000).toISOString())
  );
  const [endsAt, setEndsAt] = useState(
    () =>
      toLocalDateTimeInput(initialEvent?.ends_at) ||
      toLocalDateTimeInput(new Date(Date.now() + 22 * 86_400_000).toISOString())
  );
  const [expectedAttendees, setExpectedAttendees] = useState(
    String(initialEvent?.expected_attendees ?? 350)
  );
  const [socialReach, setSocialReach] = useState(String(initialEvent?.social_reach ?? 10000));
  const [sponsorshipTargetUsd, setSponsorshipTargetUsd] = useState(
    initialEvent ? String(Math.round(initialEvent.sponsorship_target_minor / 100)) : '3500'
  );
  const [audienceTags, setAudienceTags] = useState(
    initialEvent?.audience_tags.join(', ') ??
      'Computer Science, AI & ML, Full-Stack Developers'
  );
  const [eventObjectives, setEventObjectives] = useState(
    initialEvent?.event_objectives.join(', ') ?? 'Developer hiring, API adoption, Brand awareness'
  );
  const [sponsorshipNeeds, setSponsorshipNeeds] = useState<string[]>(
    initialEvent?.sponsorship_needs.length ? initialEvent.sponsorship_needs : ['Cash', 'Prizes']
  );
  const [availableBenefits, setAvailableBenefits] = useState<string[]>(initialBenefits);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        city,
        country,
        venue,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        expectedAttendees: Number(expectedAttendees),
        socialReach: Number(socialReach),
        sponsorshipTargetUsd: Number(sponsorshipTargetUsd),
        audienceTags: splitCommaList(audienceTags),
        eventObjectives: splitCommaList(eventObjectives),
        sponsorshipNeeds,
        availableBenefits,
      };

      const url = mode === 'create' ? '/api/events' : `/api/events/${initialEvent!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not save event.');
        return;
      }

      if (mode === 'create') {
        router.push(`/organizer/events/${json.data.event.id}`);
        router.refresh();
      } else {
        setSuccess('Event details updated.');
        router.refresh();
      }
    } catch {
      setError('Network error saving event.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create University Event' : 'Edit Event Details'}</CardTitle>
        <CardDescription>
          Accurate audience tags, dates, and benefits produce better AI sponsorship packages and
          sponsor matches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="evTitle">Event Title</Label>
              <Input
                id="evTitle"
                required
                minLength={5}
                maxLength={120}
                placeholder="Spring Campus AI & FinTech Hackathon 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="evCategory">Category</Label>
              <Select
                id="evCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="evDesc">Description &amp; Value Proposition (min 50 chars)</Label>
            <Textarea
              id="evDesc"
              required
              minLength={50}
              maxLength={2000}
              placeholder="Explain what happens at the event, who attends, and what makes it attractive to corporate partners..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="evCity">City</Label>
              <Input id="evCity" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="evCountry">Country</Label>
              <Input
                id="evCountry"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="evVenue">Campus Venue (Optional)</Label>
              <Input
                id="evVenue"
                placeholder="Main Innovation Auditorium"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt">Start Date &amp; Time</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endsAt">End Date &amp; Time</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="attendees">Expected Attendees (Est.)</Label>
              <Input
                id="attendees"
                type="number"
                min={10}
                required
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="socialReach">Social Media Reach (Est.)</Label>
              <Input
                id="socialReach"
                type="number"
                min={0}
                value={socialReach}
                onChange={(e) => setSocialReach(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="targetUsd">Sponsorship Target (USD)</Label>
              <Input
                id="targetUsd"
                type="number"
                min={100}
                required
                value={sponsorshipTargetUsd}
                onChange={(e) => setSponsorshipTargetUsd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="audTags">Target Audience Tags (comma-separated)</Label>
              <Input
                id="audTags"
                required
                value={audienceTags}
                onChange={(e) => setAudienceTags(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="evObj">Event Objectives (comma-separated)</Label>
              <Input
                id="evObj"
                required
                value={eventObjectives}
                onChange={(e) => setEventObjectives(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Sponsorship Needs</Label>
            <div className="flex flex-wrap gap-2">
              {SPONSORSHIP_NEEDS_OPTIONS.map((need) => {
                const active = sponsorshipNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggle(sponsorshipNeeds, setSponsorshipNeeds, need)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {need}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Available Sponsor Benefits Inventory</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_BENEFITS_OPTIONS.map((benefit) => {
                const active = availableBenefits.includes(benefit);
                return (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => toggle(availableBenefits, setAvailableBenefits, benefit)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium cursor-pointer ${
                      active
                        ? 'border-[#0b1220] bg-[#0b1220] text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {benefit}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Event...
              </>
            ) : mode === 'create' ? (
              'Create Event & Configure Packages'
            ) : (
              'Save Event Changes'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
