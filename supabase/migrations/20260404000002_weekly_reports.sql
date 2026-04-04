-- Weekly Spiritual Report Card
-- Stores AI-generated weekly reports per user, keyed by ISO week (YYYY-Www)

create table public.weekly_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_key text not null,         -- e.g. "2026-W14" (ISO week)
  report_ar text not null,        -- Arabic report body from DeepSeek
  stats jsonb not null default '{}', -- { prayers, fasting, azkar, quran }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_key)
);

alter table public.weekly_reports enable row level security;

create policy "Users read their own reports"
  on weekly_reports for select using (auth.uid() = user_id);

create policy "Service role inserts reports"
  on weekly_reports for insert with check (true);
