-- AI Rate Limiting Table
-- Tracks per-identifier (user_id or IP) daily call counts for AI Edge Functions

create table public.ai_rate_limits (
  identifier text not null,          -- "user:<uuid>" or "ip:<address>"
  date date not null default current_date,
  count integer not null default 0,
  primary key (identifier, date)
);

-- No RLS needed — only accessible via service role key in Edge Functions
-- Auto-clean old rows (keep 30 days)
create index ai_rate_limits_date_idx on public.ai_rate_limits (date);

-- Atomic increment function — returns the new count after incrementing
create or replace function public.increment_ai_rate_limit(
  p_identifier text,
  p_date date
) returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into public.ai_rate_limits (identifier, date, count)
  values (p_identifier, p_date, 1)
  on conflict (identifier, date)
  do update set count = ai_rate_limits.count + 1
  returning count into new_count;

  return new_count;
end;
$$;
