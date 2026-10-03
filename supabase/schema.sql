-- Security policies only: assumes the existing public.rsvps table and columns.
do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'rsvps' and c.relrowsecurity
  ) then
    raise exception 'Row Level Security must already be enabled on public.rsvps. No table changes were made.';
  end if;
end;
$$;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'rsvps'
  loop
    execute format('drop policy if exists %I on public.rsvps', existing_policy.policyname);
  end loop;
end;
$$;

create policy "Public can submit RSVPs"
  on public.rsvps for insert to anon, authenticated
  with check (true);

create policy "Wedding admins can read RSVPs"
  on public.rsvps for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'wedding_admin');

create policy "Wedding admins can delete RSVPs"
  on public.rsvps for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'wedding_admin');

revoke all on public.rsvps from public, anon, authenticated;
grant insert on public.rsvps to anon, authenticated;
grant select, delete on public.rsvps to authenticated;
