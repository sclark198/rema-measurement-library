import {submissions,normalize,moderation} from './_shared.mjs';
export default async ()=>{try{const [raw,states]=await Promise.all([submissions(),moderation()]);const resources=raw.map(normalize).filter(x=>states[x.id]!=='hidden'&&states[x.id]!=='deleted');return Response.json({resources},{headers:{'cache-control':'no-store'}})}catch(e){return Response.json({error:e.message},{status:503})}}
