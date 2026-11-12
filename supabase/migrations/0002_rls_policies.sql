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
