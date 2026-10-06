import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const body = await request.json().catch(() => null);
  if (!body?.action || !body?.id) {
    return NextResponse.json({ error: 'action and id are required' }, { status: 400 });
  }

  if (!['work_order_status', 'assignment_status'].includes(body.action)) {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  const client = dbFromRequest(request);
  if (!client) {
    return NextResponse.json(
      { connected: false, error: 'Authentication and Property Vision database configuration are required.' },
      { status: 401 }
    );
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const rpc = body.action === 'work_order_status'
    ? 'property_set_work_order_status'
    : 'property_set_assignment_status';

  const parameter = body.action === 'work_order_status'
    ? { p_work_order_id: body.id, p_status: body.status }
    : { p_assignment_id: body.id, p_status: body.status };

  const { data, error } = await client.rpc(rpc, parameter);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ connected: true, data });
}
