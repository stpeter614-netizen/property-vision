'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Render = {
  id: string;
  render_type: string;
  prompt?: string;
  status: string;
  image_url?: string | null;
  error_message?: string | null;
  approved_at?: string | null;
};

type Brief = {
  plot_dimensions: string | null;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  house_style: string | null;
  garage: string | null;
  kitchen_living_layout: string | null;
  roof_style: string | null;
  finishes: string | null;
  budget_cents: number | null;
};

const renderTypes = [
  ['exterior', 'Exterior'],
  ['interior', 'Interior'],
  ['floor_plan', 'Floor plan'],
  ['renovation_before_after', 'Renovation before / after'],
  ['materials', 'Materials & finishes']
] as const;

export default function PropertyDesignPage() {
  const [propertyRecordId, setPropertyRecordId] = useState('');
  const [brief, setBrief] = useState<Brief>({
    plot_dimensions: '',
    bedrooms: 3,
    bathrooms: 2,
    floors: 1,
    house_style: 'Modern',
    garage: '',
    kitchen_living_layout: '',
    roof_style: '',
    finishes: '',
    budget_cents: null
  });
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createClient(url, key) : null;
  }, []);

  async function authHeaders() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Please sign in first.');
    return { Authorization: 'Bearer ' + data.session.access_token };
  }

  async function load(id = propertyRecordId) {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      const response = await fetch('/api/property/design?propertyRecordId=' + encodeURIComponent(id), { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load design.');
      if (data.brief) setBrief({
        plot_dimensions: data.brief.plot_dimensions ?? '',
        bedrooms: data.brief.bedrooms,
        bathrooms: data.brief.bathrooms,
        floors: data.brief.floors,
        house_style: data.brief.house_style ?? 'Modern',
        garage: data.brief.garage ?? '',
        kitchen_living_layout: data.brief.kitchen_living_layout ?? '',
        roof_style: data.brief.roof_style ?? '',
        finishes: data.brief.finishes ?? '',
        budget_cents: data.brief.budget_cents ?? null
      });
      setRenders(data.renders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load design.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('propertyRecordId') || '';
    setPropertyRecordId(id);
    if (id) void load(id);
    else setLoading(false);
  }, []);

  async function post(body: Record<string, unknown>) {
    const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
    const response = await fetch('/api/property/design', { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  async function saveBrief() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await post({
        propertyRecordId,
        action: 'save_brief',
        plotDimensions: brief.plot_dimensions,
        bedrooms: brief.bedrooms,
        bathrooms: brief.bathrooms,
        floors: brief.floors,
        houseStyle: brief.house_style,
        garage: brief.garage,
        kitchenLivingLayout: brief.kitchen_living_layout,
        roofStyle: brief.roof_style,
        finishes: brief.finishes,
        budgetCents: brief.budget_cents
      });
      setMessage('Design brief saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save design brief.');
    } finally {
      setSaving(false);
    }
  }

  async function requestRender(type: string) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await post({ propertyRecordId, action: 'request_render', renderType: type });
      setRenders(current => [data.render, ...current]);
      setMessage('Render requested. Generate it when the render engine is configured.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request render.');
    } finally {
      setSaving(false);
    }
  }

  async function generateRender(renderId: string) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await post({ propertyRecordId, action: 'generate_render', renderId });
      setRenders(current => current.map(r => r.id === renderId ? data.render : r));
      setMessage('Render generated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Render generation failed.');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function review(renderId: string, decision: 'approved' | 'rejected') {
    setSaving(true);
    setError('');
    try {
      const data = await post({ propertyRecordId, action: 'review_render', renderId, decision });
      setRenders(current => current.map(r => r.id === renderId ? data.render : r));
      setMessage(decision === 'approved' ? 'Render approved.' : 'Render rejected.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to review render.');
    } finally {
      setSaving(false);
    }
  }

  async function createWorkOrder(renderId: string) {
    setSaving(true);
    setError('');
    try {
      const data = await post({ propertyRecordId, action: 'create_work_order_from_render', renderId });
      window.location.href = '/property/execution?workOrderId=' + encodeURIComponent(data.workOrder.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create project.');
      setSaving(false);
    }
  }

  if (!propertyRecordId && !loading) {
    return (
      <main style={{maxWidth: 900, margin: '0 auto', padding: 24}}>
        <h1>Property Vision Design Studio</h1>
        <p>Open this page from a property so the design brief and renders stay connected to that property.</p>
      </main>
    );
  }

  return (
    <main style={{maxWidth: 1100, margin: '0 auto', padding: 24}}>
      <header style={{marginBottom: 24}}>
        <p style={{margin: 0, fontWeight: 700}}>PROPERTY VISION</p>
        <h1 style={{margin: '6px 0'}}>Design & Renders</h1>
        <p style={{margin: 0}}>Define the property, request visual designs, review the result, then turn an approved design into real project work.</p>
      </header>

      {error && <div role="alert" style={{padding: 12, border: '1px solid #c33', marginBottom: 16}}>{error}</div>}
      {message && <div role="status" style={{padding: 12, border: '1px solid #397', marginBottom: 16}}>{message}</div>}

      <section style={{border: '1px solid #ddd', borderRadius: 12, padding: 20, marginBottom: 20}}>
        <h2>Design brief</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14}}>
          <label>Plot dimensions<input value={brief.plot_dimensions ?? ''} onChange={e=>setBrief({...brief,plot_dimensions:e.target.value})} /></label>
          <label>Bedrooms<input type="number" min={1} max={20} value={brief.bedrooms} onChange={e=>setBrief({...brief,bedrooms:Number(e.target.value)})} /></label>
          <label>Bathrooms<input type="number" min={1} max={20} value={brief.bathrooms} onChange={e=>setBrief({...brief,bathrooms:Number(e.target.value)})} /></label>
          <label>Floors<input type="number" min={1} max={20} value={brief.floors} onChange={e=>setBrief({...brief,floors:Number(e.target.value)})} /></label>
          <label>House style<input value={brief.house_style ?? ''} onChange={e=>setBrief({...brief,house_style:e.target.value})} /></label>
          <label>Garage / carport<input value={brief.garage ?? ''} onChange={e=>setBrief({...brief,garage:e.target.value})} /></label>
          <label>Kitchen / living arrangement<input value={brief.kitchen_living_layout ?? ''} onChange={e=>setBrief({...brief,kitchen_living_layout:e.target.value})} /></label>
          <label>Roof style<input value={brief.roof_style ?? ''} onChange={e=>setBrief({...brief,roof_style:e.target.value})} /></label>
          <label>Finishes<input value={brief.finishes ?? ''} onChange={e=>setBrief({...brief,finishes:e.target.value})} /></label>
          <label>Budget (KES)<input type="number" min={0} value={brief.budget_cents == null ? '' : brief.budget_cents / 100} onChange={e=>setBrief({...brief,budget_cents:e.target.value === '' ? null : Math.round(Number(e.target.value)*100)})} /></label>
        </div>
        <button disabled={saving || loading} onClick={saveBrief} style={{marginTop:16}}>Save design brief</button>
      </section>

      <section style={{border: '1px solid #ddd', borderRadius: 12, padding: 20, marginBottom: 20}}>
        <h2>Request a render</h2>
        <div style={{display:'flex', flexWrap:'wrap', gap:10}}>
          {renderTypes.map(([value,label]) => <button key={value} disabled={saving || loading} onClick={()=>requestRender(value)}>{label}</button>)}
        </div>
      </section>

      <section>
        <h2>Render history</h2>
        {loading ? <p>Loading…</p> : renders.length === 0 ? <p>No renders requested yet.</p> : (
          <div style={{display:'grid', gap:18}}>
            {renders.map(render => (
              <article key={render.id} style={{border:'1px solid #ddd',borderRadius:12,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div><strong>{render.render_type.replaceAll('_',' ')}</strong><div>Status: {render.status}</div></div>
                  {render.status === 'requested' && <button disabled={saving} onClick={()=>generateRender(render.id)}>Generate render</button>}
                </div>
                {render.image_url && <img src={render.image_url} alt={render.render_type.replaceAll('_',' ') + ' property render'} style={{width:'100%',marginTop:14,borderRadius:8}} />}
                {render.error_message && <p role="alert">{render.error_message}</p>}
                {(render.status === 'ready' || render.status === 'approved' || render.status === 'rejected') && (
                  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
                    {render.status !== 'approved' && <button disabled={saving} onClick={()=>review(render.id,'approved')}>Approve render</button>}
                    {render.status !== 'rejected' && <button disabled={saving} onClick={()=>review(render.id,'rejected')}>Reject render</button>}
                    {render.status === 'approved' && <button disabled={saving} onClick={()=>createWorkOrder(render.id)}>Create project from approved design</button>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
