-- Create private Supabase Storage bucket for fulfillment evidence (max 10 MB per object)
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
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policies for private `evidence` bucket
drop policy if exists "evidence_storage_organizer_upload" on storage.objects;
create policy "evidence_storage_organizer_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "evidence_storage_participant_select" on storage.objects;
create policy "evidence_storage_participant_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidence'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
