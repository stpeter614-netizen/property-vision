'use client';

import { useState } from 'react';

const stages=['requested','quoted','approved','scheduled','in_progress','completed'];

export default function ExecutionPage(){
 const [stage,setStage]=useState('requested');
 const [message,setMessage]=useState('');
 const [workOrderId,setWorkOrderId]=useState('');
 const [assignmentId,setAssignmentId]=useState('');
 const [assignmentStatus,setAssignmentStatus]=useState('proposed');
 const [provider,setProvider]=useState('');
 const [estimate,setEstimate]=useState('');
 const i=Math.max(0,stages.indexOf(stage));
 return <main className="shell">
  <nav className="nav"><a href="/">PROPERTY VISION</a><span>Execution</span></nav>
  <section className="hero"><p className="eyebrow">PROPERTY WORKFLOW</p><h1>One execution view from request to completion.</h1><p className="lead">Keep the property, scope, estimate, provider and delivery status connected.</p></section>
  <section className="card">
   <div className="option"><strong>Kitchen renovation</strong><span>Normal · Property Vision lifecycle</span></div>
   <div className="progress">{stages.map((s,n)=><button key={s} className={n<=i?'button':'button secondary'} onClick={()=>persist(s)} type="button">{s.replace('_',' ')}</button>)}</div>
  </section>
  <section className="grid"><label className="card">Work-order ID<input value={workOrderId} onChange={e=>setWorkOrderId(e.target.value)} placeholder="UUID from Property Vision"/></label><label className="card">Assignment ID<input value={assignmentId} onChange={e=>setAssignmentId(e.target.value)} placeholder="Provider assignment UUID"/></label></section>
  <section className="grid">
   <label className="card">Estimate<input value={estimate} onChange={e=>setEstimate(e.target.value)} placeholder="e.g. KES 485,000"/></label>
   <label className="card">Assigned provider<input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="Provider / contractor"/></label>
  </section>
  <section className="card"><strong>Provider assignment</strong><p>Current: {assignmentStatus.replace('_',' ')}</p><div className="progress">{['proposed','accepted','scheduled','in_progress','completed'].map(s=><button key={s} className={assignmentStatus===s?'button':'button secondary'} type="button" onClick={()=>persistAssignment(s)}>{s.replace('_',' ')}</button>)}</div></section>
  <section className="card"><strong>Persistence</strong><p>{message}</p></section>
  <section className="card"><strong>Current status</strong><h2>{stage.replace('_',' ')}</h2><p>Next: {stage==='requested'?'prepare estimate':stage==='quoted'?'approve estimate':stage==='approved'?'assign and schedule':stage==='scheduled'?'start work':stage==='in_progress'?'record completion':'workflow complete'}.</p></section>
 </main>;
}
