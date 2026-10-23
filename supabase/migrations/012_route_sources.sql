-- Routes list the sources their facts were checked against, like articles do.
alter table public.routes add column if not exists sources jsonb not null default '[]'::jsonb;
