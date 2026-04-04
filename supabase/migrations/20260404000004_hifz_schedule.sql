-- AI Hifz Path — Spaced Repetition Schedule
-- Tracks which surahs the user is memorizing and when to review them next

create table public.hifz_schedule (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  surah_number integer not null check (surah_number between 1 and 114),
  surah_name text not null,
  -- SM-2 inspired fields
  interval_days integer not null default 1,     -- days until next review
  repetitions integer not null default 0,       -- successful reviews in a row
  ease integer not null default 3,              -- 1=hard 2=medium 3=easy (index into INTERVALS)
  next_review_date date not null default current_date,
  last_reviewed_at timestamp with time zone,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, surah_number)
);

alter table public.hifz_schedule enable row level security;

create policy "Users manage their own hifz schedule"
  on hifz_schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index for efficient "due today" queries
create index hifz_schedule_due_idx on public.hifz_schedule(user_id, next_review_date);
