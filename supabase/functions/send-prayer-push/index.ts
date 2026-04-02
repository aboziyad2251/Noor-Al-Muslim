import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys — set these in Supabase secrets:
// supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT')     ?? 'mailto:admin@noor.zimura.digital';

const PRAYER_ARABIC: Record<string, string> = {
  fajr:    'الفجر',
  dhuhr:   'الظهر',
  asr:     'العصر',
  maghrib: 'المغرب',
  isha:    'العشاء',
};

const ADHAN_MESSAGES: Record<string, string> = {
  fajr:    'حان وقت صلاة الفجر — الصلاة خير من النوم',
  dhuhr:   'حان وقت صلاة الظهر',
  asr:     'حان وقت صلاة العصر',
  maghrib: 'حان وقت صلاة المغرب',
  isha:    'حان وقت صلاة العشاء',
};

// Minimal web-push signing using VAPID (no external library needed in Deno)
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<boolean> {
  try {
    // Build VAPID JWT header + claims
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const claims = btoa(JSON.stringify({
      aud: new URL(subscription.endpoint).origin,
      exp: now + 12 * 3600,
      sub: VAPID_SUBJECT,
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const signingInput = `${header}.${claims}`;

    // Import VAPID private key
    const privateKeyBytes = Uint8Array.from(atob(VAPID_PRIVATE_KEY), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${signingInput}.${sigBase64}`;
    const authHeader = `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`;

    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: payload,
    });

    return res.ok || res.status === 201;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prayer } = await req.json() as { prayer: string };

    if (!prayer || !PRAYER_ARABIC[prayer]) {
      return new Response(JSON.stringify({ error: 'invalid prayer' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all active push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('user_push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (error) throw error;

    const payload = JSON.stringify({
      title: `🕌 ${PRAYER_ARABIC[prayer]}`,
      body: ADHAN_MESSAGES[prayer],
      prayer,
    });

    // Send push to all subscribers
    const results = await Promise.allSettled(
      (subscriptions ?? []).map((sub) => sendWebPush(sub, payload))
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value).length;

    return new Response(
      JSON.stringify({ sent, total: subscriptions?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
