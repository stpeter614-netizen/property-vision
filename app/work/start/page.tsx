'use client';

import { useMemo, useState } from 'react';

const types = ['Renovation','Repair','Maintenance','Upgrade','Inspection'];
const priorities = ['Low','Normal','High','Urgent'];
const areas = ['Whole property','Kitchen','Bathroom','Living room','Bedroom','Roof','Exterior','Garden / landscape','Electrical','Plumbing','Other'];

export default function WorkStart() {
  const [type,setType]=useState('Renovation');
  const [area,setArea]=useState('Whole property');
  const [priority,setPriority]=useState('Normal');
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [budget,setBudget]=useState('');

  const summary=useMemo(()=>({type,area,priority,title,description,budget}),[type,area,priority,title,description,budget]);

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>Property work</span></nav>
      <section className="hero"><div>
        <p className="eyebrow">RENOVATE · REPAIR · MAINTAIN · UPGRADE</p>
        <h1>Tell Property Vision what needs to happen.</h1>
        <p className="lead">Create a structured work request with the property area, urgency, scope and budget. The same property record can keep the work history.</p>
      </div></section>
      <section className="grid">
        <label className="card">Work type<select value={type} onChange={e=>setType(e.target.value)}>{types.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Area<select value={area} onChange={e=>setArea(e.target.value)}>{areas.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Priority<select value={priority} onChange={e=>setPriority(e.target.value)}>{priorities.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">What is needed?<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Repair leaking roof" /></label>
        <label className="card">Describe the work<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the problem, desired result or work scope." /></label>
        <label className="card">Budget (optional)<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. KES 250,000" /></label>
      </section>
      <section>
        <p className="eyebrow">WORK REQUEST</p>
        <div className="option"><strong>{summary.type} · {summary.area}</strong><span>{summary.priority} priority</span><span>{summary.title || 'Work request not yet named'}</span><span>{summary.budget || 'Budget not specified'}</span></div>
        <a className="button" href="/services">Find the relevant property service →</a>
      </section>
    </main>
  );
}
