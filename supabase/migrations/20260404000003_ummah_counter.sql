-- Anonymous Ummah Counter
-- Exposes aggregate prayer counts for today without revealing any user identifiers
-- Uses dynamic SQL + exception handler so it degrades gracefully if schema changes

create or replace function public.get_ummah_prayer_counts(p_date date default current_date)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'fajr',    count(*) filter (where prayer_name = 'الفجر'),
    'dhuhr',   count(*) filter (where prayer_name = 'الظهر'),
    'asr',     count(*) filter (where prayer_name = 'العصر'),
    'maghrib', count(*) filter (where prayer_name = 'المغرب'),
    'isha',    count(*) filter (where prayer_name = 'العشاء'),
    'total',   count(distinct user_id)
  )
  into result
  from prayer_logs
  where logged_date = p_date
    and status in ('ontime', 'late', 'jamaah');

  return coalesce(result, '{"fajr":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0,"total":0}'::jsonb);
exception when others then
  return '{"fajr":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0,"total":0}'::jsonb;
end;
$$;

-- Allow anonymous callers to call this function
grant execute on function public.get_ummah_prayer_counts(date) to anon, authenticated;
