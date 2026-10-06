const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

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

    const { projectId, unitId, configurationId, metadata, ...rest } = data;
    const eventMetadata = {
      ...(metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {}),
      ...rest,
      ...(projectId !== undefined && !isUuid(projectId) ? { projectId } : {}),
      ...(unitId !== undefined && !isUuid(unitId) ? { unitId } : {}),
      ...(configurationId !== undefined ? { configurationId } : {}),
    };

    const body: Record<string, unknown> = {
      eventName,
      sessionId,
      metadata: eventMetadata,
    };

    if (isUuid(projectId)) body.projectId = projectId;
    if (isUuid(unitId)) body.unitId = unitId;

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Analytics must never block the buyer experience.
  }
}
