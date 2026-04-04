import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, rateLimitExceededResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.allowed) return rateLimitExceededResponse(corsHeaders);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY')!;

    // Authenticate
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

    const { surahNumber, surahName, repetitions } = await req.json();
    if (!surahNumber || !surahName) {
      return new Response(JSON.stringify({ error: 'surahNumber and surahName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const level = repetitions <= 1 ? 'مبتدئ' : repetitions <= 5 ? 'متوسط' : 'متقدم';

    const prompt = `أنت "نور" — معلم تجويد وحفظ قرآن كريم حكيم. قدّم نصيحة تعليمية شخصية لمسلم يحفظ سورة ${surahName} (رقم ${surahNumber}).

مستوى الحافظ: ${level} (مرّ على المراجعة ${repetitions} مرة).

اكتب نصيحة حفظ وتجويد باللغة العربية تشمل:
1. **نقطة تجويد** — قاعدة تجويد مهمة خاصة بهذه السورة (مثل: مد، غنة، إدغام، إخفاء...)
2. **وسيلة حفظ** — تقنية عملية لتثبيت الآيات في الذاكرة مناسبة للمستوى
3. **تشجيع** — جملة دافئة مع فضل حفظ القرآن

الأسلوب: معلم لطيف صبور. الطول: 100-150 كلمة فقط. ابدأ مباشرةً دون مقدمات.`;

    const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) throw new Error(`DeepSeek error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const tip = aiData?.choices?.[0]?.message?.content ?? 'تعذّر إنشاء النصيحة.';

    return new Response(JSON.stringify({ tip }), {
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
