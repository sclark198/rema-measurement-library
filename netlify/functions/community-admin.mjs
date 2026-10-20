import {getStore} from '@netlify/blobs';
const store=()=>getStore('rema-community');
export default async req=>{
 if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 try{const {password,resourceId,commentId,action}=await req.json();
 if(!process.env.REMA_ADMIN_PASSWORD||password!==process.env.REMA_ADMIN_PASSWORD)return Response.json({error:'Unauthorized'},{status:401});
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(resourceId||''))return Response.json({error:'Invalid resource'},{status:400});
 const key='resource-'+resourceId;const record=JSON.parse(await store().get(key)||'{"comments":[],"votes":[]}');
 if(action==='list')return Response.json({comments:record.comments});
 if(!['hide','restore','delete'].includes(action))return Response.json({error:'Invalid action'},{status:400});
 const c=record.comments.find(c=>c.id===commentId);if(!c)return Response.json({error:'Comment not found'},{status:404});
 if(action==='delete')record.comments=record.comments.filter(c=>c.id!==commentId);else c.hidden=action==='hide';
 await store().set(key,JSON.stringify(record));return Response.json({ok:true});
 }catch{return Response.json({error:'Request failed'},{status:500})}
};
