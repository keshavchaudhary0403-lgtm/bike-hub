-- Admin-edited routes and articles, rider reviews, article comments and story submissions.
-- Everything riders send waits as a draft until an admin approves it.

-- Articles: author byline and sources live with the post (author_id is for staff accounts).
alter table public.posts
  add column if not exists author_name text,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();
alter table public.routes add column if not exists updated_at timestamptz not null default now();

-- Reviews: one overall star rating plus an optional comment. Totals are kept on the listing for cards.
alter table public.reviews add column if not exists service_used text;
alter table public.reviews drop constraint if exists reviews_lengths;
alter table public.reviews add constraint reviews_lengths
  check (length(reviewer_name) between 2 and 80 and coalesce(length(body),0) <= 2000 and coalesce(length(service_used),0) <= 120);
alter table public.comments drop constraint if exists comments_lengths;
alter table public.comments add constraint comments_lengths
  check (length(display_name) between 2 and 80 and length(body) between 3 and 2000);

alter table public.service_centres
  add column if not exists rating_avg numeric(2,1),
  add column if not exists rating_count int not null default 0;

create or replace function public.refresh_centre_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_centre uuid := coalesce(new.centre_id, old.centre_id);
begin
  update public.service_centres c set
    rating_count = s.n, rating_avg = case when s.n > 0 then round(s.avg, 1) end
  from (select count(*) n, avg(overall_rating) avg from public.reviews where centre_id = v_centre and status = 'published') s
  where c.id = v_centre;
  return null;
end;$$;
drop trigger if exists refresh_centre_rating on public.reviews;
create trigger refresh_centre_rating after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_centre_rating();

-- Rider stories sent through "Share your story". Kept apart from posts so the sender's email is never public.
create table if not exists public.story_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, title text not null, category text not null, body text not null,
  status text not null default 'new' check (status in ('new','accepted','declined')),
  created_at timestamptz not null default now(),
  constraint story_lengths check (length(name) between 2 and 80 and length(title) between 5 and 160 and length(body) between 50 and 20000)
);
alter table public.story_submissions enable row level security;
drop policy if exists "public story submission" on public.story_submissions;
create policy "public story submission" on public.story_submissions for insert
  with check (position('@' in email) > 1 and status = 'new');
drop policy if exists "admin manage stories" on public.story_submissions;
create policy "admin manage stories" on public.story_submissions for all
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));

-- Staff moderate reviews and comments.
drop policy if exists "admin manage reviews" on public.reviews;
create policy "admin manage reviews" on public.reviews for all
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));
drop policy if exists "admin manage comments" on public.comments;
create policy "admin manage comments" on public.comments for all
  using (public.current_role() in ('moderator','admin')) with check (public.current_role() in ('moderator','admin'));

grant insert on public.story_submissions to anon, authenticated;
grant select, update, delete on public.story_submissions to authenticated;
grant insert, update, delete on public.posts, public.routes to authenticated;
grant update, delete on public.reviews, public.comments to authenticated;

-- Images for routes and articles, uploaded by staff from the admin editors.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images', 'content-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "content images upload" on storage.objects;
create policy "content images upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'content-images' and public.current_role() in ('moderator','admin'));
drop policy if exists "content images delete" on storage.objects;
create policy "content images delete" on storage.objects for delete to authenticated
  using (bucket_id = 'content-images' and public.current_role() in ('moderator','admin'));
