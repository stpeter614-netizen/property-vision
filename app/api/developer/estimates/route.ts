import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY = 16000;
const MAX_LINES = 100;

function db(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { global: { headers: { Authorization: request.headers.get('authorization') || '' } } });
}

async function auth(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const client = db(request);
  if (!client) return { error: NextResponse.json({ error: 'Database connection is not configured.' }, { status: 503 }) };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  return { client };
}

function cents(value: unknown, field: string) {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 9000000000000) throw new Error(field + ' must be a valid non-negative integer in cents.');
  return value as number;
}

export async function POST(request: NextRequest) {
  const checked = await auth(request);
  if ('error' in checked) return checked.error;
  const client = checked.client;
  let body: any;
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_BODY) return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  const workOrderId = typeof body?.workOrderId === 'string' ? body.workOrderId : '';
  if (!UUID.test(workOrderId)) return NextResponse.json({ error: 'A valid work order ID is required.' }, { status: 400 });
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length > MAX_LINES) return NextResponse.json({ error: 'Too many estimate lines.' }, { status: 400 });

  try {
    const normalized = lines.map((line: any) => {
      const description = typeof line?.description === 'string' ? line.description.trim() : '';
      const quantity = typeof line?.quantity === 'number' ? line.quantity : NaN;
      const unit = typeof line?.unit === 'string' ? line.unit.trim() : '';
      const unitPriceCents = cents(line?.unitPriceCents, 'unitPriceCents');
      const lineType = line?.lineType;
      if (!description || description.length > 500) throw new Error('Each estimate line needs a description of 1–500 characters.');
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1000000) throw new Error('Each estimate quantity must be greater than zero.');
      if (unit.length > 40) throw new Error('Estimate unit is too long.');
      if (!['material','labour','other'].includes(lineType)) throw new Error('Invalid estimate line type.');
      return { description, quantity, unit: unit || null, unit_price_cents: unitPriceCents, line_total_cents: Math.round(quantity * unitPriceCents), line_type: lineType };
    });
    const labourCents = cents(body?.labourCents ?? 0, 'labourCents');
    const otherCents = cents(body?.otherCents ?? 0, 'otherCents');
    const subtotalCents = normalized.reduce((sum: number, line: any) => sum + line.line_total_cents, 0);
    const totalCents = subtotalCents + labourCents + otherCents;

    const { data: estimate, error: estimateError } = await client.from('property_estimates')
      .insert({ work_order_id: workOrderId, currency: 'KES', subtotal_cents: subtotalCents, labour_cents: labourCents, other_cents: otherCents, total_cents: totalCents, status: 'sent' })
      .select('id,work_order_id,currency,subtotal_cents,labour_cents,other_cents,total_cents,status,created_at,updated_at').single();
    if (estimateError || !estimate) return NextResponse.json({ error: 'Unable to create estimate.' }, { status: 500 });

    if (normalized.length) {
      const { error: lineError } = await client.from('property_estimate_lines').insert(normalized.map((line: any) => ({ ...line, estimate_id: estimate.id })));
      if (lineError) {
        await client.from('property_estimates').delete().eq('id', estimate.id);
        return NextResponse.json({ error: 'Unable to save estimate lines.' }, { status: 500 });
      }
    }

    const { data: workOrder, error: statusError } = await client.from('property_work_orders')
      .update({ status: 'quoted', updated_at: new Date().toISOString() })
      .eq('id', workOrderId).eq('status', 'requested').select('id,status').maybeSingle();
    if (statusError || !workOrder) {
      await client.from('property_estimates').delete().eq('id', estimate.id);
      return NextResponse.json({ error: 'Unable to move the work order to quoted status.' }, { status: 409 });
    }

    return NextResponse.json({ estimate, connected: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid estimate.' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const checked = await auth(request);
  if ('error' in checked) return checked.error;
  const client = checked.client;
  const params = new URL(request.url).searchParams;
  const id = params.get('id') || '';
  const workOrderId = params.get('workOrderId') || '';
  if (id && !UUID.test(id)) return NextResponse.json({ error: 'Invalid estimate ID.' }, { status: 400 });
  if (workOrderId && !UUID.test(workOrderId)) return NextResponse.json({ error: 'Invalid work order ID.' }, { status: 400 });
  let query = client.from('property_estimates').select('id,work_order_id,currency,subtotal_cents,labour_cents,other_cents,total_cents,status,created_at,updated_at').order('created_at', { ascending: false });
  if (id) query = query.eq('id', id);
  if (workOrderId) query = query.eq('work_order_id', workOrderId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to load estimates.' }, { status: 500 });
  return NextResponse.json({ estimates: data || [], connected: true });
}