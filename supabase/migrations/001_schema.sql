create extension if not exists "pgcrypto";
create type public.app_role as enum ('partner','moderator','admin');
create type public.verification_status as enum ('unverified','pending','verified','rejected','suspended');
create type public.content_status as enum ('draft','published','archived');
create type public.enquiry_status as enum ('new','accepted','quoted','closed','declined');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role public.app_role not null default 'partner', display_name text not null,
 phone text, avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.service_categories (id bigint generated always as identity primary key,name text unique not null,slug text unique not null,description text,icon text,sort_order int default 0);
create table public.service_centres (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id), name text not null, slug text unique not null,
 description text, centre_type text, address_line text, locality text, city text not null, state text not null, postal_code text,
 latitude numeric(9,6),longitude numeric(9,6),phone text,email text,website text,opening_hours jsonb default '{}'::jsonb,
 verification_status public.verification_status not null default 'unverified',last_verified_at timestamptz,
 indicative_price_note text,response_time_minutes int,is_featured boolean not null default false,is_active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.centre_services (centre_id uuid references public.service_centres(id) on delete cascade,category_id bigint references public.service_categories(id) on delete cascade,description text,price_from numeric(10,2),primary key(centre_id,category_id));
create table public.centre_capabilities (id bigint generated always as identity primary key,centre_id uuid references public.service_centres(id) on delete cascade,name text not null,evidence text,is_verified boolean default false);
create table public.centre_photos (id uuid primary key default gen_random_uuid(),centre_id uuid references public.service_centres(id) on delete cascade,url text not null,alt_text text,sort_order int default 0,created_at timestamptz default now());
create table public.verifications (id uuid primary key default gen_random_uuid(),centre_id uuid references public.service_centres(id) on delete cascade,reviewer_id uuid references public.profiles(id),status public.verification_status not null,checklist jsonb not null default '{}'::jsonb,notes text,created_at timestamptz default now());
create table public.enquiries (id uuid primary key default gen_random_uuid(),centre_id uuid references public.service_centres(id) on delete cascade,name text not null,phone text not null,email text,service_need text not null,status public.enquiry_status not null default 'new',created_at timestamptz default now());
create table public.reviews (id uuid primary key default gen_random_uuid(),centre_id uuid references public.service_centres(id) on delete cascade,reviewer_name text not null,overall_rating int not null check(overall_rating between 1 and 5),diagnosis_rating int check(diagnosis_rating between 1 and 5),workmanship_rating int check(workmanship_rating between 1 and 5),estimate_accuracy_rating int check(estimate_accuracy_rating between 1 and 5),timeliness_rating int check(timeliness_rating between 1 and 5),parts_authenticity_rating int check(parts_authenticity_rating between 1 and 5),behaviour_rating int check(behaviour_rating between 1 and 5),body text,visit_linked boolean default false,status public.content_status default 'published',created_at timestamptz default now());
create table public.routes (id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,summary text,description text,start_location text,end_location text,distance_km int,duration_text text,difficulty text,best_season text,safety_notes text,hero_image_url text,status public.content_status default 'draft',is_featured boolean default false,created_at timestamptz default now());
create table public.route_stops (id uuid primary key default gen_random_uuid(),route_id uuid references public.routes(id) on delete cascade,name text not null,stop_type text not null,latitude numeric(9,6),longitude numeric(9,6),notes text,sort_order int default 0);
create table public.events (id uuid primary key default gen_random_uuid(),title text not null,slug text unique not null,description text,start_at timestamptz,end_at timestamptz,start_location text,route_id uuid references public.routes(id),organiser text,capacity int,requirements text,status public.content_status default 'draft',hero_image_url text,created_at timestamptz default now());
create table public.event_registrations (id uuid primary key default gen_random_uuid(),event_id uuid references public.events(id) on delete cascade,name text not null,phone text not null,email text,created_at timestamptz default now(),unique(event_id,phone));
create table public.posts (id uuid primary key default gen_random_uuid(),author_id uuid references public.profiles(id),title text not null,slug text unique not null,category text not null,excerpt text,body text not null,hero_image_url text,status public.content_status default 'draft',is_expert_content boolean default false,published_at timestamptz,created_at timestamptz default now());
create table public.comments (id uuid primary key default gen_random_uuid(),post_id uuid references public.posts(id) on delete cascade,display_name text not null,body text not null,status public.content_status default 'published',created_at timestamptz default now());
create table public.reports (id uuid primary key default gen_random_uuid(),target_type text not null,target_id uuid not null,reporter_name text,reason text not null,status text default 'open',moderator_id uuid references public.profiles(id),created_at timestamptz default now());
create index service_centres_city_idx on public.service_centres(city);create index service_centres_verification_idx on public.service_centres(verification_status);create index reviews_centre_idx on public.reviews(centre_id);create index enquiries_centre_idx on public.enquiries(centre_id);create index routes_status_idx on public.routes(status);create index posts_status_published_idx on public.posts(status,published_at desc);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)));return new;end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
