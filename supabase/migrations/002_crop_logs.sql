-- Run this once in the Supabase SQL editor to enable the daily crop diary.
-- Safe to run more than once.

create table if not exists public.crop_logs (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  type text not null default 'observation' check (type in (
    'sowing', 'irrigation', 'fertilizer', 'spraying', 'weeding',
    'observation', 'problem', 'harvest', 'expense', 'other'
  )),
  note text,
  photo_url text,
  location_lat double precision,
  location_lng double precision,
  cost numeric(12, 2),
  created_at timestamptz not null default now()
);

create index if not exists crop_logs_crop_date_idx on public.crop_logs (crop_id, entry_date desc);

alter table public.crop_logs enable row level security;
drop policy if exists "crop_logs: owner all" on public.crop_logs;
create policy "crop_logs: owner all" on public.crop_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
