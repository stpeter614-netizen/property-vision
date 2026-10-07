'use client';

import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

function authClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null}
function money(cents:number,currency='KES'){return new Intl.NumberFormat('en-KE',{style:'currency',currency,maximumFractionDigits:2}).format((cents||0)/100)}

export default function QuotePage(){
 const [workOrderId,setWorkOrderId]=useState(''),[estimate,setEstimate]=useState<any>(null),[lines,setLines]=useState<any[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(id:string){
  const client=authClient(); const session=(await client?.auth.getSession())?.data.session;
  if(!session){setMessage('Sign in to Property Vision to view your quote.');return}
  const res=await fetch('/api/property/quote?workOrderId='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+session.access_token}});
  const data=await res.json().catch(()=>({})); if(!res.ok){setMessage(data.error||'Could not load quote.');return}
  setEstimate(data.estimate);setLines(data.lines||[]);setMessage(data.estimate?'Quote loaded.':'No quote has been issued yet.');
 }
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('workOrderId')||'';setWorkOrderId(id);if(id)load(id);else setMessage('A work-order ID is required.');},[]);
 async function respond(response:string){
  if(!estimate||busy)return; setBusy(true);setMessage('Saving your response...');
  const client=authClient();const session=(await client?.auth.getSession())?.data.session;
  if(!session){setBusy(false);setMessage('Sign in to Property Vision to respond.');return}
  const res=await fetch('/api/property/quote',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({estimateId:estimate.id,response})});
  const data=await res.json().catch(()=>({}));setBusy(false);
  if(!res.ok){setMessage(data.error||'Could not save response.');return}
  if(data.estimate)setEstimate((x:any)=>({...x,...data.estimate}));
  setMessage(response==='approved'?'Quote approved. Property Vision can now move the work forward.':'Quote rejected. The project can be reviewed and revised.');
 }
 return <main className="shell">
  <nav className="nav"><a href="/">PROPERTY VISION</a><span>Quote</span></nav>
  <section className="hero"><p className="eyebrow">PROPERTY VISION · QUOTE</p><h1>Review your project quote.</h1><p className="lead">See the scope, costs and current decision before work moves forward.</p></section>
  <section className="card">
   {!estimate?<><h2>No quote available</h2><p>{message}</p></>:<>
    <div className="option"><strong>Quote #{estimate.id.slice(0,8)}</strong><span>{estimate.status.replace('_',' ')}</span></div>
    <div className="grid">
     <div><p>Materials & other line items</p><h2>{money(estimate.subtotal_cents,estimate.currency)}</h2></div>
     <div><p>Labour</p><h2>{money(estimate.labour_cents,estimate.currency)}</h2></div>
     <div><p>Other</p><h2>{money(estimate.other_cents,estimate.currency)}</h2></div>
     <div><p>Total</p><h2>{money(estimate.total_cents,estimate.currency)}</h2></div>
    </div>
    <div className="card"><h2>Quote details</h2>{lines.length?lines.map((line)=><div className="option" key={line.id}><strong>{line.description}</strong><span>{line.quantity} {line.unit||''} · {money(line.line_total_cents,estimate.currency)}</span></div>):<p>No line-item details were supplied.</p>}</div>
    {estimate.status==='sent'?<div className="progress"><button className="button" disabled={busy} onClick={()=>respond('approved')}>Approve quote</button><button className="button secondary" disabled={busy} onClick={()=>respond('rejected')}>Reject quote</button></div>:<p><strong>Status:</strong> {estimate.status}. {estimate.responded_at?new Date(estimate.responded_at).toLocaleString():''}</p>}
    <p>{message}</p>
   </>}
  </section>
  {workOrderId&&<section className="card"><strong>Work order</strong><p>{workOrderId}</p><a className="button secondary" href={'/property/execution?workOrderId='+encodeURIComponent(workOrderId)}>Open execution view</a></section>}
 </main>
}
