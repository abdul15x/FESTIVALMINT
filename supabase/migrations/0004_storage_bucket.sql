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
