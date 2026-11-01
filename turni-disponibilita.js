// Croce Gialla Emergenza — pannello unificato turni e disponibilità.
// Conserva le tabelle, i moduli e le autorizzazioni originali.
(function(){
'use strict';
const $id=id=>document.getElementById(id);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=t=>String(t||'').slice(0,5);
const isNight=(a,b)=>b<=a;
const range=(date,start,end)=>{
 const a=new Date(date+'T'+short(start)+':00'),b=new Date(date+'T'+short(end)+':00');
 if(isNaN(a)||isNaN(b))return null;
 if(b<=a)b.setDate(b.getDate()+1);
 return {start:a,end:b};
};
const intersect=(a,b)=>a&&b&&a.start<b.end&&a.end>b.start;
const keyDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const getName=badge=>(people||[]).find(p=>String(p.badge)===String(badge))?.nome_completo||badge;
let tab='riepilogo',busy=false;
let currentPersonnel=[];
async function tdLoadPersonnel(){
 const r=await sb.from('personale').select('badge,nome_completo,attivo,stato_anagrafico,data_uscita,dipendente').order('nome_completo');
 if(r.error)throw r.error;
 currentPersonnel=r.data||[];
 return currentPersonnel;
}
const tdIsActive=p=>p?.attivo===true&&String(p?.stato_anagrafico||'').trim().toUpperCase()==='ATTIVO'&&!p?.data_uscita;
async function tdFilterAssignmentChoices(){
 const rows=await tdLoadPersonnel(),allowed=new Set(rows.filter(tdIsActive).map(p=>String(p.badge)));
 for(const id of ['shiftPerson','avp']){
  const sel=$id(id);if(!sel)continue;
  [...sel.options].forEach(opt=>{if(opt.value&&!allowed.has(String(opt.value)))opt.remove()});
 }
}

const shift=$id('shifts'),availability=$id('availability');
if(!shift||!availability)return;
const content=shift.querySelector(':scope > .pad');
const availabilityContent=availability.querySelector(':scope > .pad');
if(!content||!availabilityContent)return;
const shiftPanel=document.createElement('div');
shiftPanel.id='tdTurniPanel';
while(content.firstChild)shiftPanel.append(content.firstChild);
const crewSection=$id('crew'),crewContent=crewSection?.querySelector(':scope > .pad');
if(!crewContent)return;
const crewPanel=document.createElement('div');
crewPanel.id='tdEquipaggiPanel';
while(crewContent.firstChild)crewPanel.append(crewContent.firstChild);
crewPanel.classList.add('hidden');
// La vecchia sezione resta nel DOM per compatibilità; il contenuto operativo viene spostato.
const crewNav=document.querySelector('.nav[data-v="crew"]');
if(crewNav)crewNav.remove();
const availabilityPanel=document.createElement('div');
availabilityPanel.id='tdDisponibilitaPanel';
while(availabilityContent.firstChild)availabilityPanel.append(availabilityContent.firstChild);
const summaryPanel=document.createElement('div');
summaryPanel.id='tdRiepilogoPanel';
summaryPanel.innerHTML='<div class="section"><div class="actions" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><h3 style="margin:0">📅 Situazione del giorno</h3><div class="actions"><label for="tdDate">Data</label><input type="date" id="tdDate"><button type="button" id="tdRefresh" class="btn secondary">↻ Aggiorna</button></div></div><p class="muted">Disponibile: dichiarazione registrata. Da verificare: nessuna dichiarazione. La copertura del 118 resta nel suo turnario dedicato.</p><div id="tdMsg"></div><div id="tdResult" class="grid2"></div><div class="actions" style="margin-top:12px"><button type="button" class="btn secondary" data-td-tab="turni">✚ Gestisci turni</button><button type="button" class="btn secondary" data-td-tab="disponibilita">✚ Registra disponibilità</button><button type="button" class="btn secondary" id="td118">🚨 Turnario 118</button></div></div>';
const coverageSection=document.createElement('div');
coverageSection.className='section';
coverageSection.innerHTML='<div class="actions" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><div><h3 style="margin:0">🚑 Copertura servizi del giorno</h3><div class="muted" id="tdCoverageStats">Seleziona una giornata per controllare le coperture.</div></div><div class="actions"><button type="button" id="tdOnlyIncomplete" class="btn yellow">Da completare</button><button type="button" id="tdAllServices" class="btn secondary">Tutti i servizi</button></div></div><div id="tdCoverage"></div>';
summaryPanel.firstElementChild.append(coverageSection);
const header=shift.querySelector(':scope > .hero');
header.innerHTML='<h2>🕒 Turni, disponibilità ed equipaggi</h2><p>Un unico punto di accesso per programmazione, operatori, coperture e assegnazioni ai servizi.</p><div class="actions" id="tdTabs"><button type="button" data-td-tab="riepilogo" class="btn yellow">📅 Riepilogo e coperture</button><button type="button" data-td-tab="turni" class="btn secondary">🕒 Gestione turni</button><button type="button" data-td-tab="disponibilita" class="btn secondary">👥 Disponibilità volontari</button><button type="button" data-td-tab="equipaggi" class="btn secondary">🚑 Equipaggi servizi</button></div>';
content.append(summaryPanel,shiftPanel,availabilityPanel,crewPanel);
shiftPanel.classList.add('hidden');
availabilityPanel.classList.add('hidden');
const crewTools=document.createElement('div');
crewTools.className='actions';
crewTools.style.margin='0 0 12px';
crewTools.innerHTML='<button type="button" class="btn secondary" id="tdCrewCalendar">📅 Apri Calendario servizi</button><span class="muted">Qui si assegnano gli operatori ai singoli servizi, non ai turni generali.</span>';
crewPanel.prepend(crewTools);
$id('tdCrewCalendar').onclick=()=>window.view('calendar');
availability.remove();
const nav=document.querySelector('.nav[data-v="availability"]');
if(nav)nav.remove();
const shiftsNav=document.querySelector('.nav[data-v="shifts"]');
if(shiftsNav)shiftsNav.textContent='🕒 Turni, disponibilità ed equipaggi';
const oldView=window.view;
async function open(tabName){
 tab=['riepilogo','turni','disponibilita','equipaggi'].includes(tabName)?tabName:'riepilogo';
 summaryPanel.classList.toggle('hidden',tab!=='riepilogo');
 shiftPanel.classList.toggle('hidden',tab!=='turni');
 availabilityPanel.classList.toggle('hidden',tab!=='disponibilita');
 crewPanel.classList.toggle('hidden',tab!=='equipaggi');
 document.querySelectorAll('#tdTabs [data-td-tab]').forEach(b=>b.className='btn '+(b.dataset.tdTab===tab?'yellow':'secondary'));
 if(tab==='riepilogo')await loadDay();
 if(tab==='turni'&&typeof loadShifts==='function'){await loadShifts();try{await tdFilterAssignmentChoices()}catch(e){console.warn('Filtro personale:',e.message)}}
 if(tab==='disponibilita'&&typeof loadAvailability==='function'){await loadAvailability();try{await tdFilterAssignmentChoices()}catch(e){console.warn('Filtro personale:',e.message)}}
 if(tab==='equipaggi'&&typeof loadCrew==='function')await loadCrew();
}
const existingView=typeof oldView==='function'?oldView:null;
if(existingView){
 window.view=async function(v,options){
  if(v==='crew'){
   const result=await existingView('shifts',options);
   await open('equipaggi');
   return result;
  }
  if(v==='availability'){
   const result=await existingView('shifts',options);
   await open('disponibilita');
   return result;
  }
  const result=await existingView(v,options);
  if(v==='shifts')await open(tab);
  return result;
 };
}
document.querySelectorAll('[data-td-tab]').forEach(b=>b.addEventListener('click',()=>void open(b.dataset.tdTab)));
async function tdOpenCrew(serviceId){
 if(typeof window.view==='function')await window.view('shifts');
 await open('equipaggi');
 if(serviceId&&typeof loadCrew==='function')await loadCrew(serviceId);
}
window.cgeOpenUnifiedCrew=tdOpenCrew;
$id('td118').onclick=()=>window.view('emergency');
$id('tdDate').value=typeof todaySafe==='function'?todaySafe():keyDate(new Date());
$id('tdDate').onchange=()=>void loadDay();
$id('tdRefresh').onclick=()=>void loadDay();
$id('tdOnlyIncomplete').onclick=()=>{tdCoverageFilter='incomplete';$id('tdOnlyIncomplete').className='btn yellow';$id('tdAllServices').className='btn secondary';renderServiceCoverage()};
$id('tdAllServices').onclick=()=>{tdCoverageFilter='all';$id('tdOnlyIncomplete').className='btn secondary';$id('tdAllServices').className='btn yellow';renderServiceCoverage()};
async function loadDay(){
 const day=$id('tdDate').value;if(!day)return;
 $id('tdMsg').textContent='Caricamento…';
 const start=new Date(day+'T00:00:00'),end=new Date(start);end.setDate(end.getDate()+1);
 const [turns,allAvail,personnel]=await Promise.all([
  sb.from('v_turni_gestionale').select('id,data_turno,ora_inizio,ora_fine,tipo_turno,mezzo,equipaggio').eq('data_turno',day).order('ora_inizio'),
  sb.from('disponibilita_personale').select('badge_personale,tipo,inizio,fine').lt('inizio',end.toISOString()).gt('fine',start.toISOString()),
  sb.from('personale').select('badge,nome_completo,attivo,stato_anagrafico,data_uscita,dipendente').order('nome_completo')
 ]);
 if(turns.error||allAvail.error||personnel.error){$id('tdMsg').textContent='Errore lettura: '+escapeHtml((turns.error||allAvail.error||personnel.error).message);return}
 currentPersonnel=personnel.data||[];
 const list=turns.data||[],avail=allAvail.data||[];
 const shiftsHtml=list.map(t=>{
  const members=Array.isArray(t.equipaggio)?t.equipaggio:[];
  const min=String(t.mezzo)==='06'?1:2;
  const assigned=members.filter(m=>m.risposta!=='NON DISPONIBILE');
  const full=assigned.length>=min&&assigned.some(m=>m.ruolo==='AUTISTA');
  const names=members.map(m=>escapeHtml(m.nome||m.badge||m.badge_personale)+' ('+escapeHtml(m.ruolo||'—')+')').join(', ');
  return '<div class="section" style="padding:12px;margin:7px 0"><b>'+escapeHtml(short(t.ora_inizio))+'–'+escapeHtml(short(t.ora_fine))+' · '+escapeHtml(t.tipo_turno||'Turno')+' · M'+escapeHtml(t.mezzo||'—')+'</b> <span class="pill '+(full?'g':'r')+'">'+(full?'Copertura base':'Da completare/verificare')+'</span><div class="muted">'+(names||'Nessun operatore assegnato')+'</div></div>';
 }).join('')||'<div class="notice">Nessun turno generale registrato per questo giorno.</div>';
 const activeRows=currentPersonnel.filter(p=>tdIsActive(p)&&p.dipendente!==true);
 const ceasedRows=currentPersonnel.filter(p=>!tdIsActive(p)&&p.dipendente!==true);
 const peopleList=activeRows.map(p=>{
  const rows=avail.filter(a=>String(a.badge_personale)===String(p.badge)),no=rows.some(a=>String(a.tipo).toUpperCase()==='INDISPONIBILE'),yes=rows.some(a=>String(a.tipo).toUpperCase()==='DISPONIBILE');
  return {name:p.nome_completo||p.badge,state:no?'Non disponibile':yes?'Disponibile':'Da verificare',cls:no?'r':yes?'g':''};
 }).sort((a,b)=>a.name.localeCompare(b.name,'it'));
 const ceasedHtml=ceasedRows.map(p=>'<div style="padding:7px;border-bottom:1px solid #dae3ec">'+escapeHtml(p.nome_completo||p.badge)+' <span class="pill r">CESSATO</span> <small>'+escapeHtml(p.data_uscita||'')+'</small></div>').join('');
 const peopleHtml=peopleList.map(p=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:8px;border-bottom:1px solid #dae3ec"><span>'+escapeHtml(p.name)+'</span><span class="pill '+p.cls+'">'+p.state+'</span></div>').join('')||'<div class="notice">Elenco personale non caricato.</div>';
 $id('tdResult').innerHTML='<div class="section"><h3>🕒 Turni generali · '+list.length+'</h3>'+shiftsHtml+'</div><div class="section"><h3>👥 Volontari attivi · '+activeRows.length+'</h3><div class="muted">Solo volontari attivi. Senza dichiarazione: da verificare.</div><div style="max-height:420px;overflow:auto">'+peopleHtml+'</div><details style="margin-top:12px"><summary>📁 Volontari cessati · '+ceasedRows.length+' (solo consultazione)</summary><div>'+ (ceasedHtml||'Nessuno') +'</div></details></div>';
 $id('tdMsg').textContent='';
 await loadServiceCoverage(day);
}
let tdCoverageList=[],tdCoverageFilter='incomplete';
async function loadServiceCoverage(day){
 const target=$id('tdCoverage');
 if(!target)return;
 target.innerHTML='<div class="notice">Controllo servizi e assegnazioni in corso…</div>';
 const serviceR=await sb.from('servizi_giornalieri')
  .select('id,data_servizio,ora_partenza_prevista,mezzo,tipo_servizio,tipo_servizio_altro,stato_gestionale,equipaggio_minimo,capo_servizio_obbligatorio')
  .eq('data_servizio',day).neq('stato_gestionale','ANNULLATO').order('ora_partenza_prevista');
 if(serviceR.error){target.textContent='Impossibile caricare i servizi: '+serviceR.error.message;return}
 const services=(serviceR.data||[]).filter(s=>!['ANNULLATO','CANCELLATO','CHIUSO','COMPLETATO'].includes(String(s.stato_gestionale||'').toUpperCase())&&!['118','EMERGENZA'].includes(String(s.tipo_servizio||'').toUpperCase()));
 let rows=[];
 if(services.length){
  const crewR=await sb.from('servizi_equipaggio').select('servizio_id,badge_personale,ruolo').in('servizio_id',services.map(x=>x.id));
  if(crewR.error){target.textContent='Impossibile caricare gli equipaggi: '+crewR.error.message;return}
  rows=crewR.data||[];
 }
 tdCoverageList=services.map(s=>{
  const members=rows.filter(x=>String(x.servizio_id)===String(s.id));
  const minimum=Number(s.equipaggio_minimo)>0?Number(s.equipaggio_minimo):(String(s.mezzo)==='06'?1:2);
  const hasDriver=members.some(m=>m.ruolo==='AUTISTA');
  const hasCapo=members.some(m=>m.ruolo==='CAPO_SERVIZIO');
  const enough=members.length>=minimum&&hasDriver&&(!s.capo_servizio_obbligatorio||hasCapo);
  return {service:s,members,minimum,enough};
 });
 renderServiceCoverage();
}
function renderServiceCoverage(){
 const out=$id('tdCoverage');if(!out)return;
 const incomplete=tdCoverageList.filter(x=>!x.enough),complete=tdCoverageList.filter(x=>x.enough);
 const shown=tdCoverageFilter==='incomplete'?incomplete:tdCoverageList;
 $id('tdCoverageStats').textContent=tdCoverageList.length+' servizi · '+incomplete.length+' da completare · '+complete.length+' con requisiti base presenti';
 out.innerHTML=shown.map(x=>{
  const s=x.service,crew=x.members;
  const members=crew.map(m=>escapeHtml(getName(m.badge_personale))+' ('+escapeHtml(m.ruolo)+')').join(', ')||'Nessun operatore assegnato';
  const missing=[];
  if(crew.length<x.minimum)missing.push('minimo '+x.minimum+' operatori');
  if(!crew.some(m=>m.ruolo==='AUTISTA'))missing.push('autista');
  if(s.capo_servizio_obbligatorio&&!crew.some(m=>m.ruolo==='CAPO_SERVIZIO'))missing.push('capo servizio');
  return '<div class="section" style="margin:8px 0;padding:12px"><div class="actions" style="justify-content:space-between;align-items:center"><div><b>'+escapeHtml(short(s.ora_partenza_prevista)||'Orario da definire')+' · Mezzo '+escapeHtml(s.mezzo||'—')+' · '+escapeHtml(s.tipo_servizio_altro||s.tipo_servizio||'Servizio')+'</b><div class="muted">'+escapeHtml(members)+'</div><small class="muted">'+(x.enough?'Requisiti numerici/ruoli base presenti; verificare comunque qualifiche e altri impegni.':'Da verificare: '+escapeHtml(missing.join(', ')))+'</small></div><button type="button" class="btn '+(x.enough?'secondary':'yellow')+'" data-td-service="'+escapeHtml(s.id)+'">Gestisci equipaggio</button></div></div>';
 }).join('')||'<div class="notice">'+(tdCoverageFilter==='incomplete'?'Nessun servizio da completare tra quelli caricati.':'Nessun servizio da mostrare.')+'</div>';
 out.querySelectorAll('[data-td-service]').forEach(b=>b.onclick=()=>void tdOpenCrew(b.dataset.tdService));
}
 // Pre-verifica dell'assegnazione ai turni generali, senza aggirare i permessi del backend.
// Blocca conflitti accertati e lascia espliciti i controlli 118/qualifiche da completare.
const assignBtn=$id('shiftAdd');
if(assignBtn)assignBtn.onclick=async()=>{
 if(busy)return;
 const shiftId=$id('shiftSel').value,badge=$id('shiftPerson').value,role=$id('shiftRole').value;
 if(!shiftId||!badge)return;
 busy=true;assignBtn.disabled=true;
 try{
  const [sr,own,others,personCheck]=await Promise.all([
   sb.from('turni').select('id,data_turno,ora_inizio,ora_fine').eq('id',shiftId).single(),
   sb.from('turni_personale').select('turno_id,ruolo').eq('badge_personale',badge).limit(1000),
   sb.from('disponibilita_personale').select('inizio,fine,tipo').eq('badge_personale',badge).limit(2000),
   sb.from('personale').select('badge,attivo,stato_anagrafico,data_uscita').eq('badge',badge).single()
  ]);
  if(sr.error||own.error||others.error||personCheck.error)throw sr.error||own.error||others.error||personCheck.error;
  if(!tdIsActive(personCheck.data)){alert('Assegnazione bloccata: operatore cessato o non attivo.');return}
  const t=sr.data,slot=range(t.data_turno,t.ora_inizio,t.ora_fine);
  if(!slot)throw new Error('Orari del turno non validi.');
  if((own.data||[]).some(x=>String(x.turno_id)===String(shiftId))){alert('Questo operatore è già assegnato al turno.');return}
  const ids=[...new Set((own.data||[]).map(x=>x.turno_id).filter(Boolean))];
  if(ids.length){
   const current=await sb.from('turni').select('id,data_turno,ora_inizio,ora_fine').in('id',ids);
   if(current.error)throw current.error;
   if((current.data||[]).some(x=>intersect(slot,range(x.data_turno,x.ora_inizio,x.ora_fine)))){alert('Assegnazione bloccata: operatore già impegnato in un turno sovrapposto.');return}
  }
  const overlaps=(others.data||[]).filter(x=>intersect(slot,{start:new Date(x.inizio),end:new Date(x.fine)}));
  if(overlaps.some(x=>String(x.tipo).toUpperCase()==='INDISPONIBILE')){alert('Assegnazione bloccata: il volontario ha dichiarato indisponibilità in questa fascia.');return}
  const declared=overlaps.some(x=>String(x.tipo).toUpperCase()==='DISPONIBILE');
  const note=declared?'Disponibilità dichiarata.':'Nessuna disponibilità dichiarata per questa fascia.';
  if(!confirm(note+'\nControlla inoltre qualifiche, altri servizi e turnario 118: questa verifica non sostituisce tali controlli.\nConfermi l’assegnazione di '+getName(badge)+'?'))return;
  const out=await sb.from('turni_personale').insert({turno_id:shiftId,badge_personale:badge,ruolo:role});
  if(out.error)throw out.error;
  if(typeof msg==='function')msg('shiftmsg','Operatore assegnato.','ok');
  await loadShifts();
 }catch(e){if(typeof msg==='function')msg('shiftmsg','Assegnazione non riuscita: '+(e.message||String(e)),'err')}
 finally{busy=false;assignBtn.disabled=false}
};
window.cgeTurniUnificati={open,loadDay,loadServiceCoverage,tdOpenCrew};
})();