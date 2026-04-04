import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FREE_DAILY_LIMIT = 10;   // Logged-in free users
const ANON_DAILY_LIMIT = 3;    // Anonymous / unauthenticated requests

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  identifier: string;
}

/**
 * Atomically increments the caller's daily AI usage counter and returns
 * whether the request is within the allowed limit.
 *
 * Identification priority:
 *   1. Authenticated user → user:<uuid>   (limit: FREE_DAILY_LIMIT)
 *   2. Anonymous by IP   → ip:<address>   (limit: ANON_DAILY_LIMIT)
 */
export async function checkRateLimit(req: Request): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;

  const sb = createClient(supabaseUrl, serviceKey);
  const today = new Date().toISOString().split('T')[0];

  // Resolve identifier
  let identifier: string;
  let limit: number;

  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user?.id) {
        identifier = `user:${user.id}`;
        limit = FREE_DAILY_LIMIT;
      } else {
        throw new Error('no user');
      }
    } catch {
      identifier = `ip:${req.headers.get('x-forwarded-for') ?? 'unknown'}`;
      limit = ANON_DAILY_LIMIT;
    }
  } else {
    identifier = `ip:${req.headers.get('x-forwarded-for') ?? 'unknown'}`;
    limit = ANON_DAILY_LIMIT;
  }

  // Atomic increment via Postgres RPC
  const { data, error } = await sb.rpc('increment_ai_rate_limit', {
    p_identifier: identifier,
    p_date: today,
  });

  if (error) {
    // If rate limit DB is unavailable, fail open (allow the request)
    console.error('Rate limit check failed:', error.message);
    return { allowed: true, remaining: limit, identifier };
  }

  const newCount: number = data ?? 1;
  const allowed = newCount <= limit;
  const remaining = Math.max(0, limit - newCount);

  return { allowed, remaining, identifier };
}

export function rateLimitExceededResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: 'لقد تجاوزت الحد اليومي للاستخدام المجاني. يرجى الترقية إلى نور بريميوم للاستخدام غير المحدود.',
      code: 'RATE_LIMIT_EXCEEDED',
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '86400',
      },
    }
  );
}
