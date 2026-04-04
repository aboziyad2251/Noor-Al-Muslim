import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Returns ISO week key like "2026-W14" */
function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Returns YYYY-MM-DD strings for the last 7 days */
function getLastSevenDays(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY')!;

    // Authenticate the calling user
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const weekKey = getISOWeekKey(new Date());
    const sb = createClient(supabaseUrl, serviceKey);

    // Return cached report if already generated this week
    const { data: existing } = await sb
      .from('weekly_reports')
      .select('report_ar, stats, created_at')
      .eq('user_id', user.id)
      .eq('week_key', weekKey)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ report: existing.report_ar, stats: existing.stats, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather this week's stats
    const days = getLastSevenDays();
    const startDate = days[0];
    const endDate = days[6];

    const [{ data: prayerLogs }, { data: fastingLogs }] = await Promise.all([
      sb.from('prayer_logs')
        .select('prayer_name, logged_date, status')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate),
      sb.from('fasting_logs')
        .select('fasted_date, fast_type')
        .eq('user_id', user.id)
        .gte('fasted_date', startDate)
        .lte('fasted_date', endDate),
    ]);

    // Compute stats
    const prayerDays = new Set((prayerLogs ?? []).map((l: any) => l.logged_date)).size;
    const totalPrayers = (prayerLogs ?? []).length;
    const jamaahCount = (prayerLogs ?? []).filter((l: any) => l.status === 'jamaah').length;
    const missedCount = (prayerLogs ?? []).filter((l: any) => l.status === 'missed').length;
    const fastingDays = (fastingLogs ?? []).length;

    const stats = {
      prayerDays,
      totalPrayers,
      possiblePrayers: 35, // 5 × 7
      jamaahCount,
      missedCount,
      fastingDays,
      weekKey,
      startDate,
      endDate,
    };

    // Build prompt for DeepSeek
    const prompt = `أنت "نور" — رفيق إسلامي حكيم. قم بإعداد تقرير روحاني أسبوعي شخصي لمسلم بناءً على إحصائيات عبادته خلال الأسبوع الماضي.

إحصائيات الأسبوع:
- أيام سجّل فيها صلوات: ${prayerDays} من 7
- إجمالي الصلوات المسجّلة: ${totalPrayers} من 35
- صلوات بالجماعة: ${jamaahCount}
- صلوات فائتة: ${missedCount}
- أيام الصيام: ${fastingDays}

اكتب تقريراً روحانياً دافئاً ومشجعاً باللغة العربية الفصيحة يشمل:
1. **تقييم الأسبوع** — جملتان صادقتان عن مستوى العبادة هذا الأسبوع
2. **نقطة قوة** — شيء إيجابي يستحق الثناء من هذه الإحصائيات
3. **نقطة تحسين** — نصيحة عملية واحدة للأسبوع القادم
4. **آية أو حديث** — نص قرآني أو حديث نبوي صحيح مناسب للحال
5. **دعاء مقترح** — دعاء قصير للأسبوع القادم

التنسيق: استخدم عناوين واضحة. الأسلوب: حنون كالمعلم الحكيم، ليس رسمياً جافاً. الطول: 200-300 كلمة.`;

    const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) throw new Error(`DeepSeek error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const report_ar = aiData?.choices?.[0]?.message?.content ?? 'تعذّر إنشاء التقرير.';

    // Store in DB
    await sb.from('weekly_reports').upsert(
      { user_id: user.id, week_key: weekKey, report_ar, stats },
      { onConflict: 'user_id,week_key' }
    );

    return new Response(JSON.stringify({ report: report_ar, stats, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
