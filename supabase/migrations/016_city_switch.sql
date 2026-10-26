-- Cities on the public site. Admins switch a city on or off in Admin → Cities;
-- listings in a switched-off city stay in the database but are hidden from riders.
create table if not exists public.cities (
  name text primary key,
  is_live boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.cities enable row level security;
drop policy if exists "public read cities" on public.cities;
create policy "public read cities" on public.cities for select using (true);
drop policy if exists "staff manage cities" on public.cities;
create policy "staff manage cities" on public.cities for all to authenticated
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));
grant select on public.cities to anon, authenticated;
grant insert, update on public.cities to authenticated;

-- Delhi NCR is live; every other city starts switched off.
insert into public.cities (name, is_live) values
  ('New Delhi', true), ('Noida', true), ('Gurugram', true), ('Ghaziabad', true), ('Faridabad', true),
  ('Mumbai', false), ('Pune', false), ('Bengaluru', false), ('Hyderabad', false), ('Chennai', false), ('Kolkata', false),
  ('Ahmedabad', false), ('Jaipur', false), ('Chandigarh', false), ('Lucknow', false), ('Kochi', false), ('Indore', false), ('Dehradun', false)
on conflict (name) do nothing;
