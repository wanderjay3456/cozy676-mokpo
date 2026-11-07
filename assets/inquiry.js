import {koreaToday,dayNumber,validateStay,buildMessage,whatsappLink,KAKAO_ID} from './inquiry-core.mjs';
const form=document.getElementById('inquiry-form');
const en=document.documentElement.lang!=='ko';
const t=(ko,english)=>en?english:ko;
const checkin=form.elements.checkin, checkout=form.elements.checkout;
const status=document.getElementById('inquiry-status');
const preview=document.getElementById('message-preview'), messageBox=document.getElementById('inquiry-message');
const errors={dates:t('체크인과 체크아웃 날짜를 선택해주세요.','Choose check-in and check-out dates.'),past:t('한국 날짜 기준 오늘 이후를 선택해주세요.','Choose today or a later date in Korea.'),length:t('숙박 기간은 1박~365박으로 선택해주세요.','Choose a stay of 1 to 365 nights.'),guests:t('숙박 인원은 1~3명입니다.','Select 1 to 3 guests.'),eligibility:t('외국인 관광객 대상 숙소 안내를 확인해주세요.','Please confirm the foreign tourist eligibility notice.')};
checkin.min=koreaToday(); checkout.min=koreaToday();
const read=()=>({checkin:checkin.value,checkout:checkout.value,guests:Number(form.elements.guests.value),eligible:document.getElementById('eligible').checked,note:form.elements.note.value});
function duration(){
  const n=dayNumber(checkout.value)-dayNumber(checkin.value);
  document.getElementById('stay-duration').textContent=Number.isFinite(n)&&n>0?t(`${n}박 · 최종 요금은 문의 후 안내합니다.`,`${n} night${n===1?'':'s'} · Request your final quote.`):t('여행 날짜를 선택해주세요.','Choose your travel dates.');
}
checkin.addEventListener('change',()=>{
  if(checkin.value){const d=new Date(checkin.value+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);checkout.min=d.toISOString().slice(0,10);if(checkout.value&&checkout.value<=checkin.value)checkout.value='';} else checkout.min=koreaToday();
  duration();
});checkout.addEventListener('change',duration);
function prepare(){
  status.textContent='';
  if(!form.reportValidity())return null;
  const stay=read(),result=validateStay(stay);
  if(result.error){status.textContent=errors[result.error];return null;}
  const message=buildMessage(stay,en?'en':'ko');messageBox.value=message;preview.hidden=false;return message;
}
async function copy(text,success){
  try{await navigator.clipboard.writeText(text);status.textContent=success;}
  catch{messageBox.value=text;preview.hidden=false;messageBox.focus();messageBox.select();status.textContent=t('아래 내용을 선택해 직접 복사해주세요.','Select and copy the text below.');}
}
form.addEventListener('submit',event=>{
  event.preventDefault();const message=prepare();if(!message)return;
  window.open(whatsappLink(message),'_blank','noopener,noreferrer');
  status.textContent=t('WhatsApp에서 내용을 확인한 후 전송해주세요. 아직 예약은 확정되지 않았습니다.','Review and send your message in WhatsApp. Your booking is not confirmed yet.');
});
document.getElementById('copy-enquiry').addEventListener('click',()=>{const message=prepare();if(message)copy(message,t('문의 내용을 복사했습니다. 카카오톡에서 J0_01을 찾아 붙여넣고 전송해주세요.','Enquiry copied. Find J0_01 in KakaoTalk, paste it and send.'));});
document.getElementById('copy-kakao-id').addEventListener('click',()=>copy(KAKAO_ID,t('카카오톡 아이디 J0_01을 복사했습니다.','KakaoTalk ID J0_01 copied.')));
