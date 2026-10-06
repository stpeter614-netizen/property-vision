import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PAGE_SIZE = 100;

function clientFromRequest(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('Authorization', authorization);
  return createClient(url, key, { global: { headers } });
}

export async function GET(request: NextRequest) {
  const client = clientFromRequest(request);
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { data: userData, error: authError } = await client.auth.getUser();
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id && !UUID.test(id)) {
    return NextResponse.json({ error: 'Invalid work order id.' }, { status: 400 });
  }

  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const requestedSize = Number.parseInt(searchParams.get('pageSize') ?? '50', 10) || 50;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));

  let query = client
    .from('property_work_orders')
    .select('id,property_record_id,title,work_type,urgency,status,budget_cents,requested_at,scheduled_at,completed_at,created_at,updated_at,property_records!inner(name,developer_id)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (id) {
    query = query.eq('id', id);
  } else {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: 'Unable to load work orders.' }, { status: 500 });
  }

  if (id) {
    if (!data?.length) return NextResponse.json({ error: 'Work order not found.' }, { status: 404 });
    return NextResponse.json({ workOrder: data[0], connected: true });
  }

  return NextResponse.json({
    workOrders: data ?? [],
    connected: true,
    page,
    pageSize,
    hasMore: (count ?? 0) > page * pageSize,
  });
}
