-- Listing photos: partners (for their own listings) and admins upload to the public
-- `listing-photos` bucket under `<centre id>/`. The first photo is the listing's cover.
alter table public.service_centres add column if not exists photos text[] not null default '{}';

-- Every stored path must sit in that listing's own folder; at most 8 photos.
create or replace function public.valid_listing_photos(p_id uuid, p_photos text[]) returns boolean
language sql immutable as $$
  select cardinality(p_photos) <= 8
     and coalesce(bool_and(p like p_id::text || '/%' and p !~ '\.\.' and length(p) <= 120), true)
  from unnest(p_photos) p
$$;
alter table public.service_centres drop constraint if exists service_centres_photos_valid;
alter table public.service_centres add constraint service_centres_photos_valid check (public.valid_listing_photos(id, photos));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- True when the signed-in user owns the listing with this id, or is staff.
create or replace function public.can_edit_centre(p_centre text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('moderator','admin')
      or exists (select 1 from public.service_centres where id::text = p_centre and owner_id = auth.uid())
$$;
revoke execute on function public.can_edit_centre(text) from public, anon;
grant execute on function public.can_edit_centre(text) to authenticated;

drop policy if exists "listing photos upload" on storage.objects;
create policy "listing photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and public.can_edit_centre((storage.foldername(name))[1]));
drop policy if exists "listing photos delete" on storage.objects;
create policy "listing photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and public.can_edit_centre((storage.foldername(name))[1]));
