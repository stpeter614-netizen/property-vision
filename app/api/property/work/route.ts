import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TYPES = new Set(['renovation','repair','maintenance','upgrade','inspection','installation','other']);
const URGENCIES = new Set(['routine','normal','urgent','emergency']);
const MAX_BODY = 12000;

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
  const id = new URL(request.url).searchParams.get('id')?.trim() || '';
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: 'Invalid work order.' }, { status: 400 });
  const { data, error } = await client.from('property_work_orders').select('id,property_record_id,title,work_type,urgency,location,description,budget_cents,status,requested_at').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load the work order.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Work order not found.' }, { status: 404 });
  return NextResponse.json({ workOrder: data, connected: true });
}

export async function POST(request: Request) {
  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });

  let input: Record<string, unknown>;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    input = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const propertyRecordId = typeof input.propertyRecordId === 'string' ? input.propertyRecordId.trim() : '';
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const workType = typeof input.workType === 'string' ? input.workType.toLowerCase() : '';
  const urgency = typeof input.urgency === 'string' ? input.urgency.toLowerCase() : '';
  const location = typeof input.location === 'string' ? input.location.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const budgetCents = typeof input.budgetCents === 'number' && Number.isInteger(input.budgetCents) ? input.budgetCents : null;
  const items = Array.isArray(input.items) ? input.items : [];

  if (!/^[0-9a-fA-F-]{36}$/.test(propertyRecordId)) return NextResponse.json({ error: 'Invalid property record.' }, { status: 400 });
  if (!title || title.length > 160) return NextResponse.json({ error: 'Work title is required and must be 160 characters or fewer.' }, { status: 400 });
  if (!TYPES.has(workType)) return NextResponse.json({ error: 'Invalid work type.' }, { status: 400 });
  if (!URGENCIES.has(urgency)) return NextResponse.json({ error: 'Invalid urgency.' }, { status: 400 });
  if (location.length > 240 || description.length > 4000) return NextResponse.json({ error: 'Work details are too long.' }, { status: 400 });
  if (budgetCents !== null && (budgetCents < 0 || budgetCents > 9000000000000)) return NextResponse.json({ error: 'Invalid budget.' }, { status: 400 });
  if (items.length > 50) return NextResponse.json({ error: 'Too many scope items.' }, { status: 400 });

  const cleanItems = items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    const itemDescription = typeof row.description === 'string' ? row.description.trim() : '';
    return itemDescription && itemDescription.length <= 500 ? { description: itemDescription } : null;
  });
  if (cleanItems.some(item => item === null)) return NextResponse.json({ error: 'Invalid scope item.' }, { status: 400 });

  const { data: order, error: orderError } = await client.from('property_work_orders').insert({
    property_record_id: propertyRecordId,
    title,
    work_type: workType,
    urgency,
    location: location || null,
    description: description || null,
    budget_cents: budgetCents,
    status: 'requested',
    requested_at: new Date().toISOString()
  }).select('id,property_record_id,title,work_type,urgency,location,description,budget_cents,status,requested_at').single();

  if (orderError || !order) return NextResponse.json({ error: 'Unable to create the work request.' }, { status: 500 });

  if (cleanItems.length) {
    const { error: itemError } = await client.from('property_work_items').insert(
      cleanItems.map(item => ({ work_order_id: order.id, description: item!.description }))
    );
    if (itemError) {
      await client.from('property_work_orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Unable to save the work scope.' }, { status: 500 });
    }
  }

  return NextResponse.json({ workOrder: order, connected: true }, { status: 201 });
}
