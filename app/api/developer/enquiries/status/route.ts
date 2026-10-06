import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const allowed = new Set(['new','contacted','qualified','reserved','closed','lost']);

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
  const body = await request.json().catch(() => null) as { id?: string; status?: string } | null;
  if (!body?.id || !body.status || !allowed.has(body.status))
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
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ enquiry: data });
}
