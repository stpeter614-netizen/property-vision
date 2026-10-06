'use client';

import { useState } from 'react';

type Provider={name:string;type:string;specialties:string;area:string;contact:string};

export default function ProvidersPage(){
 const [providers,setProviders]=useState<Provider[]>([]);
 const [name,setName]=useState(''); const [type,setType]=useState('contractor');
 const [specialties,setSpecialties]=useState(''); const [area,setArea]=useState(''); const [contact,setContact]=useState('');
 function add(){if(!name.trim())return;setProviders(p=>[...p,{name:name.trim(),type,specialties,area,contact}]);setName('');setSpecialties('');setArea('');setContact('');}
 return <main className="shell">
  <nav className="nav"><a href="/">PROPERTY VISION</a><span>Providers</span></nav>
  <section className="hero"><p className="eyebrow">SERVICE EXECUTION</p><h1>Connect property work to the right provider.</h1><p className="lead">Contractors, vendors and professionals can be matched to lifecycle work and assigned to individual work orders.</p></section>
  <section className="grid">
   <label className="card">Provider / company<input value={name} onChange={e=>setName(e.target.value)} placeholder="Company or professional"/></label>
   <label className="card">Provider type<select value={type} onChange={e=>setType(e.target.value)}><option value="contractor">Contractor</option><option value="vendor">Vendor</option><option value="professional">Professional</option><option value="specialist">Specialist</option></select></label>
   <label className="card">Specialties<input value={specialties} onChange={e=>setSpecialties(e.target.value)} placeholder="Painting, tiling, plumbing"/></label>
   <label className="card">Service area<input value={area} onChange={e=>setArea(e.target.value)} placeholder="Area / region"/></label>
   <label className="card">Contact<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Phone or email"/></label>
  </section>
  <button className="button" type="button" onClick={add}>Add provider</button>
  <section>{providers.map((p,i)=><div className="option" key={i}><div><strong>{p.name}</strong><div>{p.type} · {p.specialties || 'No specialties added'}</div></div><span>{p.area || 'Service area not set'}<br/>{p.contact}</span></div>)}</section>
  <section className="card"><strong>Execution flow</strong><p>Work request → scope → estimate → provider assignment → acceptance → scheduling → in progress → completed.</p></section>
 </main>;
}
