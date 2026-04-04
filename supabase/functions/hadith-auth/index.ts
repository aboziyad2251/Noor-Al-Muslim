import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not set');

    const { hadithText, language } = await req.json();

    const systemPrompt = `أنت محدّث متخصص في علوم الحديث النبوي الشريف ومصطلحه. مهمتك تحقيق نسبة الأحاديث إلى مصادرها وبيان درجتها. كن دقيقاً وأميناً: إذا لم تتعرف على الحديث بيقين فقل ذلك صراحةً. لا تجزم إلا بما تعلم. أجب ${language === 'en' ? 'باللغة الإنجليزية' : 'باللغة العربية'}.`;

    const userPrompt = `تحقق من صحة هذا الحديث أو القول:
"${hadithText}"

أجب عن:
1. هل هذا حديث نبوي موجود في المصادر المعتمدة؟
2. المصدر (الكتاب، الباب، الرقم)
3. درجة الحديث: صحيح / حسن / ضعيف / موضوع / لا أصل له
4. رأي كبار المحدثين في الحديث (البخاري، مسلم، الألباني، ابن حجر...)
5. التحذير إن كان الحديث ضعيفاً أو موضوعاً`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1536,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('DeepSeek API error:', err);
      throw new Error(`DeepSeek API responded with ${response.status}: ${err}`);
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content ?? 'تعذّر التحقق من الحديث.';

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
