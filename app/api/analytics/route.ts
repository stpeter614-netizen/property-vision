import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalUuid(value: unknown) {
  return value == null || value === '' || (typeof value === 'string' && UUID_RE.test(value)) ? (value || null) : undefined;
}

const MAX_BODY_BYTES = 12000;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
  if (!eventName || eventName.length > 100) {
    return NextResponse.json({ error: 'eventName is required and must be 100 characters or fewer.' }, { status: 400 });
  }

  const projectId = optionalUuid(body.projectId);
  const unitId = optionalUuid(body.unitId);
  if (projectId === undefined || unitId === undefined) {
    return NextResponse.json({ error: 'projectId and unitId must be valid UUIDs.' }, { status: 400 });
  }

  const configurationId = body.configurationId == null || body.configurationId === ''
    ? null
    : typeof body.configurationId === 'string' && body.configurationId.length <= 100
      ? body.configurationId
      : undefined;
  if (configurationId === undefined) {
    return NextResponse.json({ error: 'configurationId must be a string of 100 characters or fewer.' }, { status: 400 });
  }

  const sessionId = body.sessionId == null || body.sessionId === ''
    ? null
    : typeof body.sessionId === 'string' && body.sessionId.length <= 200
      ? body.sessionId
      : undefined;
  if (sessionId === undefined) {
    return NextResponse.json({ error: 'sessionId must be a string of 200 characters or fewer.' }, { status: 400 });
  }

  const metadata = body.metadata == null ? {} : body.metadata;
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return NextResponse.json({ error: 'metadata must be a JSON object.' }, { status: 400 });
  }
  let metadataSize = 0;
  try { metadataSize = JSON.stringify(metadata).length; } catch { return NextResponse.json({ error: 'metadata is not valid JSON.' }, { status: 400 }); }
  if (metadataSize > 10000) {
    return NextResponse.json({ error: 'metadata is too large.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ recorded: false, connected: false });

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.from('property_analytics_events').insert({
    event_name: eventName,
    project_id: projectId,
    unit_id: unitId,
    configuration_id: configurationId,
    session_id: sessionId,
    metadata
  });

  if (error) {
    console.error('Analytics insert failed:', error.message);
    return NextResponse.json({ error: 'Unable to record analytics event.' }, { status: 500 });
  }
  return NextResponse.json({ recorded: true, connected: true });
}
