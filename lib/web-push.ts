import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Register the service worker and subscribe to Web Push.
 * Saves the subscription endpoint to Supabase for server-side push delivery.
 * Safe to call multiple times — skips if already subscribed.
 */
export async function registerWebPush(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!VAPID_PUBLIC_KEY) return;

  try {
    // Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Check existing subscription
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const endpoint = sub.endpoint;
    const keys = sub.toJSON().keys ?? {};

    await supabase.from('user_push_subscriptions').upsert(
      {
        user_id: user?.id ?? null,
        endpoint,
        p256dh: keys.p256dh ?? '',
        auth: keys.auth ?? '',
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
  } catch {
    // Non-fatal — app works without push
  }
}

/**
 * Unsubscribe from Web Push and remove from Supabase.
 */
export async function unregisterWebPush(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await supabase.from('user_push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  } catch {}
}
