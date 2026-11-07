export const WHATSAPP_NUMBER = '821023156004';
export const KAKAO_ID = 'J0_01';
export function koreaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now);
  const value = type => parts.find(p=>p.type===type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function dayNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const n = Date.parse(value+'T00:00:00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0,10)===value ? n/86400000 : NaN;
}
export function validateStay({checkin,checkout,guests,eligible},today=koreaToday()) {
  const a=dayNumber(checkin), b=dayNumber(checkout), nights=b-a;
  if (!Number.isFinite(a)||!Number.isFinite(b)) return {error:'dates'};
  if (a<dayNumber(today)) return {error:'past'};
  if (nights<1||nights>365) return {error:'length'};
  if (![1,2,3].includes(Number(guests))) return {error:'guests'};
  if (!eligible) return {error:'eligibility'};
  return {nights};
}
export function buildMessage(stay,lang='en') {
  const nights=dayNumber(stay.checkout)-dayNumber(stay.checkin);
  const en=lang!=='ko';
  const lines=en ? ['Hello, I would like to enquire about COZY676 in Mokpo.',`Check-in: ${stay.checkin}`,`Check-out: ${stay.checkout}`,`Nights: ${nights}`,`Total guests: ${stay.guests}`,'I understand this property is for foreign tourists.','Please confirm availability, the total price including all charges and applicable discounts, payment instructions and cancellation terms.'] : ['안녕하세요. 목포 COZY676 숙박 문의드립니다.',`체크인: ${stay.checkin}`,`체크아웃: ${stay.checkout}`,`숙박: ${nights}박`,`총 인원: ${stay.guests}명`,'외국인 관광객 대상 숙소임을 확인했습니다.','예약 가능 여부, 날짜별 요금과 할인이 반영된 총금액, 결제 방법 및 취소 조건을 안내해주세요.'];
  if(stay.note?.trim()) lines.push((en?'Additional question: ':'추가 문의: ')+stay.note.trim().slice(0,500));
  lines.push(en?'This message is an enquiry, not a confirmed booking.':'이 메시지는 예약 확정이 아닌 숙박 문의입니다.');
  return lines.join('\n');
}
export function whatsappLink(message) {return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;}
