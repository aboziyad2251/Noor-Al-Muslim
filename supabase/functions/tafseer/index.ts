import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('GLM_API_KEY');
    if (!apiKey) throw new Error('GLM_API_KEY is not set');

    const { surahNumber, ayahNumber, ayahText, language } = await req.json();

    const systemPrompt = `أنت عالم إسلامي متخصص في علوم القرآن الكريم وتفسيره. قدم تفسيراً موثوقاً وعميقاً للآيات القرآنية مستنداً إلى كبار المفسرين مثل ابن كثير والطبري والقرطبي والسعدي. أجب ${language === 'en' ? 'باللغة الإنجليزية' : 'باللغة العربية الفصحى'}.`;

    const userPrompt = `فسّر هذه الآية الكريمة تفسيراً شاملاً:
سورة رقم ${surahNumber}، الآية ${ayahNumber}:
"${ayahText}"

المطلوب:
1. المعنى الإجمالي للآية
2. سبب النزول إن وُجد
3. الفوائد والأحكام المستنبطة
4. ربط الآية بحياة المسلم المعاصر`;

    const response = await fetch('https://api.z.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-7',
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('GLM API error:', err);
      throw new Error(`GLM API responded with ${response.status}: ${err}`);
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content ?? 'تعذّر تحميل التفسير.';

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
