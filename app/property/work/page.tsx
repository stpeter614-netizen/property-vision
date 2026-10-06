'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
}

const workTypes = ['Renovation','Repair','Maintenance','Upgrade','Inspection','Installation'];
const urgencies = ['Routine','Normal','Urgent','Emergency'];

export default function PropertyWorkPage() {
  const [title,setTitle]=useState('');
  const [type,setType]=useState('Renovation');
  const [urgency,setUrgency]=useState('Normal');
  const [location,setLocation]=useState('');
  const [budget,setBudget]=useState('');
  const [description,setDescription]=useState('');
  const [items,setItems]=useState<string[]>([]);
  const [item,setItem]=useState('');
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [propertyRecordId,setPropertyRecordId]=useState('');
  
  useMemo(() => {
    if (typeof window !== 'undefined') {
      setPropertyRecordId(new URLSearchParams(window.location.search).get('propertyRecordId') || '');
    }
  }, []);

  const summary=useMemo(()=>({title,type,urgency,location,budget,description,items}),[title,type,urgency,location,budget,description,items]);

  function addItem(){ if(!item.trim()) return; setItems(current=>[...current,item.trim()]); setItem(''); }

  async function submit() {
    setMessage('');
    if (!propertyRecordId) { setMessage('Start with a saved property before creating a work request.'); return; }
    if (!title.trim()) { setMessage('Enter a work title.'); return; }
    setSaving(true);
    try {
      const client = authClient();
      const session = (await client?.auth.getSession())?.data.session;
      if (!session) throw new Error('Sign in to Property Vision before creating a work request.');
      const numericBudget = budget.replace(/[^0-9.]/g,'');
      const budgetCents = numericBudget ? Math.round(Number(numericBudget) * 100) : null;
      if (budgetCents !== null && !Number.isFinite(budgetCents)) throw new Error('Enter a valid budget.');
      const response = await fetch('/api/property/work', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer ' + session.access_token},
        body:JSON.stringify({
          propertyRecordId,
          title:title.trim(),
          workType:type,
          urgency,
          location:location.trim(),
          description:description.trim(),
          budgetCents,
          items:items.map(description=>({description}))
        })
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error || 'Unable to create the work request.');
      setMessage('Work request created. Opening execution…');
      window.location.href = '/property/execution?workOrderId=' + encodeURIComponent(data.workOrder.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to create the work request.');
    } finally { setSaving(false); }
  }

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>Property work</span></nav>
      <section className="hero">
        <div><p className="eyebrow">RENOVATE · REPAIR · MAINTAIN · UPGRADE</p><h1>Describe the work. Property Vision structures the job.</h1><p className="lead">Create a clear work request with the property area, urgency, scope items and budget. This becomes the foundation for quotes, scheduling and project tracking.</p></div>
      </section>
      <section className="grid">
        <label className="card">Work title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Renovate kitchen" /></label>
        <label className="card">Work type<select value={type} onChange={e=>setType(e.target.value)}>{workTypes.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Urgency<select value={urgency} onChange={e=>setUrgency(e.target.value)}>{urgencies.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Property area / location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Kitchen, roof, bathroom" /></label>
        <label className="card">Budget<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. KES 500,000" /></label>
        <label className="card">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What needs to be done?" /></label>
      </section>
      <section>
        <p className="eyebrow">SCOPE OF WORK</p>
        <div className="option"><input value={item} onChange={e=>setItem(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') addItem()}} placeholder="Add a work item" /><button className="button" type="button" onClick={addItem}>Add</button></div>
        <div className="grid">{items.map((x,i)=><div className="card" key={i}><strong>{i+1}. {x}</strong></div>)}</div>
      </section>
      <section>
        <p className="eyebrow">WORK SUMMARY</p>
        <div className="option"><strong>{summary.title || 'Untitled work'}</strong><span>{summary.type} · {summary.urgency}</span><span>{summary.location || 'Property area not specified'}</span><span>{summary.items.length} scope item(s) · {summary.budget || 'Budget not specified'}</span></div>
        {message && <p role="status">{message}</p>}
        <button className="button" type="button" onClick={submit} disabled={saving}>{saving ? 'Creating work request…' : 'Create work request →'}</button>
      </section>
    </main>
  );
}
