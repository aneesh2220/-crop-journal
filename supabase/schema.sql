-- AgroAI database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) for a new project.
-- Safe to re-run: table creation, policies, and triggers are all idempotent.
-- Every table uses Row Level Security so a farmer can only ever read/write their own data.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  language text not null default 'en',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  location_name text,
  location_lat double precision,
  location_lng double precision,
  voice_enabled boolean not null default true,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- farms
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  location_name text,
  location_lat double precision,
  location_lng double precision,
  land_size double precision,
  land_unit text not null default 'acre' check (land_unit in ('acre', 'hectare', 'bigha')),
  soil_type text,
  irrigation_type text,
  water_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farms enable row level security;
drop policy if exists "farms: owner all" on public.farms;
create policy "farms: owner all" on public.farms for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- crops
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  variety text,
  stage text not null default 'preparation' check (stage in ('preparation', 'sowing', 'growth', 'flowering', 'harvest')),
  stage_progress integer not null default 0 check (stage_progress between 0 and 100),
  planting_date date,
  expected_harvest_date date,
  actual_harvest_date date,
  area double precision,
  area_unit text not null default 'acre' check (area_unit in ('acre', 'hectare', 'bigha')),
  health_score integer check (health_score between 0 and 100),
  status text not null default 'active' check (status in ('active', 'harvested', 'failed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crops enable row level security;
drop policy if exists "crops: owner all" on public.crops;
create policy "crops: owner all" on public.crops for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- farm_tasks
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.farm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete cascade,
  crop_id uuid references public.crops (id) on delete cascade,
  title text not null,
  type text not null check (type in ('irrigation', 'fertilizer', 'spraying', 'inspection', 'harvesting', 'other')),
  due_date timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farm_tasks enable row level security;
drop policy if exists "farm_tasks: owner all" on public.farm_tasks;
create policy "farm_tasks: owner all" on public.farm_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- conversations + messages (AI assistant history)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
drop policy if exists "conversations: owner all" on public.conversations;
create policy "conversations: owner all" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  audio_url text,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
drop policy if exists "messages: owner all" on public.messages;
create policy "messages: owner all" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- crop_diagnoses (Crop Doctor results)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.crop_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  crop_id uuid references public.crops (id) on delete set null,
  image_url text,
  symptoms text,
  diagnosis jsonb,
  created_at timestamptz not null default now()
);

alter table public.crop_diagnoses enable row level security;
drop policy if exists "crop_diagnoses: owner all" on public.crop_diagnoses;
create policy "crop_diagnoses: owner all" on public.crop_diagnoses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- soil_analyses (Soil Health Analyzer results)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.soil_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  image_url text,
  ph double precision,
  nitrogen double precision,
  phosphorus double precision,
  potassium double precision,
  texture text,
  analysis jsonb,
  created_at timestamptz not null default now()
);

alter table public.soil_analyses enable row level security;
drop policy if exists "soil_analyses: owner all" on public.soil_analyses;
create policy "soil_analyses: owner all" on public.soil_analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('weather', 'irrigation', 'task', 'market', 'system')),
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "notifications: owner all" on public.notifications;
create policy "notifications: owner all" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- ai_usage_daily — a hard, code-enforced spend-safety cap for the Gemini API.
-- The ai-assist edge function checks and increments this BEFORE every Gemini
-- call and refuses once the daily limit is hit, so total possible spend per
-- day is a known, bounded number regardless of bugs, abuse, or traffic spikes
-- — independent of (and stricter than) whatever Google Cloud billing alerts
-- are configured. No RLS policies are defined, so no client can ever read or
-- write this table — only the edge function's service-role key can, by design.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_usage_daily (
  usage_date date primary key,
  request_count integer not null default 0
);

alter table public.ai_usage_daily enable row level security;

create or replace function public.increment_ai_usage_and_get_count(p_date date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage_daily (usage_date, request_count)
  values (p_date, 1)
  on conflict (usage_date) do update set request_count = ai_usage_daily.request_count + 1
  returning request_count into new_count;
  return new_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- storage buckets for crop / soil photos and voice notes
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('crop-images', 'crop-images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('soil-images', 'soil-images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

drop policy if exists "crop-images: owner read/write" on storage.objects;
create policy "crop-images: owner read/write"
  on storage.objects for all
  using (bucket_id = 'crop-images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'crop-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "soil-images: owner read/write" on storage.objects;
create policy "soil-images: owner read/write"
  on storage.objects for all
  using (bucket_id = 'soil-images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'soil-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "voice-notes: owner read/write" on storage.objects;
create policy "voice-notes: owner read/write"
  on storage.objects for all
  using (bucket_id = 'voice-notes' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'voice-notes' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────────────────
-- crop_logs — the day-by-day diary for a crop
--
-- `entry_date` is the day the work actually happened (the farmer may log it in
-- the evening, or a day late), while `created_at` is when it was written down.
-- Keeping both matters: the gap between them is the honest signal of how
-- contemporaneous a record is, which is exactly what anyone reading the record
-- later needs to judge. Never overwrite created_at.
--
-- `location_lat/lng` is captured when available because an entry written while
-- standing in the field is materially better evidence than one typed at home.
-- ─────────────────────────────────────────────────────────────────────────
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
create policy "crop_logs: owner all" on public.crop_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Per-user daily AI quota.
--
-- The existing ai_usage_daily counter is app-wide, which protects the bill but not the
-- users: one person (or a script) hammering the chat exhausts the shared allowance and
-- every other farmer is locked out for the rest of the day. This adds a second, per-user
-- counter so a single heavy user can only ever spend their own share.
--
-- Safe to run more than once.

create table if not exists public.ai_usage_user_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0,
  primary key (user_id, usage_date)
);

-- No RLS policies on purpose: the table has RLS enabled and zero policies, so no client
-- can read or write it directly. Only the edge function, running with the service-role
-- key, can touch it — the same pattern as ai_usage_daily.
alter table public.ai_usage_user_daily enable row level security;

create or replace function public.increment_user_ai_usage_and_get_count(p_user uuid, p_date date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage_user_daily (user_id, usage_date, request_count)
  values (p_user, p_date, 1)
  on conflict (user_id, usage_date)
    do update set request_count = ai_usage_user_daily.request_count + 1
  returning request_count into new_count;
  return new_count;
end;
$$;

-- Keeps the table from growing without bound; nothing reads yesterday's rows.
create index if not exists ai_usage_user_daily_date_idx on public.ai_usage_user_daily (usage_date);
