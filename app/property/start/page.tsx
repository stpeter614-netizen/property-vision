'use client';

import { useMemo, useState } from 'react';

const types = ['House','Apartment','Villa','Bungalow','Townhouse','Commercial','Office','Retail','Industrial','Land','Other'];
const stages = ['Design','Planning','Construction','Sale','Rent','Purchase','Configuration','Renovation','Repair','Maintenance','Upgrade','Handover','Resale'];

export default function PropertyStart() {
  const [type,setType]=useState('House');
  const [stage,setStage]=useState('Design');
  const [name,setName]=useState('');
  const next = useMemo(() => {
    if (stage === 'Design') return 'Configure the property brief, rooms, dimensions, style, finishes and budget.';
    if (stage === 'Renovation') return 'Define the existing property, spaces, work required, materials and budget.';
    if (stage === 'Repair') return 'Describe the problem, location in the property, urgency and preferred service.';
    if (stage === 'Maintenance') return 'Create a property record and define recurring or one-off maintenance work.';
    if (stage === 'Upgrade') return 'Choose the area to upgrade, desired outcome, materials and budget.';
    if (stage === 'Sale' || stage === 'Rent' || stage === 'Resale') return 'Prepare the property experience, information, media and enquiry journey.';
    return 'Create the structured property record and continue into the selected workflow.';
  }, [stage]);

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>Start a property journey</span></nav>
      <section className="hero">
        <div>
          <p className="eyebrow">PROPERTY LIFECYCLE</p>
          <h1>Start with the property. Then choose what needs to happen.</h1>
          <p className="lead">Property Vision is designed to follow the property through its lifecycle instead of forcing every user into an off-plan development workflow.</p>
        </div>
      </section>
      <section className="grid">
        <label className="card">Property name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. My Family Home" /></label>
        <label className="card">Property type<select value={type} onChange={e=>setType(e.target.value)}>{types.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">What do you want to do?<select value={stage} onChange={e=>setStage(e.target.value)}>{stages.map(x=><option key={x}>{x}</option>)}</select></label>
      </section>
      <section>
        <p className="eyebrow">NEXT WORKFLOW</p>
        <div className="option"><strong>{type} · {stage}</strong><span>{name || 'Unnamed property'}</span><span>{next}</span></div>
        <a className="button" href={stage === 'Design' ? '/design/house' : '/services'}>{stage === 'Design' ? 'Continue to house design →' : 'Explore the required services →'}</a>
      </section>
    </main>
  );
}
