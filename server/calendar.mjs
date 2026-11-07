export function dateDay(value){
 const match=/^(\d{4})(\d{2})(\d{2})$/.exec(value);
 if(!match)throw Error('Unsupported calendar date');
 const iso=`${match[1]}-${match[2]}-${match[3]}`;
 if(new Date(iso+'T00:00:00Z').toISOString().slice(0,10)!==iso)throw Error('Invalid date');
 return iso;
}
export function parseCalendar(text){
 if(!text.includes('BEGIN:VCALENDAR')||!text.includes('END:VCALENDAR'))throw Error('Invalid calendar');
 const blocks=[]; let event;
 for(const line of text.replace(/\r?\n[ \t]/g,'').split(/\r?\n/)){
  if(line==='BEGIN:VEVENT')event={};
  else if(line==='END:VEVENT'){
   if(event&&event.STATUS!=='CANCELLED'){
    if(!event.DTSTART||!event.DTEND)throw Error('Missing dates');
    const start=dateDay(event.DTSTART),end=dateDay(event.DTEND);
    if(end<=start)throw Error('Invalid interval');
    blocks.push({start,end});
   } event=null;
  }else if(event){const split=line.indexOf(':'); if(split>0){const key=line.slice(0,split).split(';')[0];if(['DTSTART','DTEND','STATUS'].includes(key))event[key]=line.slice(split+1);}}
 }
 return blocks.sort((a,b)=>a.start.localeCompare(b.start));
}
export function overlaps(start,end,blocks){return blocks.some(b=>start<b.end&&end>b.start);}
export function makeCalendar(blocks){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//COZY676//Direct bookings//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:COZY676 direct bookings'];
 for(const b of blocks){const a=b.start.replaceAll('-',''),z=b.end.replaceAll('-','');lines.push('BEGIN:VEVENT',`UID:cozy676-${a}-${z}@cozy676-mokpo.onrender.com`,'DTSTAMP:20261107T000000Z',`DTSTART;VALUE=DATE:${a}`,`DTEND;VALUE=DATE:${z}`,'SUMMARY:Unavailable','STATUS:CONFIRMED','END:VEVENT');}
 return lines.concat('END:VCALENDAR','').join('\r\n');
}
