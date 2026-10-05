import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.eventName || typeof body.eventName !== 'string') return NextResponse.json({ error: 'eventName is required' }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ recorded: false, connected: false });
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.from('property_analytics_events').insert({
    event_name: body.eventName,
    project_id: body.projectId || null,
    unit_id: body.unitId || null,
    configuration_id: body.configurationId || null,
    session_id: body.sessionId || null,
    metadata: body.metadata || {}
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recorded: true, connected: true });
}