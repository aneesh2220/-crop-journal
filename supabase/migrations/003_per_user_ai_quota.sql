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
