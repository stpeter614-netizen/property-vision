import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_PAGE_SIZE = 100;

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

export async function GET(request: Request) {
  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const url = new URL(request.url);
  const requestedId = url.searchParams.get('id');
  if (requestedId && !/^[0-9a-fA-F-]{36}$/.test(requestedId)) {
    return NextResponse.json({ error: 'Invalid enquiry ID.' }, { status: 400 });
  }
  const rawPage = Number(url.searchParams.get('page') ?? '1');
  const rawPageSize = Number(url.searchParams.get('pageSize') ?? '50');
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const pageSize = Number.isInteger(rawPageSize) && rawPageSize >= 1 && rawPageSize <= MAX_PAGE_SIZE
    ? rawPageSize
    : 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  let query = client.from('property_enquiries')
    .select('id,project_id,unit_id,configuration_id,buyer_name,buyer_contact,message,status,created_at,updated_at');

  if (requestedId) {
    query = query.eq('id', requestedId);
  } else {
    query = query.order('created_at', { ascending: false }).range(from, to);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: 'Unable to load enquiries.' }, { status: 500 });

  const rows = data ?? [];
  const hasMore = requestedId ? false : rows.length > pageSize;
  if (hasMore) rows.pop();

  return NextResponse.json({
    enquiries: rows,
    connected: true,
    page,
    pageSize,
    hasMore
  });
}
