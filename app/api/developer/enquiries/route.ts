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

export async function GET(request: Request) {
  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data, error } = await client.from('property_enquiries')
    .select('id,project_id,unit_id,configuration_id,buyer_name,buyer_contact,message,status,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enquiries: data ?? [], connected: true });
}
