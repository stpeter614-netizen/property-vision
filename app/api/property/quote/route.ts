import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function db(request:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 return createClient(url,key,{global:{headers:{Authorization:request.headers.get('authorization')||''}}});
}
async function auth(request:NextRequest){
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/i.test(authorization))return {error:NextResponse.json({error:'Authentication required.'},{status:401})};
 const client=db(request);
 if(!client)return {error:NextResponse.json({error:'Database connection is not configured.'},{status:503})};
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)return {error:NextResponse.json({error:'Authentication required.'},{status:401})};
 return {client};
}
export async function GET(request:NextRequest){
 const checked=await auth(request); if('error'in checked)return checked.error;
 const id=new URL(request.url).searchParams.get('workOrderId')||'';
 if(!UUID.test(id))return NextResponse.json({error:'A valid work order ID is required.'},{status:400});
 const {client}=checked;
 const {data:estimate,error}=await client.from('property_estimates')
  .select('id,work_order_id,currency,subtotal_cents,labour_cents,other_cents,total_cents,status,responded_at,responded_by,created_at,updated_at')
  .eq('work_order_id',id).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(error)return NextResponse.json({error:'Unable to load quote.'},{status:500});
 if(!estimate)return NextResponse.json({estimate:null,lines:[]});
 const {data:lines,error:lineError}=await client.from('property_estimate_lines')
  .select('id,description,quantity,unit,unit_price_cents,line_total_cents,line_type')
  .eq('estimate_id',estimate.id).order('id');
 if(lineError)return NextResponse.json({error:'Unable to load quote lines.'},{status:500});
 return NextResponse.json({estimate,lines:lines||[]});
}
export async function POST(request:NextRequest){
 const checked=await auth(request); if('error'in checked)return checked.error;
 const {client}=checked;
 let body:any;
 try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON request.'},{status:400});}
 const estimateId=typeof body?.estimateId==='string'?body.estimateId:'';
 const response=typeof body?.response==='string'?body.response:'';
 if(!UUID.test(estimateId))return NextResponse.json({error:'A valid estimate ID is required.'},{status:400});
 if(!['approved','rejected'].includes(response))return NextResponse.json({error:'Response must be approved or rejected.'},{status:400});
 const {data,error}=await client.rpc('property_respond_to_estimate',{p_estimate_id:estimateId,p_response:response});
 if(error)return NextResponse.json({error:'Unable to record quote response.'},{status:409});
 return NextResponse.json({estimate:data?.[0]||data||null,connected:true});
}
