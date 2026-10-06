import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const allowed = new Set(['new','contacted','qualified','reserved','closed','lost']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 2000;

function dbFromRequest(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get('authorization');
  if (!url || !anonKey || !authorization?.startsWith('Bearer ')) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } }
  });
}

export async function PATCH(request: Request) {
  const rawBody = await request.arrayBuffer();
  if (rawBody.byteLength > MAX_BODY_BYTES)
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });

  const body = (() => {
    try { return JSON.parse(new TextDecoder().decode(rawBody)); } catch { return null; }
  })() as { id?: unknown; status?: unknown } | null;

  if (!body || typeof body !== 'object' || typeof body.id !== 'string' || !UUID_RE.test(body.id) ||
      typeof body.status !== 'string' || !allowed.has(body.status))
    return NextResponse.json({ error: 'Valid enquiry id and status are required.' }, { status: 400 });

  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data, error } = await client.from('property_enquiries')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('id,status,updated_at')
    .single();
  if (error) return NextResponse.json({ error: 'Unable to update enquiry.' }, { status: 403 });
  return NextResponse.json({ enquiry: data });
}
