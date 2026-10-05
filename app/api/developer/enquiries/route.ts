import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function GET() {
  const client = db();
  if (!client) return NextResponse.json({ enquiries: [], connected: false });

  const { data, error } = await client
    .from('property_enquiries')
    .select('id,project_id,unit_id,configuration_id,buyer_name,buyer_contact,message,status,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enquiries: data ?? [], connected: true });
}
