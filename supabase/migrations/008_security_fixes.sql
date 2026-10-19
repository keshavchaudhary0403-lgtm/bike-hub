-- 1. Only admins can change roles (SQL Editor / service role has no auth.uid(), so it still works)
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role
     and public.current_role() is distinct from 'admin' then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- 2. Partners can't create listings or edit protected fields
drop policy if exists "partners insert own centres" on public.service_centres;
create or replace function public.protect_centre_fields() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or public.current_role() in ('admin','moderator') then return new; end if;
  if (new.name,new.slug,new.listing_type,new.city,new.state,new.address_line,new.latitude,new.longitude,
      new.verification_status,new.last_verified_at,new.is_active,new.is_featured,new.owner_id,new.source,new.brands)
     is distinct from
     (old.name,old.slug,old.listing_type,old.city,old.state,old.address_line,old.latitude,old.longitude,
      old.verification_status,old.last_verified_at,old.is_active,old.is_featured,old.owner_id,old.source,old.brands) then
    raise exception 'Partners can only edit contact details, hours and description';
  end if;
  return new;
end;$$;
drop trigger if exists protect_centre_fields on public.service_centres;
create trigger protect_centre_fields before update on public.service_centres
  for each row execute procedure public.protect_centre_fields();

-- 3. Reviews and comments wait for moderation
alter table public.reviews  alter column status set default 'draft';
alter table public.comments alter column status set default 'draft';
drop policy if exists "public submit reviews" on public.reviews;
create policy "public submit reviews" on public.reviews for insert
  with check (overall_rating between 1 and 5 and status = 'draft');
drop policy if exists "public comment submission" on public.comments;
create policy "public comment submission" on public.comments for insert
  with check (length(display_name)>1 and length(body)>2 and status = 'draft');

-- 4. Signed-in users may update only the status of an enquiry
revoke update on public.enquiries from authenticated;
grant update (status) on public.enquiries to authenticated;
