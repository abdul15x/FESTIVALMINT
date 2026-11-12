'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { splitCommaList } from '@/lib/validation/auth';
import type {
  OrganizerProfileRow,
  ProfileRow,
  SponsorProfileRow,
} from '@/types/database';

export function ProfileSettingsForm({
  profile,
  organizerProfile,
  sponsorProfile,
}: {
  profile: ProfileRow;
  organizerProfile: OrganizerProfileRow | null;
  sponsorProfile: SponsorProfileRow | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);

  // Organizer fields
  const [societyName, setSocietyName] = useState(organizerProfile?.society_name ?? '');
  const [universityName, setUniversityName] = useState(organizerProfile?.university_name ?? '');
  const [campusCity, setCampusCity] = useState(organizerProfile?.campus_city ?? '');
  const [category, setCategory] = useState(organizerProfile?.category ?? 'Technology');
  const [orgDescription, setOrgDescription] = useState(organizerProfile?.description ?? '');
  const [contactPerson, setContactPerson] = useState(organizerProfile?.contact_person ?? '');
  const [officialEmail, setOfficialEmail] = useState(organizerProfile?.official_email ?? '');
  const [orgWebsite, setOrgWebsite] = useState(organizerProfile?.website ?? '');

  // Sponsor fields
  const [companyName, setCompanyName] = useState(sponsorProfile?.company_name ?? '');
  const [industry, setIndustry] = useState(sponsorProfile?.industry ?? '');
  const [sponsorDescription, setSponsorDescription] = useState(sponsorProfile?.description ?? '');
  const [sponsorWebsite, setSponsorWebsite] = useState(sponsorProfile?.website ?? '');
  const [productsServices, setProductsServices] = useState(sponsorProfile?.products_services ?? '');
  const [budgetMinUsd, setBudgetMinUsd] = useState(
    sponsorProfile ? String(Math.round(sponsorProfile.budget_min_minor / 100)) : '500'
  );
  const [budgetMaxUsd, setBudgetMaxUsd] = useState(
    sponsorProfile ? String(Math.round(sponsorProfile.budget_max_minor / 100)) : '3000'
  );
  const [targetTags, setTargetTags] = useState(sponsorProfile?.target_tags.join(', ') ?? '');
  const [objectives, setObjectives] = useState(sponsorProfile?.objectives.join(', ') ?? '');
  const [operatingLocations, setOperatingLocations] = useState(
    sponsorProfile?.operating_locations.join(', ') ?? ''
  );
  const [preferredLocations, setPreferredLocations] = useState(
    sponsorProfile?.preferred_locations.join(', ') ?? ''
  );
  const [preferredCategories, setPreferredCategories] = useState(
    sponsorProfile?.preferred_categories.join(', ') ?? 'technology'
  );
  const [preferredBenefits, setPreferredBenefits] = useState(
    sponsorProfile?.preferred_benefits.join(', ') ?? 'Booth, Workshop'
  );
  const [contactEmail, setContactEmail] = useState(sponsorProfile?.contact_email ?? profile.email);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { fullName };

      if (profile.role === 'organizer' && organizerProfile) {
        Object.assign(payload, {
          societyName,
          universityName,
          campusCity,
          category,
          description: orgDescription,
          contactPerson,
          officialEmail,
          website: orgWebsite,
        });
      }

      if (profile.role === 'sponsor' && sponsorProfile) {
        Object.assign(payload, {
          companyName,
          industry,
          description: sponsorDescription,
          website: sponsorWebsite,
          productsServices,
          budgetMinUsd: Number(budgetMinUsd),
          budgetMaxUsd: Number(budgetMaxUsd),
          targetTags: splitCommaList(targetTags),
          objectives: splitCommaList(objectives),
          operatingLocations: splitCommaList(operatingLocations),
          preferredLocations: splitCommaList(preferredLocations),
          preferredCategories: splitCommaList(preferredCategories).map((c) => c.toLowerCase()),
          preferredBenefits: splitCommaList(preferredBenefits),
          contactEmail,
        });
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not update profile.');
        return;
      }
      setSuccess('Profile updated.');
      router.refresh();
    } catch {
      setError('Network error updating profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your account identity and {profile.role} marketplace details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Account Full Name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label>Account Role &amp; Email</Label>
              <Input disabled value={`${profile.role.toUpperCase()} • ${profile.email}`} />
            </div>
          </div>

          {profile.role === 'organizer' && organizerProfile && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="societyName">Society Name</Label>
                  <Input
                    id="societyName"
                    required
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="universityName">University</Label>
                  <Input
                    id="universityName"
                    required
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
                    value={campusCity}
                    onChange={(e) => setCampusCity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="orgCat">Category</Label>
                  <Select id="orgCat" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {['Technology', 'Business', 'Sports', 'Cultural', 'Social', 'Academic', 'Other'].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="orgDesc">Description</Label>
                <Textarea
                  id="orgDesc"
                  required
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
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
                  <Label htmlFor="orgWebsite">Website</Label>
                  <Input
                    id="orgWebsite"
                    type="url"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {profile.role === 'sponsor' && sponsorProfile && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sponsorDesc">Brand Description</Label>
                <Textarea
                  id="sponsorDesc"
                  required
                  value={sponsorDescription}
                  onChange={(e) => setSponsorDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="budgetMin">Min Budget (USD)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    required
                    value={budgetMinUsd}
                    onChange={(e) => setBudgetMinUsd(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMax">Max Budget (USD)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    required
                    value={budgetMaxUsd}
                    onChange={(e) => setBudgetMaxUsd(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="targetTags">Target Audience Tags</Label>
                  <Input
                    id="targetTags"
                    required
                    value={targetTags}
                    onChange={(e) => setTargetTags(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="objectives">Marketing Objectives</Label>
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
                  <Label htmlFor="operatingLoc">Operating Locations</Label>
                  <Input
                    id="operatingLoc"
                    required
                    value={operatingLocations}
                    onChange={(e) => setOperatingLocations(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="prefLoc">Preferred Event Locations</Label>
                  <Input
                    id="prefLoc"
                    required
                    value={preferredLocations}
                    onChange={(e) => setPreferredLocations(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="prefCat">Preferred Categories</Label>
                  <Input
                    id="prefCat"
                    required
                    value={preferredCategories}
                    onChange={(e) => setPreferredCategories(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="prefBen">Preferred Benefits</Label>
                  <Input
                    id="prefBen"
                    required
                    value={preferredBenefits}
                    onChange={(e) => setPreferredBenefits(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sponsorWeb">Website</Label>
                  <Input
                    id="sponsorWeb"
                    type="url"
                    value={sponsorWebsite}
                    onChange={(e) => setSponsorWebsite(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="prodServ">Products / Services</Label>
                  <Input
                    id="prodServ"
                    value={productsServices}
                    onChange={(e) => setProductsServices(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
