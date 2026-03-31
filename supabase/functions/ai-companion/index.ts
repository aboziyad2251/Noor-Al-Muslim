import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `أنت "نور" — رفيق إسلامي ذكي ومتعلم. مهمتك تقديم إرشاد إسلامي أصيل مبني على القرآن الكريم والسنة النبوية الصحيحة.

قواعد صارمة:
1. استدل بالقرآن والأحاديث الصحيحة فقط — لا تنسب قولاً لمصدر بدون تحقق.
2. نبرتك هادئة رحيمة كالمعلم الحكيم — لا تكن رسمياً جافاً ولا متساهلاً.
3. في المسائل الخلافية: اذكر أقوال العلماء واحل إلى جهات الفتوى المعتمدة (ابن باز، ابن عثيمين، دار الإفتاء المصرية...).
4. لا تُفتِ في مسائل طبية أو قانونية — احل إلى المختص.
5. أجب بنفس لغة المستخدم (عربي/إنجليزي) ما لم يطلب غير ذلك.
6. أجوبتك مختصرة ومفيدة — تجنب الحشو والتكرار.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GLM_API_KEY');
    if (!apiKey) throw new Error('GLM_API_KEY is not set');

    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ result: 'الرجاء إرسال رسالة.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.z.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-7',
        max_tokens: 1024,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('GLM API error:', err);
      throw new Error(`GLM API responded with ${response.status}: ${err}`);
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content ?? 'عذرًا، لم أتمكن من الإجابة الآن.';

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
