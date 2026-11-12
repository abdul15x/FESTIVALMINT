'use client';

import { useState } from 'react';
import { Loader2, Building2, GraduationCap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { splitCommaList } from '@/lib/validation/auth';
import { cn } from '@/lib/utils';

const EVENT_CATEGORIES = [
  'technology',
  'business',
  'sports',
  'cultural',
  'social',
  'academic',
  'other',
] as const;

const BENEFIT_OPTIONS = [
  'Logo placement',
  'Booth',
  'Speaking slot',
  'Workshop',
  'Social media post',
  'Recruitment access',
  'Sampling',
];

export function OrganizerOnboardingForm({
  defaultContactName,
  defaultEmail,
}: {
  defaultContactName: string;
  defaultEmail: string;
}) {
  const [societyName, setSocietyName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [campusCity, setCampusCity] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState(defaultContactName);
  const [officialEmail, setOfficialEmail] = useState(defaultEmail);
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyName,
          universityName,
          campusCity,
          category,
          description,
          contactPerson,
          officialEmail,
          website,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not save organizer profile.');
        return;
      }
      window.location.assign(json.data.redirectTo || '/organizer/dashboard');
    } catch {
      setError('Network error saving profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-stone-200/80 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="mint" dot>
              Step 2 of 2 · Organizer Verification
            </Badge>
            <CardTitle className="mt-2.5 flex items-center gap-2 text-xl">
              <GraduationCap className="h-5 w-5 text-emerald-700" />
              Complete Your Society Profile
            </CardTitle>
            <CardDescription>
              Sponsors inspect your society track record and campus verification before funding events.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {error && <Alert tone="error">{error}</Alert>}

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
              01 · Society Identity
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="societyName">Society / Organization Name</Label>
                <Input
                  id="societyName"
                  required
                  placeholder="ACM Student Chapter"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="universityName">University / Institution</Label>
                <Input
                  id="universityName"
                  required
                  placeholder="Lahore University of Management Sciences"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="campusCity">Campus City</Label>
                <Input
                  id="campusCity"
                  required
                  placeholder="Lahore"
                  value={campusCity}
                  onChange={(e) => setCampusCity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Society Category</Label>
                <Select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {['Technology', 'Business', 'Sports', 'Cultural', 'Social', 'Academic', 'Other'].map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    )
                  )}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Society Description &amp; Track Record</Label>
              <Textarea
                id="description"
                required
                minLength={30}
                placeholder="Describe your student community, flagship annual events, and typical attendee profile..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-stone-200/80 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
              02 · Contact &amp; Presence
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="contactPerson">Primary Contact</Label>
                <Input
                  id="contactPerson"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="officialEmail">Official Email</Label>
                <Input
                  id="officialEmail"
                  type="email"
                  required
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="website">Website / Social (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://society.example.edu"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-stone-200/80 pt-5">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                'Save & Enter Organizer Studio'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SponsorOnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [operatingLocations, setOperatingLocations] = useState('Lahore, Karachi');
  const [targetTags, setTargetTags] = useState('Computer Science, AI & ML, Full-Stack Developers');
  const [objectives, setObjectives] = useState('Developer hiring, API adoption, Brand awareness');
  const [budgetMinUsd, setBudgetMinUsd] = useState('500');
  const [budgetMaxUsd, setBudgetMaxUsd] = useState('3000');
  const [preferredCategories, setPreferredCategories] = useState<string[]>(['technology']);
  const [preferredLocations, setPreferredLocations] = useState('Lahore, Pakistan');
  const [preferredBenefits, setPreferredBenefits] = useState<string[]>([
    'Booth',
    'Workshop',
    'Logo placement',
  ]);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleItem(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry,
          description,
          website,
          productsServices,
          operatingLocations: splitCommaList(operatingLocations),
          targetTags: splitCommaList(targetTags),
          objectives: splitCommaList(objectives),
          budgetMinUsd: Number(budgetMinUsd),
          budgetMaxUsd: Number(budgetMaxUsd),
          preferredCategories,
          preferredLocations: splitCommaList(preferredLocations),
          preferredBenefits,
          contactEmail,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not save sponsor profile.');
        return;
      }
      window.location.assign(json.data.redirectTo || '/sponsor/dashboard');
    } catch {
      setError('Network error saving profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-stone-200/80 pb-5">
        <Badge variant="mint" dot className="w-fit">
          Step 2 of 2 · Sponsor Preferences
        </Badge>
        <CardTitle className="mt-2.5 flex items-center gap-2 text-xl">
          <Building2 className="h-5 w-5 text-emerald-700" />
          Complete Your Brand / Sponsor Profile
        </CardTitle>
        <CardDescription>
          These preferences calibrate your compatibility score across verified campus events.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {error && <Alert tone="error">{error}</Alert>}

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
              01 · Brand Profile &amp; Budget Envelope
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyName">Company / Brand Name</Label>
                <Input
                  id="companyName"
                  required
                  placeholder="Northstar Cloud & DevTools"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  required
                  placeholder="Technology & Developer Infrastructure"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sponsorDesc">Brand Overview</Label>
              <Textarea
                id="sponsorDesc"
                required
                minLength={30}
                placeholder="What does your brand build, and why do you partner with university events?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="budgetMinUsd">Min Sponsorship Budget (USD)</Label>
                <Input
                  id="budgetMinUsd"
                  type="number"
                  min={50}
                  required
                  value={budgetMinUsd}
                  onChange={(e) => setBudgetMinUsd(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="budgetMaxUsd">Max Sponsorship Budget (USD)</Label>
                <Input
                  id="budgetMaxUsd"
                  type="number"
                  min={50}
                  required
                  value={budgetMaxUsd}
                  onChange={(e) => setBudgetMaxUsd(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-stone-200/80 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
              02 · Audience, Regions &amp; Activations
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="targetTags">Target Audience Tags (comma-separated)</Label>
                <Input
                  id="targetTags"
                  required
                  value={targetTags}
                  onChange={(e) => setTargetTags(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="objectives">Marketing Objectives (comma-separated)</Label>
                <Input
                  id="objectives"
                  required
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="operatingLocations">Operating Locations</Label>
                <Input
                  id="operatingLocations"
                  required
                  value={operatingLocations}
                  onChange={(e) => setOperatingLocations(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="preferredLocations">Preferred Event Cities / Regions</Label>
                <Input
                  id="preferredLocations"
                  required
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Preferred Event Categories</Label>
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map((cat) => {
                  const active = preferredCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleItem(preferredCategories, setPreferredCategories, cat)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize cursor-pointer transition-colors',
                        active
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      {active && <Check className="h-3 w-3 text-emerald-700" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Preferred Sponsorship Benefits</Label>
              <div className="flex flex-wrap gap-2">
                {BENEFIT_OPTIONS.map((b) => {
                  const active = preferredBenefits.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleItem(preferredBenefits, setPreferredBenefits, b)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors',
                        active
                          ? 'border-[#0c121e] bg-[#0c121e] text-white'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      )}
                    >
                      {active && <Check className="h-3 w-3 text-emerald-400" />}
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-stone-200/80 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
              03 · Contact &amp; Offerings
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="contactEmail">Sponsorship Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sponsorWebsite">Website (Optional)</Label>
                <Input
                  id="sponsorWebsite"
                  type="url"
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="productsServices">Products / Services</Label>
                <Input
                  id="productsServices"
                  placeholder="Cloud APIs, Student Credits"
                  value={productsServices}
                  onChange={(e) => setProductsServices(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-stone-200/80 pt-5">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Brand Profile...
                </>
              ) : (
                'Save & Enter Sponsor Portal'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
