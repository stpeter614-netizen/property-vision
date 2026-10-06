'use client';

import { useState } from 'react';

const stages=['requested','quoted','approved','scheduled','in_progress','completed'];

export default function ExecutionPage(){
 const [stage,setStage]=useState('requested');
 const [provider,setProvider]=useState('');
 const [estimate,setEstimate]=useState('');
 const i=Math.max(0,stages.indexOf(stage));
 return <main className="shell">
  <nav className="nav"><a href="/">PROPERTY VISION</a><span>Execution</span></nav>
  <section className="hero"><p className="eyebrow">PROPERTY WORKFLOW</p><h1>One execution view from request to completion.</h1><p className="lead">Keep the property, scope, estimate, provider and delivery status connected.</p></section>
  <section className="card">
   <div className="option"><strong>Kitchen renovation</strong><span>Normal · Property Vision lifecycle</span></div>
   <div className="progress">{stages.map((s,n)=><button key={s} className={n<=i?'button':'button secondary'} onClick={()=>setStage(s)} type="button">{s.replace('_',' ')}</button>)}</div>
  </section>
  <section className="grid">
   <label className="card">Estimate<input value={estimate} onChange={e=>setEstimate(e.target.value)} placeholder="e.g. KES 485,000"/></label>
   <label className="card">Assigned provider<input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="Provider / contractor"/></label>
  </section>
  <section className="card"><strong>Current status</strong><h2>{stage.replace('_',' ')}</h2><p>Next: {stage==='requested'?'prepare estimate':stage==='quoted'?'approve estimate':stage==='approved'?'assign and schedule':stage==='scheduled'?'start work':stage==='in_progress'?'record completion':'workflow complete'}.</p></section>
 </main>;
}
