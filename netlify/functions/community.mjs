import {getStore} from '@netlify/blobs';
import {createHash,randomUUID} from 'node:crypto';
const data=()=>getStore('rema-community');
const limit=()=>getStore('rema-community-limits');
const json=(obj,status=200)=>Response.json(obj,{status,headers:{'cache-control':'no-store'}});
const hash=s=>createHash('sha256').update(s).digest('hex');
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(id);
const trim=(x,max)=>typeof x==='string'?x.trim().slice(0,max):'';
const read=async id=>JSON.parse(await data().get('resource-'+id)||'{"comments":[],"votes":[]}');
export default async req=>{
 try{
  if(req.method!=='GET'&&req.method!=='POST')return json({error:'Method not allowed'},405);
  const url=new URL(req.url);const body=req.method==='POST'?await req.json():{};
  const id=req.method==='GET'?url.searchParams.get('id'):body.id;
  if(!validId(id))return json({error:'Invalid resource'},400);
  const record=await read(id);
  if(req.method==='GET')return json({comments:record.comments.filter(x=>!x.hidden).map(({id,name,text,created_at})=>({id,name,text,created_at})),votes:record.votes.length});
  const ip=req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
  const fingerprint=hash(ip+'|'+(req.headers.get('user-agent')||'')+'|rema');
  if(body.action==='comment'){
    if(body.website)return json({ok:true}); // honeypot
    const name=trim(body.name,100),text=trim(body.text,2000);
    if(name.length<2||text.length<5||text.length>2000||body.text?.length>2000)return json({error:'Please provide your name and a comment of 5–2000 characters.'},400);
    const key='comment-'+fingerprint;const prev=Number(await limit().get(key)||0);
    if(Date.now()-prev<60000)return json({error:'Please wait one minute before commenting again.'},429);
    await limit().set(key,String(Date.now()));
    record.comments.push({id:randomUUID(),name,text,created_at:new Date().toISOString(),hidden:false});
    await data().set('resource-'+id,JSON.stringify(record));return json({ok:true});
  }
  if(body.action==='vote'){
    const key='vote-'+id+'-'+fingerprint;
    if(await limit().get(key))return json({error:'A helpful vote has already been recorded from this visitor.'},409);
    await limit().set(key,'1');record.votes.push(hash(fingerprint+'|'+id));
    await data().set('resource-'+id,JSON.stringify(record));return json({ok:true,votes:record.votes.length});
  }
  return json({error:'Invalid action'},400);
 }catch(e){return json({error:'Unable to process request. Please try again.'},500)}
};
