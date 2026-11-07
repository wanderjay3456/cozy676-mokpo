import fs from 'node:fs';
import {parseCalendar,makeCalendar,overlaps} from '../server/calendar.mjs';
const action=process.env.BOOKING_ACTION,start=process.env.CHECKIN,end=process.env.CHECKOUT;
let blocks=JSON.parse(fs.readFileSync('direct-bookings.json','utf8'));
if(action!=='refresh'){
 const asDay=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Use YYYY-MM-DD');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)throw Error('Invalid date');return n/86400000;};
 const nights=asDay(end)-asDay(start);if(nights<1||nights>365)throw Error('Stay must be 1–365 nights');
 if(action==='hold'){
  if(!process.env.AIRBNB_ICAL_URL)throw Error('Airbnb connection is missing');
  const r=await fetch(process.env.AIRBNB_ICAL_URL,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Airbnb calendar cannot be verified');
  if(overlaps(start,end,parseCalendar(await r.text()))||overlaps(start,end,blocks))throw Error('Selected dates are already unavailable. Check Airbnb before confirming.');
  blocks.push({start,end});
 }else if(action==='release'){
  if(!blocks.some(b=>b.start===start&&b.end===end))throw Error('Exact date range not found');
  blocks=blocks.filter(b=>b.start!==start||b.end!==end);
 }else throw Error('Invalid action');
}
blocks.sort((a,b)=>a.start.localeCompare(b.start));
fs.writeFileSync('direct-bookings.json',JSON.stringify(blocks,null,2)+'\n');
fs.writeFileSync('direct-bookings.ics',makeCalendar(blocks));
console.log('Direct booking calendar updated. Airbnb imports are delayed; verify the block on Airbnb before confirming payment.');
