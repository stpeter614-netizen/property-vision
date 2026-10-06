import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TYPES = new Set(['house','apartment','villa','bungalow','townhouse','commercial','office','retail','industrial','land','other']);
const STAGES = new Set(['design','planning','construction','sale','rent','purchase','configuration','renovation','repair','maintenance','upgrade','handover','resale']);

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
  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const input = body as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const type = typeof input.type === 'string' ? input.type.toLowerCase() : '';
  const stage = typeof input.stage === 'string' ? input.stage.toLowerCase() : '';
  if (!name || name.length > 120) return NextResponse.json({ error: 'Property name is required and must be 120 characters or fewer.' }, { status: 400 });
  if (!TYPES.has(type)) return NextResponse.json({ error: 'Invalid property type.' }, { status: 400 });
  if (!STAGES.has(stage)) return NextResponse.json({ error: 'Invalid lifecycle stage.' }, { status: 400 });

  const { data, error } = await client.from('property_records').insert({
    owner_user_id: userData.user.id,
    developer_id: null,
    name,
    property_type: type,
    lifecycle_stage: stage,
    status: 'active'
  }).select('id,name,property_type,lifecycle_stage,status').single();

  if (error) return NextResponse.json({ error: 'Unable to save the property.' }, { status: 500 });
  return NextResponse.json({ property: data, connected: true }, { status: 201 });
}
