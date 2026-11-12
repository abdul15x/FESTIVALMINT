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
