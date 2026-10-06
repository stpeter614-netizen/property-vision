import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: Request) {
  const rawBody = await request.arrayBuffer();
  if (rawBody.byteLength > MAX_BODY_BYTES)
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });

  const body = (() => {
    try { return JSON.parse(new TextDecoder().decode(rawBody)); } catch { return null; }
  })() as { action?: unknown; id?: unknown; status?: unknown } | null;

  if (!body || typeof body !== 'object' || typeof body.action !== 'string' ||
      !['work_order_status', 'assignment_status'].includes(body.action) ||
      typeof body.id !== 'string' || !UUID_RE.test(body.id) ||
      typeof body.status !== 'string' || body.status.length > 50) {
    return NextResponse.json({ error: 'Valid action, id and status are required.' }, { status: 400 });
  }

  const client = dbFromRequest(request);
  if (!client) return NextResponse.json(
    { connected: false, error: 'Authentication and Property Vision database configuration are required.' },
    { status: 401 }
  );

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const rpc = body.action === 'work_order_status'
    ? 'property_set_work_order_status'
    : 'property_set_assignment_status';

  const parameter = body.action === 'work_order_status'
    ? { p_work_order_id: body.id, p_status: body.status }
    : { p_assignment_id: body.id, p_status: body.status };

  const { data, error } = await client.rpc(rpc, parameter);
  if (error) return NextResponse.json({ error: 'Unable to update execution status.' }, { status: 400 });
  return NextResponse.json({ connected: true, data });
}
