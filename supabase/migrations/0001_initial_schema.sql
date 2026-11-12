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
