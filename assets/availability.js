import {koreaToday} from './inquiry-core.mjs';
const form=document.getElementById('inquiry-form'), en=document.documentElement.lang!=='ko';
const t=(ko,english)=>en?english:ko;
const box=document.createElement('div');box.className='availability-box';
box.innerHTML=`<p class="availability-status" role="status">${t('예약 일정을 확인하고 있습니다…','Checking the booking calendar…')}</p><div class="calendar-controls"><button type="button" data-prev aria-label="${t('이전 달','Previous month')}">←</button><strong data-month></strong><button type="button" data-next aria-label="${t('다음 달','Next month')}">→</button></div><table class="availability-calendar"><caption class="visually-hidden">${t('예약 불가일 안내','Unavailable nights')}</caption><thead><tr>${(en?['Su','Mo','Tu','We','Th','Fr','Sa']:['일','월','화','수','목','금','토']).map(d=>`<th scope="col">${d}</th>`).join('')}</tr></thead><tbody></tbody></table><p class="calendar-legend">${t('빗금 표시: 예약 불가 · 빈 날짜도 호스트 확인 후 확정됩니다.','Struck-through dates: unavailable. All other dates require host confirmation.')}</p>`;
form.querySelector('.date-fields').before(box);
const status=box.querySelector('[role=status]'),body=box.querySelector('tbody');
let data, failure=false;const today=koreaToday();let month=new Date(today.slice(0,7)+'-01T00:00:00Z');const firstMonth=new Date(month);
const busy=(start,end)=>data?.blocks.some(b=>start<b.end&&end>b.start);
function render(){
 box.querySelector('[data-month]').textContent=new Intl.DateTimeFormat(en?'en-US':'ko-KR',{year:'numeric',month:'long',timeZone:'UTC'}).format(month);
 const y=month.getUTCFullYear(),m=month.getUTCMonth(),offset=month.getUTCDay(),last=new Date(Date.UTC(y,m+1,0)).getUTCDate();let markup='';
 for(let row=0;row<6;row++){markup+='<tr>';for(let col=0;col<7;col++){
  const day=row*7+col-offset+1;
  if(day<1||day>last){markup+='<td></td>';continue;}
  const date=new Date(Date.UTC(y,m,day)).toISOString().slice(0,10),end=new Date(Date.UTC(y,m,day+1)).toISOString().slice(0,10);
  const blocked=date<today||busy(date,end);markup+=`<td class="${blocked?'unavailable':''}" aria-label="${date} ${blocked?t('예약 불가','unavailable'):t('호스트 확인 필요','host confirmation required')}">${day}</td>`;
 }markup+='</tr>';}
 body.innerHTML=markup;
 box.querySelector('[data-prev]').disabled=month<=firstMonth;
 box.querySelector('[data-next]').disabled=month>=new Date(Date.UTC(firstMonth.getUTCFullYear(),firstMonth.getUTCMonth()+11,1));
}
async function refresh(){
 try{
  const config=await fetch('/assets/calendar-config.json',{cache:'no-store'}).then(r=>r.json());if(!config.endpoint)throw Error();
  const response=await fetch(config.endpoint,{cache:'no-store',signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error();
  const value=await response.json();if(!Array.isArray(value.blocks)||!Number.isFinite(Date.parse(value.updatedAt))||Date.now()-Date.parse(value.updatedAt)>300000)throw Error();
  if(!value.blocks.every(b=>/^\d{4}-\d{2}-\d{2}$/.test(b.start)&&/^\d{4}-\d{2}-\d{2}$/.test(b.end)&&b.end>b.start))throw Error();
  data=value;failure=false;
  status.textContent=t('예약 일정 확인: ','Calendar checked: ')+new Intl.DateTimeFormat(en?'en-GB':'ko-KR',{timeZone:'Asia/Seoul',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value.updatedAt))+' (KST)';
 }catch{data=null;failure=true;status.textContent=t('지금은 자동 일정을 확인할 수 없습니다. 위 WhatsApp 연락처로 예약 가능 여부를 확인해주세요.','The calendar cannot be checked right now. Please contact the host using the WhatsApp number above.');}
 render();
}
box.querySelector('[data-prev]').addEventListener('click',()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1));render();});
box.querySelector('[data-next]').addEventListener('click',()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1));render();});
function guard(event){
 const start=form.elements.checkin.value,end=form.elements.checkout.value;
 if(!start||!end||end<=start)return;
 let message;
 if(!data||Date.now()-Date.parse(data.updatedAt)>300000){message=failure?t('자동 일정 확인에 실패했습니다. WhatsApp 연락처로 직접 문의해주세요.','Calendar unavailable. Please contact the WhatsApp number directly.'):t('예약 일정을 확인 중입니다. 잠시 후 다시 눌러주세요.','Checking the calendar. Please try again shortly.');if(data)refresh();}
 else if(busy(start,end))message=t('선택한 기간에 예약 불가일이 포함되어 있습니다. 다른 날짜를 선택해주세요.','Your selected stay includes unavailable nights. Please choose different dates.');
 if(message){event.preventDefault();event.stopImmediatePropagation();document.getElementById('inquiry-status').textContent=message;}
}
form.addEventListener('submit',guard,true);document.getElementById('copy-enquiry').addEventListener('click',guard,true);
render();refresh();setInterval(refresh,240000);
