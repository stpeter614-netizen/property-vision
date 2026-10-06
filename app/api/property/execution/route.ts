import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action || !body?.id) {
    return NextResponse.json({ error: 'action and id are required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ connected: false, error: 'Property Vision database is not configured' }, { status: 503 });
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  if (body.action === 'work_order_status') {
    const { data, error } = await client.rpc('property_set_work_order_status', {
      p_work_order_id: body.id,
      p_status: body.status
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ connected: true, data });
  }

  if (body.action === 'assignment_status') {
    const { data, error } = await client.rpc('property_set_assignment_status', {
      p_assignment_id: body.id,
      p_status: body.status
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ connected: true, data });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
