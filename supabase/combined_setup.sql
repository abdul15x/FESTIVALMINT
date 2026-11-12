-- =============================================================================
-- FESTIVALMINT AI — Combined Ordered Supabase SQL Setup Script
-- Run this entire script once in the Supabase Dashboard -> SQL Editor.
-- Includes migrations 0001..0004 + fictional demo seed catalog in exact order.
-- Safe & idempotent (CREATE IF NOT EXISTS, DROP POLICY IF EXISTS, ON CONFLICT).
-- =============================================================================

-- >>> STEP 1: supabase/migrations/0001_initial_schema.sql
-- FESTIVALMINT AI — Initial Relational Schema
-- Migration: 0001_initial_schema.sql
-- Conventions: UUID primary keys, timestamptz timestamps, integer minor currency units (*_minor)

create extension if not exists "pgcrypto";

-- Shared updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Core user profiles linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('organizer', 'sponsor', 'admin')),
  full_name text not null,
  email text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update
  on public.profiles
  for each row execute function public.set_updated_at();

-- 2. University directory
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country text not null,
  website text,
  verification_status text not null default 'verified' check (verification_status in ('pending', 'verified', 'rejected')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_universities_updated_at on public.universities;
create trigger trg_universities_updated_at
  before update
  on public.universities
  for each row execute function public.set_updated_at();

-- 3. Organizer / University Society profiles
create table if not exists public.organizer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  society_name text not null,
  university_id uuid references public.universities(id) on delete set null,
  university_name text,
  campus_city text not null,
  category text not null,
  description text not null,
  contact_person text not null,
  official_email text not null,
  website text,
  logo_url text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  review_note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizer_profiles_user_id on public.organizer_profiles(user_id);
create index if not exists idx_organizer_profiles_verification on public.organizer_profiles(verification_status);

drop trigger if exists trg_organizer_profiles_updated_at on public.organizer_profiles;
create trigger trg_organizer_profiles_updated_at
  before update
  on public.organizer_profiles
  for each row execute function public.set_updated_at();

-- 4. Sponsor / Company profiles
create table if not exists public.sponsor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  company_name text not null,
  industry text not null,
  description text not null,
  website text,
  operating_locations text[] not null default '{}',
  products_services text,
  target_tags text[] not null default '{}',
  objectives text[] not null default '{}',
  budget_min_minor bigint not null default 0 check (budget_min_minor >= 0),
  budget_max_minor bigint not null default 0 check (budget_max_minor >= budget_min_minor),
  currency text not null default 'USD',
  preferred_categories text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  preferred_benefits text[] not null default '{}',
  contact_email text not null,
  logo_url text,
  verification_status text not null default 'verified' check (verification_status in ('pending', 'verified', 'rejected')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sponsor_profiles_user_id on public.sponsor_profiles(user_id);
create index if not exists idx_sponsor_profiles_industry on public.sponsor_profiles(industry);

drop trigger if exists trg_sponsor_profiles_updated_at on public.sponsor_profiles;
create trigger trg_sponsor_profiles_updated_at
  before update
  on public.sponsor_profiles
  for each row execute function public.set_updated_at();

-- 5. University events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizer_profiles(id) on delete cascade,
  university_id uuid references public.universities(id) on delete set null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) >= 50),
  category text not null check (category in ('technology', 'business', 'sports', 'cultural', 'social', 'academic', 'other')),
  city text not null,
  country text not null,
  venue text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expected_attendees integer not null check (expected_attendees > 0),
  audience_tags text[] not null default '{}',
  event_objectives text[] not null default '{}',
  social_reach integer not null default 0 check (social_reach >= 0),
  sponsorship_target_minor bigint not null default 0 check (sponsorship_target_minor >= 0),
  currency text not null default 'USD',
  sponsorship_needs text[] not null default '{}',
  deck_storage_path text,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'published', 'completed', 'rejected', 'cancelled')),
  review_note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_events_dates check (ends_at > starts_at)
);

create index if not exists idx_events_organizer_id on public.events(organizer_id);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_category on public.events(category);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update
  on public.events
  for each row execute function public.set_updated_at();

-- 6. Event sponsorship inventory / benefits
create table if not exists public.event_benefits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  benefit_type text not null,
  description text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_event_benefits_event_id on public.event_benefits(event_id);

-- 7. Sponsorship packages (AI-suggested + organizer-edited)
create table if not exists public.sponsorship_packages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  price_minor bigint not null check (price_minor > 0),
  currency text not null default 'USD',
  benefits_json jsonb not null default '[]'::jsonb,
  availability integer not null default 1 check (availability > 0),
  ideal_sponsor_categories text[] not null default '{}',
  pricing_rationale text,
  assumptions_json jsonb not null default '[]'::jsonb,
  ai_generated boolean not null default false,
  approved_by_organizer boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_packages_event_id on public.sponsorship_packages(event_id);

drop trigger if exists trg_packages_updated_at on public.sponsorship_packages;
create trigger trg_packages_updated_at
  before update
  on public.sponsorship_packages
  for each row execute function public.set_updated_at();

-- 8. Explainable deterministic + AI matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sponsor_id uuid not null references public.sponsor_profiles(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  factor_scores_json jsonb not null,
  explanation text not null,
  missing_info_json jsonb not null default '[]'::jsonb,
  recommended_package_id uuid references public.sponsorship_packages(id) on delete set null,
  profile_snapshot_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, sponsor_id)
);

create index if not exists idx_matches_event_score on public.matches(event_id, score desc);
create index if not exists idx_matches_sponsor_score on public.matches(sponsor_id, score desc);

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at
  before update
  on public.matches
  for each row execute function public.set_updated_at();

-- 9. Sponsorship proposals
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sponsor_id uuid not null references public.sponsor_profiles(id) on delete cascade,
  package_id uuid not null references public.sponsorship_packages(id) on delete restrict,
  organizer_id uuid not null references public.organizer_profiles(id) on delete cascade,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'USD',
  benefits_snapshot_json jsonb not null default '[]'::jsonb,
  message text not null,
  change_request_note text,
  status text not null default 'sent' check (
    status in (
      'draft',
      'sent',
      'accepted',
      'changes_requested',
      'rejected',
      'expired',
      'payment_pending',
      'paid',
      'cancelled'
    )
  ),
  expires_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_event_id on public.proposals(event_id);
create index if not exists idx_proposals_sponsor_id on public.proposals(sponsor_id);
create index if not exists idx_proposals_organizer_id on public.proposals(organizer_id);
create index if not exists idx_proposals_status on public.proposals(status);

drop trigger if exists trg_proposals_updated_at on public.proposals;
create trigger trg_proposals_updated_at
  before update
  on public.proposals
  for each row execute function public.set_updated_at();

-- 10. Proposal audit timeline
create table if not exists public.proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_events_proposal_id on public.proposal_events(proposal_id);

-- 11. PayPal Sandbox payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  paypal_order_id text unique,
  paypal_capture_id text unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'USD',
  status text not null default 'CREATED' check (
    status in ('CREATED', 'APPROVED', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED')
  ),
  captured_at timestamptz,
  raw_status_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_proposal_id on public.payments(proposal_id);
create index if not exists idx_payments_order_id on public.payments(paypal_order_id);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update
  on public.payments
  for each row execute function public.set_updated_at();

-- 12. Idempotent PayPal webhook event tracking
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text not null unique,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received' check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  ),
  payload_summary_json jsonb not null default '{}'::jsonb
);

-- 13. Promised sponsorship deliverables
create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'pending' check (
    status in ('pending', 'submitted', 'verified', 'not_verified', 'waived_by_sponsor')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deliverables_proposal_id on public.deliverables(proposal_id);

drop trigger if exists trg_deliverables_updated_at on public.deliverables;
create trigger trg_deliverables_updated_at
  before update
  on public.deliverables
  for each row execute function public.set_updated_at();

-- 14. Deliverable fulfillment evidence
create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text,
  file_type text,
  source_url text,
  notes text,
  ai_analysis_json jsonb,
  review_status text not null default 'pending' check (
    review_status in ('pending', 'confirmed', 'flagged', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_files_deliverable_id on public.evidence_files(deliverable_id);

-- 15. AI Sponsorship Performance Reports
create table if not exists public.performance_reports (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  generated_by uuid references public.profiles(id) on delete set null,
  summary text not null,
  report_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_performance_reports_proposal_id on public.performance_reports(proposal_id);

-- 16. In-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_read on public.notifications(user_id, read_at);

-- 17. Admin and security audit log
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- >>> STEP 2: supabase/migrations/0002_rls_policies.sql
-- FESTIVALMINT AI — Row Level Security & Privilege Guards
-- Migration: 0002_rls_policies.sql

-- Helper functions evaluated safely with search_path locked
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.current_organizer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.organizer_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_sponsor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.sponsor_profiles where user_id = auth.uid() limit 1;
$$;

-- Prevent self-escalation of role, profile status, or verification status
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Role modification is not permitted';
  end if;
  if new.status is distinct from old.status then
    raise exception 'Account status modification is not permitted';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_escalation on public.profiles;
create trigger trg_prevent_profile_role_escalation
  before update
  on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

create or replace function public.prevent_self_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verification_status := 'pending';
    new.review_note := null;
  elsif tg_op = 'UPDATE' then
    if new.verification_status is distinct from old.verification_status then
      raise exception 'Verification status can only be modified by an administrator';
    end if;
    if new.review_note is distinct from old.review_note then
      raise exception 'Review notes can only be modified by an administrator';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_organizer_self_verification on public.organizer_profiles;
create trigger trg_prevent_organizer_self_verification
  before insert or update
  on public.organizer_profiles
  for each row execute function public.prevent_self_verification();

create or replace function public.prevent_event_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending_review') then
      new.status := 'draft';
    end if;
    new.review_note := null;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and new.status in ('approved', 'published', 'rejected') then
      raise exception 'Event approval or rejection requires administrator review';
    end if;
    if new.review_note is distinct from old.review_note then
      raise exception 'Review notes can only be modified by an administrator';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_event_self_approval on public.events;
create trigger trg_prevent_event_self_approval
  before insert or update
  on public.events
  for each row execute function public.prevent_event_self_approval();

-- Enable RLS across all 17 tables
alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.organizer_profiles enable row level security;
alter table public.sponsor_profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_benefits enable row level security;
alter table public.sponsorship_packages enable row level security;
alter table public.matches enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_events enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;
alter table public.deliverables enable row level security;
alter table public.evidence_files enable row level security;
alter table public.performance_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_non_admin_own" on public.profiles;
create policy "profiles_insert_non_admin_own" on public.profiles
  for insert with check (
    id = auth.uid()
    and role in ('organizer', 'sponsor')
  );

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- UNIVERSITIES
drop policy if exists "universities_public_read" on public.universities;
create policy "universities_public_read" on public.universities
  for select using (true);

drop policy if exists "universities_admin_write" on public.universities;
create policy "universities_admin_write" on public.universities
  for all using (public.is_admin()) with check (public.is_admin());

-- ORGANIZER PROFILES
drop policy if exists "organizer_profiles_select_visible" on public.organizer_profiles;
create policy "organizer_profiles_select_visible" on public.organizer_profiles
  for select using (
    user_id = auth.uid()
    or verification_status = 'verified'
    or public.is_admin()
  );

drop policy if exists "organizer_profiles_insert_own" on public.organizer_profiles;
create policy "organizer_profiles_insert_own" on public.organizer_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "organizer_profiles_update_own_or_admin" on public.organizer_profiles;
create policy "organizer_profiles_update_own_or_admin" on public.organizer_profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- SPONSOR PROFILES
drop policy if exists "sponsor_profiles_select_authenticated" on public.sponsor_profiles;
create policy "sponsor_profiles_select_authenticated" on public.sponsor_profiles
  for select using (
    user_id = auth.uid()
    or auth.role() = 'authenticated'
    or public.is_admin()
  );

drop policy if exists "sponsor_profiles_insert_own" on public.sponsor_profiles;
create policy "sponsor_profiles_insert_own" on public.sponsor_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "sponsor_profiles_update_own_or_admin" on public.sponsor_profiles;
create policy "sponsor_profiles_update_own_or_admin" on public.sponsor_profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- EVENTS
drop policy if exists "events_select_public_approved_or_owner" on public.events;
create policy "events_select_public_approved_or_owner" on public.events
  for select using (
    status in ('approved', 'published', 'completed')
    or organizer_id = public.current_organizer_id()
    or public.is_admin()
  );

drop policy if exists "events_insert_organizer_own" on public.events;
create policy "events_insert_organizer_own" on public.events
  for insert with check (organizer_id = public.current_organizer_id());

drop policy if exists "events_update_organizer_own_or_admin" on public.events;
create policy "events_update_organizer_own_or_admin" on public.events
  for update using (
    organizer_id = public.current_organizer_id() or public.is_admin()
  )
  with check (
    organizer_id = public.current_organizer_id() or public.is_admin()
  );

drop policy if exists "events_delete_organizer_draft" on public.events;
create policy "events_delete_organizer_draft" on public.events
  for delete using (
    (organizer_id = public.current_organizer_id() and status = 'draft')
    or public.is_admin()
  );

-- EVENT BENEFITS
drop policy if exists "event_benefits_select" on public.event_benefits;
create policy "event_benefits_select" on public.event_benefits
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_benefits.event_id
        and (
          e.status in ('approved', 'published', 'completed')
          or e.organizer_id = public.current_organizer_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "event_benefits_organizer_manage" on public.event_benefits;
create policy "event_benefits_organizer_manage" on public.event_benefits
  for all using (
    exists (
      select 1 from public.events e
      where e.id = event_benefits.event_id
        and e.organizer_id = public.current_organizer_id()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_benefits.event_id
        and e.organizer_id = public.current_organizer_id()
    )
  );

-- SPONSORSHIP PACKAGES
drop policy if exists "packages_select_visible" on public.sponsorship_packages;
create policy "packages_select_visible" on public.sponsorship_packages
  for select using (
    exists (
      select 1 from public.events e
      where e.id = sponsorship_packages.event_id
        and (
          e.status in ('approved', 'published', 'completed')
          or e.organizer_id = public.current_organizer_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "packages_organizer_manage" on public.sponsorship_packages;
create policy "packages_organizer_manage" on public.sponsorship_packages
  for all using (
    exists (
      select 1 from public.events e
      where e.id = sponsorship_packages.event_id
        and e.organizer_id = public.current_organizer_id()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = sponsorship_packages.event_id
        and e.organizer_id = public.current_organizer_id()
    )
  );

-- MATCHES
drop policy if exists "matches_select_participant_or_admin" on public.matches;
create policy "matches_select_participant_or_admin" on public.matches
  for select using (
    sponsor_id = public.current_sponsor_id()
    or exists (
      select 1 from public.events e
      where e.id = matches.event_id
        and e.organizer_id = public.current_organizer_id()
    )
    or public.is_admin()
  );

-- PROPOSALS
drop policy if exists "proposals_select_participant_or_admin" on public.proposals;
create policy "proposals_select_participant_or_admin" on public.proposals
  for select using (
    organizer_id = public.current_organizer_id()
    or sponsor_id = public.current_sponsor_id()
    or public.is_admin()
  );

drop policy if exists "proposals_insert_organizer" on public.proposals;
create policy "proposals_insert_organizer" on public.proposals
  for insert with check (organizer_id = public.current_organizer_id());

drop policy if exists "proposals_update_participants_or_admin" on public.proposals;
create policy "proposals_update_participants_or_admin" on public.proposals
  for update using (
    organizer_id = public.current_organizer_id()
    or sponsor_id = public.current_sponsor_id()
    or public.is_admin()
  );

-- PROPOSAL EVENTS
drop policy if exists "proposal_events_select_participant" on public.proposal_events;
create policy "proposal_events_select_participant" on public.proposal_events
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_events.proposal_id
        and (
          p.organizer_id = public.current_organizer_id()
          or p.sponsor_id = public.current_sponsor_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "proposal_events_insert_participant" on public.proposal_events;
create policy "proposal_events_insert_participant" on public.proposal_events
  for insert with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.proposals p
      where p.id = proposal_events.proposal_id
        and (
          p.organizer_id = public.current_organizer_id()
          or p.sponsor_id = public.current_sponsor_id()
          or public.is_admin()
        )
    )
  );

-- PAYMENTS (server service_role writes; participants read)
drop policy if exists "payments_select_participant_or_admin" on public.payments;
create policy "payments_select_participant_or_admin" on public.payments
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = payments.proposal_id
        and (
          p.organizer_id = public.current_organizer_id()
          or p.sponsor_id = public.current_sponsor_id()
          or public.is_admin()
        )
    )
  );

-- WEBHOOK EVENTS (admin read only; service_role writes)
drop policy if exists "webhook_events_admin_read" on public.webhook_events;
create policy "webhook_events_admin_read" on public.webhook_events
  for select using (public.is_admin());

-- DELIVERABLES
drop policy if exists "deliverables_select_participant_or_admin" on public.deliverables;
create policy "deliverables_select_participant_or_admin" on public.deliverables
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = deliverables.proposal_id
        and (
          p.organizer_id = public.current_organizer_id()
          or p.sponsor_id = public.current_sponsor_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "deliverables_organizer_manage" on public.deliverables;
create policy "deliverables_organizer_manage" on public.deliverables
  for all using (
    exists (
      select 1 from public.proposals p
      where p.id = deliverables.proposal_id
        and p.organizer_id = public.current_organizer_id()
    )
  )
  with check (
    exists (
      select 1 from public.proposals p
      where p.id = deliverables.proposal_id
        and p.organizer_id = public.current_organizer_id()
    )
  );

-- EVIDENCE FILES
drop policy if exists "evidence_files_select_participant_or_admin" on public.evidence_files;
create policy "evidence_files_select_participant_or_admin" on public.evidence_files
  for select using (
    exists (
      select 1 from public.deliverables d
      join public.proposals p on p.id = d.proposal_id
      where d.id = evidence_files.deliverable_id
        and (
          p.organizer_id = public.current_organizer_id()
          or p.sponsor_id = public.current_sponsor_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "evidence_files_insert_organizer" on public.evidence_files;
create policy "evidence_files_insert_organizer" on public.evidence_files
  for insert with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from public.deliverables d
      join public.proposals p on p.id = d.proposal_id
      where d.id = evidence_files.deliverable_id
        and p.organizer_id = public.current_organizer_id()
    )
  );

-- PERFORMANCE REPORTS
drop policy if exists "performance_reports_select_participant_or_admin" on public.performance_reports;
create policy "performance_reports_select_participant_or_admin" on public.performance_reports
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = performance_reports.proposal_id
        and (
          p.organizer_id = public.current_organizer_id()
          or p.sponsor_id = public.current_sponsor_id()
          or public.is_admin()
        )
    )
  );

-- NOTIFICATIONS
drop policy if exists "notifications_select_update_own" on public.notifications;
create policy "notifications_select_update_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- AUDIT LOGS
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read" on public.audit_logs
  for select using (public.is_admin());

-- >>> STEP 3: supabase/migrations/0003_sponsor_proposals.sql
-- Allow authenticated sponsors to initiate/select a sponsorship package proposal on approved events
drop policy if exists "proposals_insert_sponsor" on public.proposals;
create policy "proposals_insert_sponsor" on public.proposals
  for insert with check (
    sponsor_id = public.current_sponsor_id()
    and exists (
      select 1 from public.events e
      where e.id = proposals.event_id
        and e.status in ('approved', 'published')
    )
  );

-- >>> STEP 4: supabase/migrations/0004_storage_bucket.sql
-- FESTIVALMINT AI — Private Evidence Storage Bucket & Policies
-- Migration: 0004_storage_bucket.sql
-- Safe to run standalone or after 0002_rls_policies.sql; idempotent and non-destructive.

-- Ensure public.is_admin() exists even if 0002_rls_policies.sql was not applied yet.
-- Matches 0002_rls_policies.sql: active admin user in public.profiles with search_path locked.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- Create or update private Supabase Storage bucket for fulfillment evidence (max 10 MB per object)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policies for private `evidence` bucket (preserve existing policies if already present)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'evidence_storage_organizer_upload'
  ) then
    create policy "evidence_storage_organizer_upload" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'evidence_storage_participant_select'
  ) then
    create policy "evidence_storage_participant_select" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'evidence'
        and (
          (storage.foldername(name))[1] = auth.uid()::text
          or public.is_admin()
        )
      );
  end if;
end $$;

-- >>> STEP 5: supabase/seed.sql
-- FESTIVALMINT AI — Fictional Demo Seed Data
-- Note: All organizations, societies, events, and sponsors below are clearly labeled fictional demo data (`is_demo = true`).
-- Note on auth users: Create demo auth accounts via the secure seed API/script (`scripts/seed-demo.ts`) which binds `auth.users` IDs to `profiles`.
-- This SQL seeds public catalog data (universities, demo societies, demo events, demo packages, and demo sponsor profiles) safely with `user_id = null` until bound by the seed script.

insert into public.universities (id, name, city, country, website, verification_status, is_demo)
values
  ('11111111-1111-4111-8111-111111111101', 'Lahore Tech & Sciences University (Demo)', 'Lahore', 'Pakistan', 'https://demo-university.example.edu', 'verified', true)
on conflict (id) do nothing;

insert into public.organizer_profiles (
  id, user_id, society_name, university_id, university_name, campus_city, category, description,
  contact_person, official_email, verification_status, is_demo
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    null,
    'CampusSpark Tech Society (Demo)',
    '11111111-1111-4111-8111-111111111101',
    'Lahore Tech & Sciences University (Demo)',
    'Lahore',
    'Technology',
    'Student-led computer science and product engineering society running annual hackathons, AI workshops, and developer career fairs.',
    'Amina Tariq',
    'campusspark.demo@example.edu',
    'verified',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    null,
    'Civic & Arts Guild (Demo)',
    '11111111-1111-4111-8111-111111111101',
    'Lahore Tech & Sciences University (Demo)',
    'Lahore',
    'Cultural',
    'Inter-university performing arts, visual design showcase, and cultural festival committee.',
    'Bilal Hassan',
    'civicarts.demo@example.edu',
    'verified',
    true
  )
on conflict (id) do nothing;

insert into public.events (
  id, organizer_id, university_id, title, description, category, city, country, venue,
  starts_at, ends_at, expected_attendees, audience_tags, event_objectives, social_reach,
  sponsorship_target_minor, currency, sponsorship_needs, status, is_demo
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'BuildFest Campus AI Hackathon 2026 (Demo)',
    'A 36-hour inter-university software and AI engineering hackathon bringing together senior CS students, full-stack builders, and product designers to build real-world prototypes.',
    'technology',
    'Lahore',
    'Pakistan',
    'Main Innovation Auditorium',
    now() + interval '30 days',
    now() + interval '32 days',
    450,
    array['Computer Science', 'AI & ML', 'Full-Stack Developers', 'Final-Year Students'],
    array['Developer hiring', 'API adoption', 'Brand awareness'],
    18500,
    450000,
    'USD',
    array['Cash', 'Prizes', 'Software credits', 'Food'],
    'published',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'Campus Founders & FinTech Summit (Demo)',
    'A full-day entrepreneurship and payments symposium featuring startup pitch competitions, investor panels, and student career networking booths.',
    'business',
    'Lahore',
    'Pakistan',
    'School of Business Atrium',
    now() + interval '45 days',
    now() + interval '45 days' + interval '8 hours',
    300,
    array['Entrepreneurship', 'FinTech', 'MBA & BBA Students', 'Product Management'],
    array['Startup partnerships', 'Lead generation', 'Thought leadership'],
    12000,
    300000,
    'USD',
    array['Cash', 'Prizes', 'Venue'],
    'approved',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111101',
    'Autumn Cultural & Acoustic Night (Demo)',
    'An outdoor evening celebration showcasing student acoustic bands, fine arts exhibitions, and local campus food stalls for the wider university community.',
    'cultural',
    'Lahore',
    'Pakistan',
    'Central Campus Amphitheatre',
    now() + interval '55 days',
    now() + interval '55 days' + interval '6 hours',
    900,
    array['Undergraduate Campus', 'Music & Arts', 'Lifestyle'],
    array['Consumer sampling', 'Brand visibility'],
    25000,
    250000,
    'USD',
    array['Cash', 'Equipment', 'Food'],
    'published',
    true
  )
on conflict (id) do nothing;

insert into public.sponsorship_packages (
  id, event_id, name, description, price_minor, currency, benefits_json, availability,
  ideal_sponsor_categories, pricing_rationale, assumptions_json, ai_generated, approved_by_organizer, status
)
values
  (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333301',
    'Bronze Supporter',
    'Digital brand visibility and hackathon prize challenge mention.',
    50000,
    'USD',
    '["Logo on hackathon website and Discord", "2 social media spotlight posts", "Branded mention in opening ceremony"]'::jsonb,
    4,
    array['Developer Tools', 'Cloud & SaaS'],
    'Demo reference tier calibrated for early-stage SaaS and local tech brands (~$1.11 per estimated attendee).',
    '["Attendance is organizer-estimated at 450 builders"]'::jsonb,
    false,
    true,
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333301',
    'Silver Builder Partner',
    'On-campus recruitment booth, technical API workshop, and resume book access.',
    150000,
    'USD',
    '["45-minute technical workshop slot", "Dedicated recruitment & demo booth", "Opt-in student developer resume book", "Stage & banner logo placement"]'::jsonb,
    2,
    array['Software Engineering', 'Cloud Infrastructure', 'AI Platforms'],
    'Demo reference tier bundling direct developer engagement and workshop access.',
    '["Attendance is organizer-estimated at 450 builders", "Resume sharing is strictly opt-in"]'::jsonb,
    false,
    true,
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '33333333-3333-4333-8333-333333333301',
    'Gold Title Sponsor',
    'Co-headline naming rights, keynote slot, dedicated prize track, and judging seat.',
    250000,
    'USD',
    '["Co-headline event branding", "10-minute opening keynote", "Dedicated sponsored challenge track & judging seat", "Premium main-hall booth & all Silver benefits"]'::jsonb,
    1,
    array['Enterprise Tech', 'AI & Cloud', 'FinTech'],
    'Demo anchor tier providing exclusive track ownership and keynote visibility.',
    '["Single exclusive slot available"]'::jsonb,
    false,
    true,
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '33333333-3333-4333-8333-333333333303',
    'Festival Stage Partner',
    'Main stage branding and product sampling booth for consumer brands.',
    100000,
    'USD',
    '["Main amphitheatre banner placement", "Product sampling kiosk", "MC stage shoutouts"]'::jsonb,
    2,
    array['Beverages', 'Consumer Lifestyle', 'Retail'],
    'Demo tier tailored for high-footfall campus consumer activations.',
    '["Attendance is organizer-estimated at 900 students"]'::jsonb,
    false,
    true,
    'active'
  )
on conflict (id) do nothing;

-- Four fictional demo sponsors engineered to demonstrate strong vs. weak AI match rankings
insert into public.sponsor_profiles (
  id, user_id, company_name, industry, description, website, operating_locations,
  products_services, target_tags, objectives, budget_min_minor, budget_max_minor, currency,
  preferred_categories, preferred_locations, preferred_benefits, contact_email, verification_status, is_demo
)
values
  (
    '55555555-5555-4555-8555-555555555501',
    null,
    'Northstar Cloud & DevTools (Demo)',
    'Technology & Developer Infrastructure',
    'Cloud developer platform helping engineering teams deploy APIs and AI workflows rapidly.',
    'https://northstar-demo.example.com',
    array['Lahore', 'Karachi', 'Remote'],
    'Managed APIs, Cloud Compute Credits, Developer SDKs',
    array['Computer Science', 'AI & ML', 'Full-Stack Developers', 'Final-Year Students'],
    array['Developer hiring', 'API adoption', 'Brand awareness'],
    100000,
    300000,
    'USD',
    array['technology', 'business'],
    array['Lahore', 'Pakistan'],
    array['Workshop', 'Booth', 'Speaking slot', 'Recruitment access'],
    'sponsorships@northstar-demo.example.com',
    'verified',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    null,
    'PayFlow Campus Wallet (Demo)',
    'FinTech & Digital Payments',
    'Student-friendly digital wallet and campus commerce API platform.',
    'https://payflow-demo.example.com',
    array['Lahore', 'Islamabad'],
    'Campus payments, QR checkout, developer APIs',
    array['FinTech', 'Entrepreneurship', 'Computer Science', 'MBA & BBA Students'],
    array['Startup partnerships', 'API adoption', 'Brand awareness'],
    50000,
    200000,
    'USD',
    array['business', 'technology'],
    array['Lahore', 'Pakistan'],
    array['Booth', 'Speaking slot', 'Logo'],
    'partners@payflow-demo.example.com',
    'verified',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    null,
    'ZestSip Botanical Drinks (Demo)',
    'Food & Beverage',
    'Natural sparkling botanical beverages crafted for university students and live festivals.',
    'https://zestsip-demo.example.com',
    array['Lahore', 'Karachi'],
    'Sparkling craft beverages and campus event refreshments',
    array['Undergraduate Campus', 'Music & Arts', 'Lifestyle'],
    array['Consumer sampling', 'Brand visibility'],
    40000,
    120000,
    'USD',
    array['cultural', 'sports', 'social'],
    array['Lahore', 'Pakistan'],
    array['Booth', 'Logo', 'Sampling'],
    'campus@zestsip-demo.example.com',
    'verified',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555504',
    null,
    'Apex Heavy Industrial Logistics (Demo)',
    'Heavy Manufacturing & Freight',
    'Regional port freight and bulk industrial logistics operator.',
    'https://apexfreight-demo.example.com',
    array['Gwadar', 'Karachi'],
    'Bulk maritime shipping and warehouse cranes',
    array['Supply Chain Executives', 'Maritime Port Operations'],
    array['Enterprise B2B leads'],
    500000,
    1000000,
    'USD',
    array['other'],
    array['Karachi'],
    array['Executive dinner'],
    'corp@apexfreight-demo.example.com',
    'verified',
    true
  )
on conflict (id) do nothing;
