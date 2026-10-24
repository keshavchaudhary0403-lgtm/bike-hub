-- Capability Matrix: which class of bike (bike level) a shop can handle for which depth of job (service level).
-- Codes and rules live in src/lib/matrix/config.ts; the database only stores cells and their evidence.
-- Status ladder per cell: claimed (shop says) < visited (BikeHub audit) < proven (visited + 3 approved rider reviews).

-- The first schema's capability table was never used by the app; the matrix replaces it.
drop table if exists public.centre_capabilities;

-- Bikes riders pick from. Seeded from src/data/bike-models.ts (migration 014).
create table if not exists public.bike_models (
  id text primary key,
  brand text not null,
  model text not null,
  variant text,
  bike_level text not null check (bike_level in ('L1','L2','L3','L4','CLASSIC','EV')),
  cc int,
  fuel text not null default 'fi' check (fuel in ('fi','carb','electric')),
  brand_tools_required text[] not null default '{}',
  is_current_in_india boolean not null default true,
  years text,
  needs_review boolean not null default false
);
alter table public.bike_models enable row level security;
drop policy if exists "public bike models" on public.bike_models;
create policy "public bike models" on public.bike_models for select using (true);
drop policy if exists "admin manage bike models" on public.bike_models;
create policy "admin manage bike models" on public.bike_models for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Shop-level fields. official_brands = authorised dealer for these brands (admin-set, warranty-safe).
alter table public.service_centres
  add column if not exists official_brands text[] not null default '{}',
  add column if not exists brand_exclusive boolean not null default false,
  add column if not exists skills text[] not null default '{}',
  add column if not exists merged_source_ids text[] not null default '{}';
create index if not exists service_centres_official_idx on public.service_centres using gin (official_brands);

-- Partners may set their own speciality tags; official brands and exclusivity stay with BikeHub.
create or replace function public.protect_centre_fields() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or public.current_role() in ('admin','moderator') then return new; end if;
  if (new.name,new.slug,new.listing_type,new.city,new.state,new.address_line,new.latitude,new.longitude,
      new.verification_status,new.last_verified_at,new.is_active,new.is_featured,new.owner_id,new.source,new.brands,
      new.official_brands,new.brand_exclusive,new.merged_source_ids)
     is distinct from
     (old.name,old.slug,old.listing_type,old.city,old.state,old.address_line,old.latitude,old.longitude,
      old.verification_status,old.last_verified_at,old.is_active,old.is_featured,old.owner_id,old.source,old.brands,
      old.official_brands,old.brand_exclusive,old.merged_source_ids) then
    raise exception 'Partners can only edit contact details, hours, description and specialities';
  end if;
  return new;
end;$$;

-- One row per (shop, bike level, service level). Empty brands = every brand at that level.
create table if not exists public.shop_capabilities (
  shop_id uuid not null references public.service_centres(id) on delete cascade,
  bike_level text not null check (bike_level in ('L1','L2','L3','L4','CLASSIC','EV')),
  service_level text not null check (service_level in ('S1','S2','S3','S4','S5')),
  brands text[] not null default '{}',
  status text not null default 'claimed' check (status in ('claimed','visited','proven')),
  source text not null default 'partner' check (source in ('partner','osm','audit','reports','admin')),
  note text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (shop_id, bike_level, service_level)
);
create index if not exists shop_capabilities_cell_idx on public.shop_capabilities(bike_level, service_level, status);
alter table public.shop_capabilities enable row level security;
-- Riders see claimed cells too (labelled "Not yet verified"); the app decides what counts as available.
drop policy if exists "public capabilities" on public.shop_capabilities;
create policy "public capabilities" on public.shop_capabilities for select using (true);
-- Partners can only add, change or remove their own CLAIMED cells.
drop policy if exists "partners claim cells" on public.shop_capabilities;
create policy "partners claim cells" on public.shop_capabilities for insert to authenticated
  with check (status = 'claimed' and source = 'partner' and exists (select 1 from public.service_centres c where c.id = shop_id and c.owner_id = auth.uid()));
drop policy if exists "partners update claimed cells" on public.shop_capabilities;
create policy "partners update claimed cells" on public.shop_capabilities for update to authenticated
  using (status = 'claimed' and exists (select 1 from public.service_centres c where c.id = shop_id and c.owner_id = auth.uid()))
  with check (status = 'claimed' and exists (select 1 from public.service_centres c where c.id = shop_id and c.owner_id = auth.uid()));
drop policy if exists "partners remove claimed cells" on public.shop_capabilities;
create policy "partners remove claimed cells" on public.shop_capabilities for delete to authenticated
  using (status = 'claimed' and exists (select 1 from public.service_centres c where c.id = shop_id and c.owner_id = auth.uid()));
drop policy if exists "staff manage capabilities" on public.shop_capabilities;
create policy "staff manage capabilities" on public.shop_capabilities for all to authenticated
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));

-- Every change to a cell is logged with who made it and why.
create table if not exists public.capability_log (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.service_centres(id) on delete cascade,
  bike_level text not null,
  service_level text not null,
  from_status text,
  to_status text,
  brands text[],
  source text,
  note text,
  actor uuid,
  created_at timestamptz not null default now()
);
create index if not exists capability_log_shop_idx on public.capability_log(shop_id, created_at desc);
alter table public.capability_log enable row level security;
drop policy if exists "staff read capability log" on public.capability_log;
create policy "staff read capability log" on public.capability_log for select to authenticated
  using (public.current_role() in ('moderator','admin'));

create or replace function public.log_capability_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.capability_log(shop_id,bike_level,service_level,from_status,to_status,brands,source,note,actor)
    values (old.shop_id,old.bike_level,old.service_level,old.status,null,old.brands,old.source,'removed',auth.uid());
    return old;
  end if;
  if tg_op = 'UPDATE' and new.status is not distinct from old.status and new.brands is not distinct from old.brands then return new; end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  insert into public.capability_log(shop_id,bike_level,service_level,from_status,to_status,brands,source,note,actor)
  values (new.shop_id,new.bike_level,new.service_level,case when tg_op='UPDATE' then old.status end,new.status,new.brands,new.source,new.note,auth.uid());
  return new;
end;$$;
drop trigger if exists log_capability_change on public.shop_capabilities;
create trigger log_capability_change before insert or update or delete on public.shop_capabilities
  for each row execute procedure public.log_capability_change();

-- Photos and checklist items backing a shop's cells.
create table if not exists public.capability_evidence (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.service_centres(id) on delete cascade,
  bike_level text check (bike_level in ('L1','L2','L3','L4','CLASSIC','EV')),
  service_level text check (service_level in ('S1','S2','S3','S4','S5')),
  type text not null check (type in ('photo','audit_item','service_report')),
  url_or_ref text not null check (length(url_or_ref) <= 300),
  note text check (length(note) <= 500),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists capability_evidence_shop_idx on public.capability_evidence(shop_id);
alter table public.capability_evidence enable row level security;
drop policy if exists "owners read evidence" on public.capability_evidence;
create policy "owners read evidence" on public.capability_evidence for select to authenticated
  using (public.can_edit_centre(shop_id::text));
drop policy if exists "owners add evidence" on public.capability_evidence;
create policy "owners add evidence" on public.capability_evidence for insert to authenticated
  with check (public.can_edit_centre(shop_id::text) and (type = 'photo' or public.current_role() in ('moderator','admin'))
    and (type <> 'photo' or url_or_ref like shop_id::text || '/%'));
drop policy if exists "owners remove evidence" on public.capability_evidence;
create policy "owners remove evidence" on public.capability_evidence for delete to authenticated
  using (public.can_edit_centre(shop_id::text));

-- BikeHub field audits, filled on the auditor's phone.
create table if not exists public.shop_audits (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.service_centres(id) on delete cascade,
  auditor uuid references auth.users(id) on delete set null,
  auditor_name text,
  visited_at date not null default current_date,
  answers jsonb not null default '{}'::jsonb,
  photos jsonb not null default '{}'::jsonb,
  result_cells jsonb not null default '[]'::jsonb,
  overrides jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists shop_audits_shop_idx on public.shop_audits(shop_id, created_at desc);
alter table public.shop_audits enable row level security;
drop policy if exists "staff manage audits" on public.shop_audits;
create policy "staff manage audits" on public.shop_audits for all to authenticated
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));

-- "Request visit" from the partner footprint editor.
create table if not exists public.audit_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.service_centres(id) on delete cascade,
  requested_by uuid default auth.uid() references auth.users(id) on delete set null,
  cells jsonb not null default '[]'::jsonb,
  note text check (length(note) <= 1000),
  status text not null default 'new' check (status in ('new','scheduled','done','declined')),
  created_at timestamptz not null default now()
);
alter table public.audit_requests enable row level security;
drop policy if exists "owners request visits" on public.audit_requests;
create policy "owners request visits" on public.audit_requests for insert to authenticated
  with check (status = 'new' and exists (select 1 from public.service_centres c where c.id = shop_id and c.owner_id = auth.uid()));
drop policy if exists "owners read own requests" on public.audit_requests;
create policy "owners read own requests" on public.audit_requests for select to authenticated
  using (public.can_edit_centre(shop_id::text));
drop policy if exists "staff manage requests" on public.audit_requests;
create policy "staff manage requests" on public.audit_requests for all to authenticated
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));

-- Rider reviews double as service reports: which bike, which kind of job.
alter table public.reviews
  add column if not exists bike_model_id text references public.bike_models(id) on delete set null,
  add column if not exists bike_level text check (bike_level in ('L1','L2','L3','L4','CLASSIC','EV')),
  add column if not exists service_level text check (service_level in ('S1','S2','S3','S4','S5'));
create index if not exists reviews_cell_idx on public.reviews(centre_id, bike_level, service_level) where status = 'published';

grant select on public.bike_models, public.shop_capabilities to anon, authenticated;
grant insert, update, delete on public.shop_capabilities, public.capability_evidence, public.audit_requests, public.shop_audits to authenticated;
grant select on public.capability_evidence, public.audit_requests, public.shop_audits, public.capability_log to authenticated;
grant update on public.bike_models to authenticated;
