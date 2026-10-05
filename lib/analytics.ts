export async function trackPropertyEvent(
  eventName: string,
  data: Record<string, unknown> = {},
) {
  try {
    if (typeof window === 'undefined') return;
    const key = 'property-vision-session';
    const existing = localStorage.getItem(key);
    const sessionId = existing || crypto.randomUUID();
    if (!existing) localStorage.setItem(key, sessionId);
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, sessionId, ...data }),
    });
  } catch {
    // Analytics must never block the buyer experience.
  }
}
