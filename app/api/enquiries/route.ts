import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type EnquiryInput = {
  projectId?: unknown;
  unitId?: unknown;
  configurationId?: unknown;
  buyerName?: unknown;
  buyerContact?: unknown;
  message?: unknown;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalUuid(value: unknown) {
  if (value == null || value === '') return null;
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

function optionalText(value: unknown, max: number) {
  if (value == null || value === '') return null;
  return typeof value === 'string' && value.trim().length <= max ? value.trim() : undefined;
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const MAX_BODY_BYTES = 12000;

export async function POST(request: Request) {
  const rawBody = await request.arrayBuffer();
  if (rawBody.byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
  }
  const body = (() => {
    try { return JSON.parse(new TextDecoder().decode(rawBody)); } catch { return null; }
  })() as EnquiryInput | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const buyerName = optionalText(body.buyerName, 120);
  const buyerContact = optionalText(body.buyerContact, 200);
  const message = optionalText(body.message, 2000);
  const projectId = optionalUuid(body.projectId);
  const unitId = optionalUuid(body.unitId);
  const configurationId = optionalText(body.configurationId, 100);

  if (!buyerName || !buyerContact) {
    return NextResponse.json({ error: 'Name and phone or email are required.' }, { status: 400 });
  }
  if (buyerName === undefined || buyerContact === undefined || message === undefined ||
      projectId === undefined || unitId === undefined || configurationId === undefined) {
    return NextResponse.json({ error: 'One or more enquiry fields are invalid or too long.' }, { status: 400 });
  }

  const client = db();
  if (!client) {
    return NextResponse.json({ error: 'Property Vision database is not connected yet.' }, { status: 503 });
  }

  if (projectId) {
    const { data: project, error } = await client.from('property_projects').select('id').eq('id', projectId).maybeSingle();
    if (error) return NextResponse.json({ error: 'Unable to validate project.' }, { status: 500 });
    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 400 });
  }

  if (unitId) {
    const unitQuery = client.from('property_units').select('id,project_id').eq('id', unitId).maybeSingle();
    const { data: unit, error } = await unitQuery;
    if (error) return NextResponse.json({ error: 'Unable to validate unit.' }, { status: 500 });
    if (!unit) return NextResponse.json({ error: 'Unit not found.' }, { status: 400 });
    if (projectId && unit.project_id !== projectId) {
      return NextResponse.json({ error: 'Unit does not belong to the selected project.' }, { status: 400 });
    }
  }

  if (configurationId) {
    const { data: configuration, error } = await client.from('property_configurations')
      .select('id,unit_id').eq('id', configurationId).maybeSingle();
    if (error) return NextResponse.json({ error: 'Unable to validate configuration.' }, { status: 500 });
    if (!configuration) return NextResponse.json({ error: 'Configuration not found.' }, { status: 400 });
    if (unitId && configuration.unit_id !== unitId) {
      return NextResponse.json({ error: 'Configuration does not belong to the selected unit.' }, { status: 400 });
    }
    if (projectId && configuration.unit_id) {
      const { data: configurationUnit, error: configurationUnitError } = await client
        .from('property_units').select('id,project_id').eq('id', configuration.unit_id).maybeSingle();
      if (configurationUnitError) return NextResponse.json({ error: 'Unable to validate configuration project.' }, { status: 500 });
      if (!configurationUnit || configurationUnit.project_id !== projectId) {
        return NextResponse.json({ error: 'Configuration does not belong to the selected project.' }, { status: 400 });
      }
    }
  }

  const { data, error } = await client.from('property_enquiries').insert({
    project_id: projectId,
    unit_id: unitId,
    configuration_id: configurationId,
    buyer_name: buyerName,
    buyer_contact: buyerContact,
    message,
  }).select('id,status,created_at').single();

  if (error) return NextResponse.json({ error: 'Unable to create enquiry.' }, { status: 500 });
  return NextResponse.json({ enquiry: data }, { status: 201 });
}
