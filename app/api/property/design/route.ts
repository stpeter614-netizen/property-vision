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

const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value.trim());

export const maxDuration = 60;

export async function GET(request: Request) {
  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const propertyRecordId = new URL(request.url).searchParams.get('propertyRecordId') || '';
  if (!uuid(propertyRecordId)) return NextResponse.json({ error: 'Invalid property record.' }, { status: 400 });

  const { data: brief, error: briefError } = await client.from('property_design_briefs')
    .select('*').eq('property_record_id', propertyRecordId).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (briefError) return NextResponse.json({ error: 'Unable to load the design brief.' }, { status: 500 });

  const { data: renders, error: renderError } = await client.from('property_render_requests')
    .select('id,render_type,prompt,status,image_url,image_path,error_message,created_at,updated_at')
    .eq('property_record_id', propertyRecordId).order('created_at', { ascending: false }).limit(20);
  if (renderError) return NextResponse.json({ error: 'Unable to load render requests.' }, { status: 500 });
  return NextResponse.json({ brief, renders: renders || [] });
}

export async function POST(request: Request) {
  const client = dbFromRequest(request);
  if (!client) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || Array.isArray(input)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const propertyRecordId = typeof input.propertyRecordId === 'string' ? input.propertyRecordId.trim() : '';
  if (!uuid(propertyRecordId)) return NextResponse.json({ error: 'Invalid property record.' }, { status: 400 });

  const action = input.action;
  if (action === 'save_brief') {
    const integer = (v: unknown, min: number, max: number) => Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
    if (!integer(input.bedrooms,1,20) || !integer(input.bathrooms,1,20) || !integer(input.floors,1,20)) {
      return NextResponse.json({ error: 'Invalid room or floor configuration.' }, { status: 400 });
    }
    const budgetCents = input.budgetCents == null ? null : Number(input.budgetCents);
    if (budgetCents !== null && (!Number.isInteger(budgetCents) || budgetCents < 0 || budgetCents > 9000000000000)) {
      return NextResponse.json({ error: 'Invalid budget.' }, { status: 400 });
    }

    const { data: existing } = await client.from('property_design_briefs').select('id')
      .eq('property_record_id', propertyRecordId).order('updated_at', { ascending: false }).limit(1).maybeSingle();

    const values = {
      property_record_id: propertyRecordId,
      owner_user_id: userData.user.id,
      plot_dimensions: typeof input.plotDimensions === 'string' ? input.plotDimensions.trim().slice(0,160) : null,
      bedrooms: Number(input.bedrooms),
      bathrooms: Number(input.bathrooms),
      floors: Number(input.floors),
      house_style: typeof input.houseStyle === 'string' ? input.houseStyle.trim().slice(0,80) : 'Modern',
      garage: typeof input.garage === 'string' ? input.garage.trim().slice(0,80) : null,
      kitchen_living_layout: typeof input.kitchenLivingLayout === 'string' ? input.kitchenLivingLayout.trim().slice(0,120) : null,
      roof_style: typeof input.roofStyle === 'string' ? input.roofStyle.trim().slice(0,80) : null,
      finishes: typeof input.finishes === 'string' ? input.finishes.trim().slice(0,80) : null,
      budget_cents: budgetCents,
      updated_at: new Date().toISOString()
    };

    const query = existing?.id
      ? client.from('property_design_briefs').update(values).eq('id', existing.id)
      : client.from('property_design_briefs').insert(values);
    const { data: brief, error } = await query.select('*').single();
    if (error || !brief) return NextResponse.json({ error: 'Unable to save the design brief.' }, { status: 500 });
    return NextResponse.json({ brief });
  }

  if (action === 'generate_render') {
    const renderId = typeof input.renderId === 'string' ? input.renderId.trim() : '';
    if (!uuid(renderId)) return NextResponse.json({ error: 'Invalid render request.' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Render engine is not configured.' }, { status: 503 });

    const { data: render, error: renderError } = await client.from('property_render_requests')
      .select('id,property_record_id,owner_user_id,render_type,prompt,status')
      .eq('id', renderId).eq('property_record_id', propertyRecordId).maybeSingle();
    if (renderError || !render) return NextResponse.json({ error: 'Render request not found.' }, { status: 404 });
    if (render.status === 'ready' && render.image_path) return NextResponse.json({ render });

    await client.from('property_render_requests').update({ status: 'processing', error_message: null, updated_at: new Date().toISOString() }).eq('id', render.id);

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
        body: JSON.stringify({
          model: 'gpt-5.6-luna',
          input: render.prompt,
          tools: [{ type: 'image_generation', model: 'gpt-image-2', size: '1536x1024', quality: 'high', output_format: 'png' }]
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || 'Image generation failed.');
      const imageCall = Array.isArray(payload?.output) ? payload.output.find((item: any) => item?.type === 'image_generation_call' && item?.result) : null;
      if (!imageCall?.result) throw new Error('Render engine returned no image.');

      const bytes = Buffer.from(imageCall.result, 'base64');
      const path = userData.user.id + '/' + render.property_record_id + '/' + render.id + '.png';
      const upload = await client.storage.from('property-renders').upload(path, bytes, { contentType: 'image/png', upsert: true });
      if (upload.error) throw new Error('Unable to store generated render.');

      const { data: saved, error: saveError } = await client.from('property_render_requests')
        .update({ status: 'ready', image_path: path, updated_at: new Date().toISOString() })
        .eq('id', render.id).select('id,render_type,prompt,status,image_path,created_at,updated_at').single();
      if (saveError || !saved) throw new Error('Unable to save generated render.');
      const { data: signed } = await client.storage.from('property-renders').createSignedUrl(path, 60 * 60);
      return NextResponse.json({ render: { ...saved, image_url: signed?.signedUrl || null } });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : 'Render generation failed.';
      await client.from('property_render_requests').update({ status: 'failed', error_message: message, updated_at: new Date().toISOString() }).eq('id', render.id);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (action === 'request_render') {
    const types = new Set(['exterior','interior','floor_plan','renovation_before_after','materials']);
    if (typeof input.renderType !== 'string' || !types.has(input.renderType)) return NextResponse.json({ error: 'Invalid render type.' }, { status: 400 });
    const { data: brief } = await client.from('property_design_briefs').select('id,plot_dimensions,bedrooms,bathrooms,floors,house_style,garage,kitchen_living_layout,roof_style,finishes,budget_cents')
      .eq('property_record_id', propertyRecordId).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if (!brief) return NextResponse.json({ error: 'Save the design brief before requesting a render.' }, { status: 409 });

    const prompt = [
      `Property render type: ${input.renderType}.`,
      `Plot: ${brief.plot_dimensions || 'not specified'}.`,
      `${brief.bedrooms} bedrooms, ${brief.bathrooms} bathrooms, ${brief.floors} floor(s).`,
      `Style: ${brief.house_style}; roof: ${brief.roof_style || 'not specified'}; garage: ${brief.garage || 'not specified'}.`,
      `Kitchen/living: ${brief.kitchen_living_layout || 'not specified'}; finishes: ${brief.finishes || 'not specified'}.`
    ].join(' ');

    const { data: render, error } = await client.from('property_render_requests').insert({
      property_record_id: propertyRecordId,
      design_brief_id: brief.id,
      owner_user_id: userData.user.id,
      render_type: input.renderType,
      prompt,
      status: 'requested'
    }).select('id,render_type,prompt,status,created_at').single();
    if (error || !render) return NextResponse.json({ error: 'Unable to create the render request.' }, { status: 500 });
    return NextResponse.json({ render }, { status: 201 });
  }

  return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
}
