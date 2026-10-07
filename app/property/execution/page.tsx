'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const stages=['requested','quoted','approved','scheduled','in_progress','completed'];

function authClient() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url && key ? createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}) : null;
}

export default function ExecutionPage(){
 const [stage,setStage]=useState('requested');
 const [message,setMessage]=useState('');
 const [workOrderId,setWorkOrderId]=useState('');
 const [assignmentId,setAssignmentId]=useState('');
 const [assignmentStatus,setAssignmentStatus]=useState('proposed');
 const [providerId,setProviderId]=useState('');
 const [assignments,setAssignments]=useState<Array<{id:string;provider_id:string;status:string;scheduled_at?:string|null}>>([]);
 const [provider,setProvider]=useState('');
 const [estimate,setEstimate]=useState('');
 const [designLinks,setDesignLinks]=useState<Array<{id:string;render?:{id:string;render_type:string;status:string;image_url?:string|null}|null}>>([]);
 const i=Math.max(0,stages.indexOf(stage));
 useEffect(() => {
  const id = new URLSearchParams(window.location.search).get('workOrderId');
  if (!id) return;
  setWorkOrderId(id);
  (async () => {
   const client = authClient();
   const session = (await client?.auth.getSession())?.data.session;
   if (!session) { setMessage('Sign in to Property Vision to load this work order.'); return; }
   const res = await fetch('/api/property/work?id=' + encodeURIComponent(id), {
    headers: { Authorization: 'Bearer ' + session.access_token }
   });
   const data = await res.json().catch(() => ({}));
   if (!res.ok) { setMessage(data.error || 'Could not load work order.'); return; }
   const order = data.workOrder;
   setDesignLinks(data.designLinks || []);
   const assignmentsRes=await fetch('/api/developer/assignments?workOrderId='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+session.access_token}});
   const assignmentsData=await assignmentsRes.json().catch(()=>({}));
   if(assignmentsRes.ok && Array.isArray(assignmentsData.assignments)){ setAssignments(assignmentsData.assignments); if(assignmentsData.assignments[0]){setAssignmentId(assignmentsData.assignments[0].id);setProviderId(assignmentsData.assignments[0].provider_id);setAssignmentStatus(assignmentsData.assignments[0].status);}}
   const allowed = stages.indexOf(order.status);
   if (allowed >= 0) setStage(order.status);
   setMessage('Work order loaded from Property Vision.');
  })();
 }, []);


 async function createAssignment(){
  setMessage('Creating provider assignment…');
  if(!workOrderId||!providerId){setMessage('A work-order and provider ID are required.');return;}
  const client=authClient(); const session=(await client?.auth.getSession())?.data.session;
  if(!session){setMessage('Sign in to Property Vision to assign a provider.');return;}
  const res=await fetch('/api/developer/assignments',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({workOrderId,providerId})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){setMessage(data.error||'Unable to create provider assignment.');return;}
  setAssignments(x=>[data.assignment,...x]); setAssignmentId(data.assignment.id); setAssignmentStatus(data.assignment.status);
  setMessage('Provider assignment created.');
 }

 async function persistAssignment(next:string){
  setAssignmentStatus(next); setMessage('Saving provider assignment...');
  if(!assignmentId){setMessage('Enter an assignment ID to persist provider status.');return;}
  const client=authClient();
  const session=(await client?.auth.getSession())?.data.session;
  if(!session){setMessage('Sign in to Property Vision to save changes.');return;}
  const res=await fetch('/api/property/execution',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action:'assignment_status',id:assignmentId,status:next})});
  const data=await res.json().catch(()=>({}));
  setMessage(res.ok ? 'Provider assignment saved.' : (data.error || 'Could not save provider assignment.'));
 }

 async function persist(next:string){
  setStage(next); setMessage('Saving work order...');
  if(!workOrderId){setMessage('UI state updated. Enter a work-order ID to persist it.');return;}
  const client=authClient();
  const session=(await client?.auth.getSession())?.data.session;
  if(!session){setMessage('Sign in to Property Vision to save changes.');return;}
  const res=await fetch('/api/property/execution',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action:'work_order_status',id:workOrderId,status:next})});
  const data=await res.json().catch(()=>({}));
  setMessage(res.ok ? 'Work order saved.' : (data.error || 'Could not save work order.'));
 }

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
  {designLinks.length > 0 && <section className="card">
   <strong>Approved design reference</strong>
   <p>This work request is connected to the approved design used to start the project.</p>
   <div className="grid">{designLinks.map(link => link.render && <div className="card" key={link.id}>
    <strong>{link.render.render_type.replaceAll('_',' ')}</strong>
    <span>Status: {link.render.status}</span>
    {link.render.image_url && <img src={link.render.image_url} alt="Approved property design render" style={{width:'100%',marginTop:12,borderRadius:12}} />}
   </div>)}</div>
  </section>}

  <section className="card"><strong>Provider assignment</strong>
   <p>Current: {assignmentStatus.replace('_',' ')}</p>
   <div className="grid"><label className="card">Provider ID<input value={providerId} onChange={e=>setProviderId(e.target.value)} placeholder="Provider UUID"/></label><button className="button" type="button" onClick={createAssignment}>Create assignment →</button></div>
   {assignments.length>0 && <div>{assignments.map(a=><div className="option" key={a.id}><strong>{a.status.replace('_',' ')}</strong><span>{a.provider_id}</span></div>)}</div>}
<div className="progress">{['proposed','accepted','scheduled','in_progress','completed'].map(s=><button key={s} className={assignmentStatus===s?'button':'button secondary'} type="button" onClick={()=>persistAssignment(s)}>{s.replace('_',' ')}</button>)}</div></section>
  <section className="card"><strong>Persistence</strong><p>{message}</p></section>
  <section className="card"><strong>Current status</strong><h2>{stage.replace('_',' ')}</h2><p>Next: {stage==='requested'?'prepare estimate':stage==='quoted'?'review and approve estimate':stage==='approved'?'assign and schedule':stage==='scheduled'?'start work':stage==='in_progress'?'record completion':'workflow complete'}.</p>{(stage==='quoted'||stage==='approved'||stage==='completed')&&workOrderId?<p><a className="button" href={'/property/quote?workOrderId='+encodeURIComponent(workOrderId)}>Review quote</a></p>:null}</section>
 </main>;
}
