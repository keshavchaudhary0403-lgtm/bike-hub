-- Live listings: service centres, repair shops and riding-gear shops imported from
-- OpenStreetMap (free, storable under ODbL with attribution). `google_place_id` is
-- reserved for a later Google Places enrichment; Google content itself must not be
-- stored beyond its caching terms, only the place id.
create extension if not exists pg_trgm;

alter table public.service_centres
  add column if not exists listing_type text not null default 'service_centre'
    check (listing_type in ('service_centre','repair_shop','gear_shop')),
  add column if not exists source text not null default 'partner'
    check (source in ('partner','osm','google')),
  add column if not exists source_id text,
  add column if not exists google_place_id text unique,
  add column if not exists brands text[] not null default '{}',
  add column if not exists opening_hours_text text,
  add column if not exists search_text text,
  add column if not exists last_synced_at timestamptz;

create unique index if not exists service_centres_source_idx on public.service_centres(source, source_id);
create index if not exists service_centres_type_city_idx on public.service_centres(listing_type, city);
create index if not exists service_centres_search_idx on public.service_centres using gin (search_text gin_trgm_ops);

create or replace function public.service_centres_search_text() returns trigger language plpgsql as $$
begin
  new.search_text := lower(concat_ws(' ', new.name, new.centre_type, new.description, new.address_line,
    new.locality, new.city, new.state, array_to_string(new.brands, ' ')));
  new.updated_at := now();
  return new;
end;$$;
drop trigger if exists service_centres_search_text on public.service_centres;
create trigger service_centres_search_text before insert or update on public.service_centres
  for each row execute procedure public.service_centres_search_text();
update public.service_centres set search_text = null;

-- The original seed rows are demonstration profiles with placeholder phone numbers.
update public.service_centres set is_active = false where source = 'partner' and phone like '+91 00000%';

-- Contact form
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, message text not null,
  status text not null default 'new', created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "public contact submission" on public.contact_messages;
create policy "public contact submission" on public.contact_messages for insert
  with check (length(name) > 1 and position('@' in email) > 1 and length(message) > 4);
drop policy if exists "admin read contact" on public.contact_messages;
create policy "admin read contact" on public.contact_messages for select using (public.current_role() in ('moderator','admin'));
drop policy if exists "admin update contact" on public.contact_messages;
create policy "admin update contact" on public.contact_messages for update using (public.current_role() in ('moderator','admin'));

-- Administrators see and moderate every centre, including inactive ones.
drop policy if exists "admin read centres" on public.service_centres;
create policy "admin read centres" on public.service_centres for select using (public.current_role() in ('moderator','admin'));
drop policy if exists "admin update centres" on public.service_centres;
create policy "admin update centres" on public.service_centres for update
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));
drop policy if exists "partners update own enquiries" on public.enquiries;
create policy "partners update own enquiries" on public.enquiries for update
  using (exists(select 1 from public.service_centres c where c.id = centre_id and c.owner_id = auth.uid()) or public.current_role() in ('moderator','admin'));

grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;
