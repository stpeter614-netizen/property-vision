'use client';

import { useMemo, useState } from 'react';

type Line={description:string;quantity:number;unit:string;unitPrice:number;type:'Material'|'Labour'|'Other'};

export default function EstimatePage(){
 const [lines,setLines]=useState<Line[]>([]);
 const [description,setDescription]=useState('');
 const [quantity,setQuantity]=useState(1);
 const [unit,setUnit]=useState('item');
 const [unitPrice,setUnitPrice]=useState(0);
 const [type,setType]=useState<Line['type']>('Material');
 const [labour,setLabour]=useState(0);
 const [other,setOther]=useState(0);
 const subtotal=useMemo(()=>lines.reduce((n,l)=>n+l.quantity*l.unitPrice,0),[lines]);
 const total=subtotal+labour+other;
 function add(){if(!description.trim())return;setLines(x=>[...x,{description:description.trim(),quantity,unit,unitPrice,type}]);setDescription('');setQuantity(1);setUnitPrice(0);}
 return <main className="shell">
  <nav className="nav"><a href="/">PROPERTY VISION</a><span>Estimate</span></nav>
  <section className="hero"><div><p className="eyebrow">SCOPE → MATERIALS → COST</p><h1>Build the property estimate from the actual work.</h1><p className="lead">Add materials, labour and other costs. The estimate remains tied to the property lifecycle workflow.</p></div></section>
  <section className="grid">
   <label className="card">Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="e.g. Premium floor tiles"/></label>
   <label className="card">Quantity<input type="number" min="0" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
   <label className="card">Unit<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="m², bag, item"/></label>
   <label className="card">Unit price (KES)<input type="number" min="0" value={unitPrice} onChange={e=>setUnitPrice(Number(e.target.value))}/></label>
   <label className="card">Line type<select value={type} onChange={e=>setType(e.target.value as Line['type'])}><option>Material</option><option>Labour</option><option>Other</option></select></label>
  </section>
  <section><button className="button" type="button" onClick={add}>Add estimate line</button></section>
  <section>{lines.map((l,i)=><div className="option" key={i}><strong>{l.description}</strong><span>{l.quantity} {l.unit} × KES {l.unitPrice.toLocaleString()} = KES {(l.quantity*l.unitPrice).toLocaleString()}</span></div>)}</section>
  <section className="grid">
   <label className="card">Additional labour (KES)<input type="number" min="0" value={labour} onChange={e=>setLabour(Number(e.target.value))}/></label>
   <label className="card">Other costs (KES)<input type="number" min="0" value={other} onChange={e=>setOther(Number(e.target.value))}/></label>
  </section>
  <section><div className="option"><strong>Materials / line subtotal</strong><span>KES {subtotal.toLocaleString()}</span><strong>Total estimate</strong><span>KES {total.toLocaleString()}</span></div></section>
 </main>;
}
