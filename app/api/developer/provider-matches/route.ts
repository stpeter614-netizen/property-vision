import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function db(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const auth=request.headers.get('authorization');
 if(!url||!key||!auth?.startsWith('Bearer '))return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
}
export async function GET(request:Request){
 const client=db(request); if(!client)return NextResponse.json({error:'Authentication required.'},{status:401});
 const {data:u}=await client.auth.getUser(); if(!u.user)return NextResponse.json({error:'Authentication required.'},{status:401});
 const id=new URL(request.url).searchParams.get('workOrderId')||'';
 if(!UUID.test(id))return NextResponse.json({error:'Valid work order ID is required.'},{status:400});
 const {data:w,error:we}=await client.from('property_work_orders').select('id,title,work_type,urgency,location,developer_id,status').eq('id',id).single();
 if(we||!w)return NextResponse.json({error:'Work order not found or not authorized.'},{status:404});
 const {data:providers,error}=await client.from('property_service_providers').select('id,name,provider_type,specialties,service_area,status,developer_id').eq('status','active').order('name');
 if(error)return NextResponse.json({error:'Unable to load provider matches.'},{status:400});
 const tokens=[w.work_type,w.title,w.location].filter(Boolean).join(' ').toLowerCase().split(/[^a-z0-9]+/).filter((x:string)=>x.length>2);
 const matches=(providers||[]).map((p:any)=>{
  const specialties=(p.specialties||[]).map((x:string)=>String(x).toLowerCase());
  const area=String(p.service_area||'').toLowerCase();
  const text=[...specialties,area,p.name.toLowerCase()].join(' ');
  let score=0;
  for(const t of tokens){ if(specialties.some((s:string)=>s.includes(t)||t.includes(s))) score+=5; else if(text.includes(t)) score+=2; }
  if(w.location && area && area.includes(String(w.location).toLowerCase())) score+=4;
  if(w.developer_id && p.developer_id===w.developer_id) score+=3;
  return {...p,matchScore:score};
 }).sort((a:any,b:any)=>b.matchScore-a.matchScore||a.name.localeCompare(b.name)).slice(0,20);
 return NextResponse.json({workOrder:w,providers:matches,connected:true});
}
