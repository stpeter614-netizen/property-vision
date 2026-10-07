'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const styles = ['Modern','Contemporary','Traditional','Minimalist','Bungalow','Villa','Farmhouse'];
const roofs = ['Flat','Gable','Hip','Pitched','Mixed'];
const finishes = ['Standard','Premium','Luxury'];

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
}

export default function HouseDesignPage() {
  const [plot, setPlot] = useState('50 × 100 ft');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [floors, setFloors] = useState(1);
  const [style, setStyle] = useState('Modern');
  const [garage, setGarage] = useState('2-car garage');
  const [layout, setLayout] = useState('Open kitchen + living');
  const [roof, setRoof] = useState('Hip');
  const [finish, setFinish] = useState('Premium');
  const [budget, setBudget] = useState('KES 15,000,000');
  const [propertyRecordId, setPropertyRecordId] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [renderType, setRenderType] = useState('exterior');
  const [renders, setRenders] = useState<Array<{id:string;render_type:string;status:string;image_url?:string|null;approved_at?:string|null}>>([]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('propertyRecordId') || '';
    setPropertyRecordId(id);
    if (!id) return;
    (async () => {
      const client = authClient();
      const session = (await client?.auth.getSession())?.data.session;
      if (!session) return;
      const res = await fetch('/api/property/design?propertyRecordId=' + encodeURIComponent(id), { headers: { Authorization: 'Bearer ' + session.access_token } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.brief) {
        const b = data.brief;
        setPlot(b.plot_dimensions || '50 × 100 ft'); setBedrooms(b.bedrooms); setBathrooms(b.bathrooms); setFloors(b.floors);
        setStyle(b.house_style || 'Modern'); setGarage(b.garage || '2-car garage'); setLayout(b.kitchen_living_layout || 'Open kitchen + living');
        setRoof(b.roof_style || 'Hip'); setFinish(b.finishes || 'Premium');
        if (b.budget_cents != null) setBudget('KES ' + (Number(b.budget_cents) / 100).toLocaleString());
      }
      if (res.ok) setRenders(data.renders || []);
    })();
  }, []);

  async function saveBrief() {
    setMessage(''); setSaving(true);
    try {
      const client = authClient(); const session = (await client?.auth.getSession())?.data.session;
      if (!session) throw new Error('Sign in to save the design.');
      const numeric = budget.replace(/[^0-9.]/g,'');
      const budgetCents = numeric ? Math.round(Number(numeric) * 100) : null;
      const res = await fetch('/api/property/design', {
        method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + session.access_token},
        body:JSON.stringify({action:'save_brief',propertyRecordId,plotDimensions:plot,bedrooms,bathrooms,floors,houseStyle:style,garage,kitchenLivingLayout:layout,roofStyle:roof,finishes:finish,budgetCents})
      });
      const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error || 'Unable to save design.');
      setMessage('Design brief saved.');
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Unable to save design.'); } finally { setSaving(false); }
  }

  async function generateRender(id:string) {
    setMessage('Generating render…');
    setSaving(true);
    try {
      const client=authClient(); const session=(await client?.auth.getSession())?.data.session;
      if(!session) throw new Error('Sign in to generate a render.');
      const res=await fetch('/api/property/design',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'generate_render',propertyRecordId,renderId:id})});
      const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error || 'Render generation failed.');
      setRenders(current=>current.map(x=>x.id===id?data.render:x)); setMessage('Render generated.');
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Render generation failed.'); } finally { setSaving(false); }
  }

  async function reviewRender(id:string, decision:'approved'|'rejected') {
    setMessage('');
    setSaving(true);
    try {
      const client=authClient(); const session=(await client?.auth.getSession())?.data.session;
      if(!session) throw new Error('Sign in to review the render.');
      const res=await fetch('/api/property/design',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'review_render',propertyRecordId,renderId:id,decision})});
      const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error || 'Unable to review render.');
      setRenders(current=>current.map(x=>x.id===id?{...x,...data.render}:x));
      setMessage(decision==='approved' ? 'Render approved. It can now be used as the design reference for the project.' : 'Render rejected. You can request another render.');
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Unable to review render.'); } finally { setSaving(false); }
  }

  async function requestRender() {
    setMessage(''); setSaving(true);
    try {
      const client=authClient(); const session=(await client?.auth.getSession())?.data.session;
      if(!session) throw new Error('Sign in to request a render.');
      if(!propertyRecordId) throw new Error('Start with a saved property before requesting a render.');
      const res=await fetch('/api/property/design',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'request_render',propertyRecordId,renderType})});
      const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error || 'Unable to request render.');
      setRenders(current=>[data.render,...current]); setMessage('Render request created. Rendering can now be processed by the render engine.');
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Unable to request render.'); } finally { setSaving(false); }
  }

  const summary = useMemo(() => ({ plot, bedrooms, bathrooms, floors, style, garage, layout, roof, finish, budget }), [plot, bedrooms, bathrooms, floors, style, garage, layout, roof, finish, budget]);

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>House design</span></nav>
      <section className="hero">
        <div>
          <p className="eyebrow">DESIGN · CONFIGURE · PRICE</p>
          <h1>Design your house before you build it.</h1>
          <p className="lead">Start with the plot, rooms, style and budget. Property Vision turns the choices into one structured house design configuration.</p>
        </div>
      </section>

      <section className="grid">
        <label className="card">Plot dimensions<input value={plot} onChange={e=>setPlot(e.target.value)} placeholder="e.g. 50 × 100 ft" /></label>
        <label className="card">Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(+e.target.value)}>{[1,2,3,4,5,6,7].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="card">Bathrooms<select value={bathrooms} onChange={e=>setBathrooms(+e.target.value)}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="card">Floors<select value={floors} onChange={e=>setFloors(+e.target.value)}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="card">House style<select value={style} onChange={e=>setStyle(e.target.value)}>{styles.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Garage / carport<select value={garage} onChange={e=>setGarage(e.target.value)}>{['None','Carport','1-car garage','2-car garage','3-car garage'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Kitchen / living arrangement<select value={layout} onChange={e=>setLayout(e.target.value)}>{['Open kitchen + living','Separate kitchen + living','Kitchen + dining + family room','Custom arrangement'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Roof style<select value={roof} onChange={e=>setRoof(e.target.value)}>{roofs.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Finishes / materials<select value={finish} onChange={e=>setFinish(e.target.value)}>{finishes.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Budget<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. KES 15,000,000" /></label>
      </section>

      <section>
        <p className="eyebrow">DESIGN CONFIGURATION</p>
        <div className="option">
          <strong>{summary.bedrooms} bedrooms · {summary.bathrooms} bathrooms · {summary.floors} floor(s)</strong>
          <span>{summary.plot} · {summary.style} · {summary.roof} roof · {summary.garage}</span>
          <span>{summary.layout} · {summary.finish} finishes · {summary.budget}</span>
        </div>
        <div className="option"><strong>Next:</strong><span>Save this design brief, then request the exterior, interior, floor-plan, renovation or materials render you want to visualise.</span></div>
        <div className="option">
          <button className="button" type="button" onClick={saveBrief} disabled={saving || !propertyRecordId}>{saving ? 'Saving…' : 'Save design brief'}</button>
        </div>
      </section>

      <section>
        <p className="eyebrow">RENDER STUDIO</p>
        <div className="grid">
          <label className="card">Render type<select value={renderType} onChange={e=>setRenderType(e.target.value)}>
            <option value="exterior">Exterior</option>
            <option value="interior">Interior</option>
            <option value="floor_plan">Floor plan</option>
            <option value="renovation_before_after">Renovation before / after</option>
            <option value="materials">Materials & finishes</option>
          </select></label>
          <div className="card"><strong>Property-linked render</strong><p>Each request is attached to this property's saved design brief.</p><button className="button" type="button" onClick={requestRender} disabled={saving || !propertyRecordId}>Request render →</button></div>
        </div>
        {message && <p role="status">{message}</p>}
        <div className="grid">{renders.map(r=><div className="card" key={r.id}>
          <strong>{r.render_type.replaceAll('_',' ')}</strong><span>Status: {r.status}</span>
          {r.image_url && <img src={r.image_url} alt={r.render_type.replaceAll('_',' ') + ' property render'} style={{width:'100%',marginTop:12,borderRadius:12}} />}
          {r.status === 'ready' && <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="button" type="button" onClick={()=>reviewRender(r.id,'approved')} disabled={saving}>Approve render</button>
            <button className="button" type="button" onClick={()=>reviewRender(r.id,'rejected')} disabled={saving}>Reject</button>
          </div>}
          {r.status === 'approved' && <p role="status">✓ Approved design reference</p>}
          {r.status === 'requested' && <button className="button" type="button" onClick={()=>generateRender(r.id)} disabled={saving}>Generate render →</button>}
        </div>)}</div>
      </section>
    </main>
  );
}
