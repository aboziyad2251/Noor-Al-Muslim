-- Web Push subscriptions table for iOS Safari + Chrome notifications
create table if not exists public.user_push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Allow anonymous subscriptions (guests) and authenticated users
alter table public.user_push_subscriptions enable row level security;

create policy "Anyone can insert their own subscription"
  on public.user_push_subscriptions for insert
  with check (true);

create policy "Anyone can update their own subscription"
  on public.user_push_subscriptions for update
  using (true);

create policy "Service role can read all subscriptions"
  on public.user_push_subscriptions for select
  using (true);
