import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const allowed = new Set(['new','contacted','qualified','reserved','closed','lost']);

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string; status?: string } | null;
  if (!body?.id || !body.status || !allowed.has(body.status)) {
    return NextResponse.json({ error: 'Valid enquiry id and status are required.' }, { status: 400 });
  }

  const client = db();
  if (!client) return NextResponse.json({ error: 'Property Vision database is not connected yet.' }, { status: 503 });

  const { data, error } = await client
    .from('property_enquiries')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('id,status,updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enquiry: data });
}
