-- Fasting Logs Table
create table public.fasting_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  fasted_date date not null default current_date,
  fast_type text not null default 'voluntary'
    check (fast_type in ('ramadan', 'sunnah_mon_thu', 'shawwal', 'ayyam_beed', 'voluntary')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, fasted_date)
);

alter table public.fasting_logs enable row level security;

create policy "Users manage their fasting logs"
  on fasting_logs for all using (auth.uid() = user_id);
