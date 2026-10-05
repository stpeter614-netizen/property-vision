import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type EnquiryInput = {
  projectId?: string;
  unitId?: string;
  configurationId?: string;
  buyerName?: string;
  buyerContact?: string;
  message?: string;
};

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as EnquiryInput | null;
  const buyerName = body?.buyerName?.trim();
  const buyerContact = body?.buyerContact?.trim();

  if (!buyerName || !buyerContact) {
    return NextResponse.json({ error: 'Name and phone or email are required.' }, { status: 400 });
  }

  const client = db();
  if (!client) {
    return NextResponse.json({ error: 'Property Vision database is not connected yet.' }, { status: 503 });
  }

  const { data, error } = await client.from('property_enquiries').insert({
    project_id: body?.projectId || null,
    unit_id: body?.unitId || null,
    configuration_id: body?.configurationId || null,
    buyer_name: buyerName,
    buyer_contact: buyerContact,
    message: body?.message?.trim() || null,
  }).select('id,status,created_at').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enquiry: data }, { status: 201 });
}
