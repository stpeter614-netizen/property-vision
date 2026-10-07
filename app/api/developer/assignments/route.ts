import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function db(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const auth=request.headers.get('authorization');
 if(!url||!key||!auth?.startsWith('Bearer '))return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
}
export async function POST(request:Request){
 const client=db(request); if(!client)return NextResponse.json({error:'Authentication required.'},{status:401});
 const {data:u}=await client.auth.getUser(); if(!u.user)return NextResponse.json({error:'Authentication required.'},{status:401});
 let body:any; try{body=await request.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
 if(typeof body?.workOrderId!=='string'||!UUID.test(body.workOrderId)||typeof body?.providerId!=='string'||!UUID.test(body.providerId))
  return NextResponse.json({error:'Valid work order and provider IDs are required.'},{status:400});
 const {data,error}=await client.from('property_work_order_assignments').insert({work_order_id:body.workOrderId,provider_id:body.providerId,status:'proposed'}).select('id,work_order_id,provider_id,status,created_at').single();
 if(error||!data)return NextResponse.json({error:'Unable to create provider assignment.'},{status:400});
 return NextResponse.json({assignment:data,connected:true},{status:201});
}
export async function GET(request:Request){
 const client=db(request); if(!client)return NextResponse.json({error:'Authentication required.'},{status:401});
 const {data:u}=await client.auth.getUser(); if(!u.user)return NextResponse.json({error:'Authentication required.'},{status:401});
 const id=new URL(request.url).searchParams.get('workOrderId')||'';
 if(!UUID.test(id))return NextResponse.json({error:'Valid work order ID is required.'},{status:400});
 const {data,error}=await client.from('property_work_order_assignments').select('id,work_order_id,provider_id,status,scheduled_at,completed_at,created_at,updated_at').eq('work_order_id',id).order('created_at',{ascending:false});
 if(error)return NextResponse.json({error:'Unable to load assignments.'},{status:400});
 return NextResponse.json({assignments:data||[],connected:true});
}
export async function PATCH(request:Request){
 const client=db(request); if(!client)return NextResponse.json({error:'Authentication required.'},{status:401});
 const {data:u}=await client.auth.getUser(); if(!u.user)return NextResponse.json({error:'Authentication required.'},{status:401});
 let body:any; try{body=await request.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
 const id=String(body.assignmentId||''); const scheduledAt=String(body.scheduledAt||'');
 if(!UUID.test(id))return NextResponse.json({error:'Valid assignment ID is required.'},{status:400});
 const date=new Date(scheduledAt); if(!scheduledAt||Number.isNaN(date.getTime()))return NextResponse.json({error:'Valid scheduled date/time is required.'},{status:400});
 const {data:assignment,error}=await client.from('property_work_order_assignments').update({status:'scheduled',scheduled_at:date.toISOString(),updated_at:new Date().toISOString()}).eq('id',id).select('id,work_order_id,provider_id,status,scheduled_at,completed_at,created_at,updated_at').single();
 if(error||!assignment)return NextResponse.json({error:'Unable to schedule assignment.'},{status:400});
 return NextResponse.json({assignment});
}
