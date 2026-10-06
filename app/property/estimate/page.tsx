'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Line={description:string;quantity:number;unit:string;unitPrice:number;type:'material'|'labour'|'other'};

function authClient() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url && key ? createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}) : null;
}

export default function EstimatePage(){
 const [workOrderId,setWorkOrderId]=useState('');
 const [lines,setLines]=useState<Line[]>([]);
 const [description,setDescription]=useState('');
 const [quantity,setQuantity]=useState(1);
 const [unit,setUnit]=useState('item');
 const [unitPrice,setUnitPrice]=useState(0);
 const [type,setType]=useState<Line['type']>('material');
 const [labour,setLabour]=useState(0);
 const [other,setOther]=useState(0);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState('');

 useEffect(()=>{setWorkOrderId(new URLSearchParams(window.location.search).get('workOrderId')||'');},[]);
 const subtotal=useMemo(()=>lines.reduce((n,l)=>n+l.quantity*l.unitPrice,0),[lines]);
 const total=subtotal+labour+other;

 function add(){
  if(!description.trim()||quantity<=0||unitPrice<0)return;
  setLines(x=>[...x,{description:description.trim(),quantity,unit,unitPrice,type}]);
  setDescription('');setQuantity(1);setUnitPrice(0);
 }

 async function sendQuote(){
  setMessage('');
  if(!workOrderId){setMessage('Open the estimate from a work order so the quote stays connected.');return;}
  setSaving(true);
  try{
   const client=authClient();
   const session=(await client?.auth.getSession())?.data.session;
   if(!session)throw new Error('Sign in to Property Vision to send a quote.');
   const response=await fetch('/api/developer/estimates',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
    body:JSON.stringify({
     workOrderId,
     labourCents:Math.round(labour*100),
     otherCents:Math.round(other*100),
     lines:lines.map(l=>({description:l.description,quantity:l.quantity,unit:l.unit,unitPriceCents:Math.round(l.unitPrice*100),lineType:l.type}))
    })
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||'Unable to send quote.');
   setMessage('Quote sent. Total: KES '+(data.estimate.total_cents/100).toLocaleString());
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to send quote.');}
  finally{setSaving(false);}
 }

 return <main className="shell">
  <nav className="nav"><a href="/developer/work-orders">← Work Orders</a><span>Quote</span></nav>
  <section className="hero"><div><p className="eyebrow">WORK ORDER → QUOTE</p><h1>Build the quote from the actual job.</h1><p className="lead">Use materials, labour and other costs. The quote is saved against the work order and can move to customer approval.</p></div></section>
  <section className="card"><strong>Work-order ID</strong><input value={workOrderId} onChange={e=>setWorkOrderId(e.target.value)} placeholder="Work-order UUID"/></section>
  <section className="grid">
   <label className="card">Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="e.g. Toilet pan and fittings"/></label>
   <label className="card">Quantity<input type="number" min="0.01" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
   <label className="card">Unit<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="item, m², hour"/></label>
   <label className="card">Unit price (KES)<input type="number" min="0" value={unitPrice} onChange={e=>setUnitPrice(Number(e.target.value))}/></label>
   <label className="card">Line type<select value={type} onChange={e=>setType(e.target.value as Line['type'])}><option value="material">Material</option><option value="labour">Labour</option><option value="other">Other</option></select></label>
  </section>
  <button className="button" type="button" onClick={add}>Add quote line</button>
  <section>{lines.map((l,i)=><div className="option" key={i}><strong>{l.description}</strong><span>{l.quantity} {l.unit} × KES {l.unitPrice.toLocaleString()} = KES {(l.quantity*l.unitPrice).toLocaleString()}</span></div>)}</section>
  <section className="grid">
   <label className="card">Additional labour (KES)<input type="number" min="0" value={labour} onChange={e=>setLabour(Number(e.target.value))}/></label>
   <label className="card">Other costs (KES)<input type="number" min="0" value={other} onChange={e=>setOther(Number(e.target.value))}/></label>
  </section>
  <section className="card"><strong>Total quote</strong><h2>KES {total.toLocaleString()}</h2><p>{message}</p><button className="button" type="button" onClick={sendQuote} disabled={saving}>{saving?'Sending quote…':'Send quote →'}</button></section>
 </main>;
}