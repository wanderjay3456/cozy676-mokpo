import http from 'node:http';
import {parseCalendar} from './calendar.mjs';
const origins=new Set(['https://cozy676-mokpo.onrender.com','http://127.0.0.1:8768']);
let cache,pending;
async function getAvailability(){
 if(cache&&Date.now()-cache.time<60000)return cache.value;
 if(pending)return pending;
 pending=(async()=>{
  const url=new URL(process.env.AIRBNB_ICAL_URL);
  if(!['ko.airbnb.com','www.airbnb.com'].includes(url.hostname)||url.protocol!=='https:'||!url.pathname.startsWith('/calendar/ical/'))throw Error('Configuration');
  const result=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!result.ok)throw Error('Upstream unavailable');
  const text=await result.text();if(text.length>2000000)throw Error('Oversized feed');
  const blocks=parseCalendar(text);
  const direct=await fetch('https://raw.githubusercontent.com/wanderjay3456/cozy676-mokpo/main/direct-bookings.ics',{signal:AbortSignal.timeout(10000)});
  if(!direct.ok)throw Error('Direct calendar unavailable');
  blocks.push(...parseCalendar(await direct.text()));
  const value={updatedAt:new Date().toISOString(),blocks:blocks.sort((a,b)=>a.start.localeCompare(b.start)),mode:'ical',confirmationRequired:true};
  cache={time:Date.now(),value};return value;
 })().finally(()=>{pending=null;});return pending;
}
http.createServer(async(req,res)=>{
 const origin=req.headers.origin;if(origins.has(origin))res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Vary','Origin');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 if(req.url==='/health'){res.end('{"ok":true}');return;}
 if(req.method!=='GET'||req.url?.split('?')[0]!=='/availability'){res.statusCode=404;res.end('{"error":"not_found"}');return;}
 try{res.end(JSON.stringify(await getAvailability()));}catch{res.statusCode=503;res.end('{"error":"calendar_unavailable","confirmationRequired":true}');}
}).listen(Number(process.env.PORT)||10000,'0.0.0.0');
