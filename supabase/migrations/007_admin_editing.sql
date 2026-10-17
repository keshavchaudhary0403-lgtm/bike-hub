-- Admin listing editor: protect hand-edited rows from the OSM re-import, let admins
-- create listings, and link a listing to a partner account by email.
alter table public.service_centres add column if not exists manually_edited boolean not null default false;

drop policy if exists "admin insert centres" on public.service_centres;
create policy "admin insert centres" on public.service_centres for insert
  with check (public.current_role() in ('moderator','admin'));

-- Sets (or clears, with an empty email) the partner who owns a listing.
create or replace function public.admin_set_owner(p_centre uuid, p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if public.current_role() is distinct from 'admin' and public.current_role() is distinct from 'moderator' then
    raise exception 'Not authorised';
  end if;
  if coalesce(trim(p_email), '') = '' then
    update public.service_centres set owner_id = null where id = p_centre;
    return null;
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'No account found for %', p_email; end if;
  update public.service_centres set owner_id = v_user, manually_edited = true where id = p_centre;
  return p_email;
end;$$;

-- Email of the partner who owns a listing, for display in the admin editor.
create or replace function public.admin_owner_email(p_centre uuid) returns text
language sql stable security definer set search_path = public as $$
  select u.email from public.service_centres c join auth.users u on u.id = c.owner_id
  where c.id = p_centre and public.current_role() in ('moderator','admin');
$$;

revoke execute on function public.admin_set_owner(uuid, text) from public, anon;
revoke execute on function public.admin_owner_email(uuid) from public, anon;
grant execute on function public.admin_set_owner(uuid, text) to authenticated;
grant execute on function public.admin_owner_email(uuid) to authenticated;
grant insert on public.service_centres to authenticated;
