-- Initial Schema for Noor Al Muslim App
-- Enable required extensions
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  username text unique,
  avatar_url text,
  language text default 'ar',  -- Default app language is Arabic
  default_madhab text default 'hanafi', -- To be used in prayer calculation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" 
  on profiles for select using (true);

create policy "Users can insert their own profile" 
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on profiles for update using (auth.uid() = id);

-- 2. Create User Settings & Preferences
create table public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade not null primary key,
  show_adhan_notifications boolean default true,
  quran_font_size integer default 24,
  reciter_id text default 'ar.alafasy', -- Default reciter (Mishary Rashid Al-Afasy)
  theme text default 'dark',
  daily_goal_ayahs integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_settings enable row level security;
create policy "Users can manage their settings" 
  on user_settings for all using (auth.uid() = user_id);

-- 3. Create Prayer Logs Table (Gamification / Stats)
create table public.prayer_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prayer_name text not null, -- 'fajr', 'dhuhr', etc.
  logged_date date not null default current_date,
  status text not null check (status in ('jamaah', 'on_time', 'late', 'missed', 'qada')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, prayer_name, logged_date) -- Only one log per prayer per day
);

-- Enable RLS
alter table public.prayer_logs enable row level security;
create policy "Users manage their prayer logs" 
  on prayer_logs for all using (auth.uid() = user_id);

-- 4. Create AI Chat History Table
create table public.ai_chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic text not null,
  summary text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ai_chat_history enable row level security;
create policy "Users view their AI chat history" 
  on ai_chat_history for select using (auth.uid() = user_id);
create policy "Users create their AI chat history" 
  on ai_chat_history for insert with check (auth.uid() = user_id);

-- Trigger for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_settings_updated
  before update on public.user_settings
  for each row execute procedure public.handle_updated_at();

-- Trigger to create a profile automatically after Auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, language)
  values (new.id, new.raw_user_meta_data->>'full_name', 'ar');
  
  insert into public.user_settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
