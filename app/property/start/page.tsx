'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const types = ['House','Apartment','Villa','Bungalow','Townhouse','Commercial','Office','Retail','Industrial','Land','Other'];
const stages = ['Design','Planning','Construction','Sale','Rent','Purchase','Configuration','Renovation','Repair','Maintenance','Upgrade','Handover','Resale'];

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
}

export default function PropertyStart() {
  const [type,setType]=useState('House');
  const [stage,setStage]=useState('Design');
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [actionTitle,setActionTitle]=useState('');
  const [workType,setWorkType]=useState('Other');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStage = params.get('stage');
    if (requestedStage && stages.includes(requestedStage)) setStage(requestedStage);
    setActionTitle(params.get('title') || '');
    const requestedWorkType = params.get('workType');
    if (requestedWorkType) setWorkType(requestedWorkType);
  }, []);

  const next = useMemo(() => {
    if (stage === 'Design') return 'Configure the property brief, rooms, dimensions, style, finishes and budget.';
    if (stage === 'Renovation') return 'Define the existing property, spaces, work required, materials and budget.';
    if (stage === 'Repair') return 'Describe the problem, location in the property, urgency and preferred service.';
    if (stage === 'Maintenance') return 'Create a property record and define recurring or one-off maintenance work.';
    if (stage === 'Upgrade') return 'Choose the area to upgrade, desired outcome, materials and budget.';
    if (stage === 'Sale' || stage === 'Rent' || stage === 'Resale') return 'Prepare the property experience, information, media and enquiry journey.';
    return 'Create the structured property record and continue into the selected workflow.';
  }, [stage]);

  async function continueJourney() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter a property name to continue.'); return; }
    setSaving(true);
    try {
      const client = authClient();
      const session = (await client?.auth.getSession())?.data.session;
      if (!session) throw new Error('Sign in to Property Vision before saving a property.');
      const response = await fetch('/api/property/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ name: trimmed, type, stage })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save the property.');
      const id = data.property?.id;
      if (!id) throw new Error('Property was saved without an ID.');
      const destination = stage === 'Design' ? '/design/house' : '/property/work';
      const params = new URLSearchParams({ propertyRecordId: id });
      if (actionTitle) params.set('title', actionTitle);
      if (workType) params.set('workType', workType);
      window.location.href = destination + '?' + params.toString();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the property.');
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>Start a property journey</span></nav>
      <section className="hero"><div><p className="eyebrow">PROPERTY LIFECYCLE</p><h1>Start with the property. Then choose what needs to happen.</h1><p className="lead">Property Vision is designed to follow the property through its lifecycle instead of forcing every user into an off-plan development workflow.</p></div></section>
      <section className="grid">
        <label className="card">Property name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. My Family Home" maxLength={120} /></label>
        <label className="card">Property type<select value={type} onChange={e=>setType(e.target.value)}>{types.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">What do you want to do?<select value={stage} onChange={e=>setStage(e.target.value)}>{stages.map(x=><option key={x}>{x}</option>)}</select></label>
      </section>
      <section>
        <p className="eyebrow">NEXT WORKFLOW</p>
        <div className="option"><strong>{type} · {stage}</strong><span>{name || 'Unnamed property'}</span><span>{next}</span></div>
        {error && <p role="alert">{error}</p>}
        <button className="button" type="button" onClick={continueJourney} disabled={saving}>{saving ? 'Saving property…' : stage === 'Design' ? 'Save & continue to house design →' : 'Save & continue to property work →'}</button>
      </section>
    </main>
  );
}
