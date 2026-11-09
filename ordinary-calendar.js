// Calendario Visita / Trasferimento / Trasporto semplice / Dimissione — amministrazione e centralino
let ordCursor=new Date(),ordDay=todaySafe(),ordItems=[],ordCrew=[],ordEligible=new Map(),ordSeq=0,ordBusy=false;
const ordRoles=[['AUTISTA','Autista'],['CAPO_SERVIZIO','Capo servizio'],['SOCCORRITORE','Soccorritore'],['SECONDO_SOCCORRITORE','Secondo soccorritore'],['ACCOMPAGNATORE','Accompagnatore'],['AFFIANCATO','Affiancato']];
function ordType(value){
 const t=String(value||'').trim().toLocaleUpperCase('it-IT');
 return t==='VISITA'?'VISITA':t==='TRASFERIMENTO'?'TRASFERIMENTO':
 t==='DIMISSIONE'?'DIMISSIONE':
 (t==='TRASPORTO SEMPLICE'||t.startsWith('TRASPORTO SEMPLICE '))?'TRASPORTO SEMPLICE':'';
}
function ordVisible(){
 const filter=$('ordTypeFilter').value;
 return ordItems.filter(s=>!filter||ordType(s.tipo_servizio)===filter);
}
function ordStatus(s,crew){
 const n=Number(s.equipaggio_minimo)>0?Number(s.equipaggio_minimo):(String(s.mezzo||'')==='06'?1:2);
 const driver=crew.some(x=>x.ruolo==='AUTISTA'),capo=!s.capo_servizio_obbligatorio||crew.some(x=>x.ruolo==='CAPO_SERVIZIO');
 const ok=crew.length>=n&&driver&&capo;
 return {ok,label:ok?'Equipaggio minimo presente':'Da completare · '+crew.length+'/'+n+(!driver?' · manca autista':'')+(!capo?' · manca capo servizio':'')};
}
function ordDraw(){
 const r=calVisibleRange(ordCursor,'month'),items=ordVisible();
 $('ordTitle').textContent=calMonthTitle(ordCursor);
 let html='';
 for(let i=0;i<r.cells;i++){
  const date=new Date(r.start);date.setDate(r.start.getDate()+i);
  const day=calYmd(date),services=items.filter(s=>s.data_servizio===day);
  const ok=services.every(s=>ordStatus(s,ordCrew.filter(x=>x.servizio_id===s.id)).ok);
  html+='<button type="button" class="dim-date ord-date '+(date.getMonth()!==ordCursor.getMonth()?'dim-out ':'')+
   (day===todaySafe()?'dim-today ':'')+(day===ordDay?'dim-selected':'')+
   '" data-ord-day="'+day+'"><b>'+date.getDate()+'</b><small>'+
   (services.length?'🚐 '+services.length+' <span class="dim-dot '+(ok?'ok':'partial')+'"></span>':'')+'</small>'+
   services.slice(0,2).map(s=>'<small class="ord-day-label">'+esc(ordType(s.tipo_servizio)==='TRASPORTO SEMPLICE'?'Trasporto semplice':s.tipo_servizio)+'</small>').join('')+
   '</button>';
 }
 $('ordGrid').innerHTML=html;
 $('ordGrid').querySelectorAll('[data-ord-day]').forEach(b=>b.onclick=()=>{
  ordDay=b.dataset.ordDay;ordDraw();
 });
 ordDrawDay();
}
function ordDrawDay(){
 $('ordDayTitle').textContent='Servizi ordinari · '+dimDayTitle(ordDay);
 const services=ordVisible().filter(s=>s.data_servizio===ordDay)
  .sort((a,b)=>String(a.ora_partenza_prevista||'99:99').localeCompare(String(b.ora_partenza_prevista||'99:99')));
 $('ordDayList').innerHTML=services.length?services.map(s=>{
  const crew=ordCrew.filter(x=>x.servizio_id===s.id),st=ordStatus(s,crew);
  const editable=s.data_servizio>=todaySafe()&&!['ANNULLATO','CHIUSO','TERMINATO','DA CONTABILIZZARE'].includes(String(s.stato_gestionale||'').toUpperCase());
  const names=crew.length?crew.map(x=>{
   const name=people.find(p=>p.badge===x.badge_personale)?.nome_completo||x.badge_personale;
   return '<div class="dim-person">• '+esc(name)+' · '+esc(ordRoles.find(r=>r[0]===x.ruolo)?.[1]||x.ruolo)+
    (editable?'<button type="button" class="btn danger" style="padding:3px 7px;margin-left:6px" data-ord-remove="'+esc(x.id)+'">Rimuovi</button>':'')+
    '</div>';
  }).join(''):'<div class="muted">Nessun componente assegnato.</div>';
  const patient=[s.paziente_nome,s.paziente_cognome].filter(Boolean).join(' ');
  return '<div class="dim-slot ord-card" data-ord-id="'+esc(s.id)+'"><b>🚐 '+esc(s.tipo_servizio)+'</b> '+
   '<span class="pill '+(st.ok?'g':'')+'">'+esc(st.label)+'</span>'+
   '<div class="muted">Partenza: '+esc(s.luogo_partenza||'—')+' → '+esc(s.destinazione||s.ospedale_destinazione||'—')+
   ' · Mezzo '+esc(s.mezzo||'—')+'</div>'+
   (patient?'<div class="muted">Paziente: '+esc(patient)+'</div>':'')+
   '<div class="muted">Orari: partenza '+esc(calTime(s.ora_partenza_prevista)||'—')+
   ' · arrivo '+esc(calTime(s.ora_arrivo_destinazione_prevista)||'—')+
   ' · rientro '+esc(calTime(s.ora_rientro_previsto)||'—')+'</div>'+names+
   '<div class="actions" style="margin-top:8px">'+
   (editable?'<button class="btn yellow" type="button" data-ord-add="'+esc(s.id)+'">✚ Aggiungi componente</button>':'')+
   '<button class="btn secondary" type="button" data-ord-open="'+esc(s.id)+'">Apri servizio</button></div>'+
   '<div class="ord-editor" id="ordEditor-'+esc(s.id)+'"></div></div>';
 }).join(''):'<div class="notice">Nessun servizio ordinario programmato per questo giorno. Per crearne uno scegli «Nuovo servizio».</div>';
 $('ordDayList').querySelectorAll('[data-ord-add]').forEach(b=>b.onclick=()=>ordOpen(b.dataset.ordAdd));
 $('ordDayList').querySelectorAll('[data-ord-remove]').forEach(b=>b.onclick=()=>ordRemoveAssignment(b.dataset.ordRemove));
 $('ordDayList').querySelectorAll('[data-ord-open]').forEach(b=>b.onclick=()=>openService(b.dataset.ordOpen));
}
async function loadOrdinaryCalendar(){
 if(!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
 const seq=++ordSeq,r=calVisibleRange(ordCursor,'month');
 msg('ordMsg','Caricamento servizi ordinari...');
 const response=await sb.from('servizi_giornalieri')
  .select('id,data_servizio,tipo_servizio,paziente_nome,paziente_cognome,luogo_partenza,destinazione,ospedale_destinazione,mezzo,ora_partenza_prevista,ora_arrivo_destinazione_prevista,ora_rientro_previsto,equipaggio_minimo,capo_servizio_obbligatorio,stato,stato_gestionale,appuntamenti_visite,updated_at')
  .gte('data_servizio',r.startYmd).lte('data_servizio',r.endYmd)
  .order('data_servizio').order('ora_partenza_prevista').limit(2000);
 if(seq!==ordSeq)return;
 if(response.error){ordItems=[];ordCrew=[];ordDraw();return msg('ordMsg',response.error.message,'err')}
 const services=(response.data||[]).filter(s=>ordType(s.tipo_servizio)&&
   String(s.stato||'').toUpperCase()!=='ANNULLATO'&&String(s.stato_gestionale||'').toUpperCase()!=='ANNULLATO');
 const cr=services.length?await sb.from('servizi_equipaggio')
  .select('id,servizio_id,badge_personale,ruolo').in('servizio_id',services.map(s=>s.id)):
  {data:[],error:null};
 if(seq!==ordSeq)return;
 if(cr.error)return msg('ordMsg','Errore lettura equipaggi: '+cr.error.message,'err');
 ordItems=services;ordCrew=cr.data||[];ordEligible.clear();
 ordDraw();msg('ordMsg','');
}
async function ordOpen(id){
 const s=ordItems.find(x=>x.id===id&&x.data_servizio===ordDay),box=$('ordEditor-'+id);
 if(!s||!box||!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
 if(box.innerHTML.trim()){box.innerHTML='';return}
 box.innerHTML='<div class="muted">Caricamento operatori abilitati...</div>';
 let available=ordEligible.get(s.data_servizio);
 if(!available){
  const r=await sb.rpc('cge_ordinari_abilitati',{p_giorno:s.data_servizio});
  if(!document.getElementById('ordEditor-'+id))return;
  if(r.error){box.innerHTML='<div class="notice err">'+esc(r.error.message)+'</div>';return}
  available=r.data||[];ordEligible.set(s.data_servizio,available);
 }
 const crew=ordCrew.filter(x=>x.servizio_id===id);
 const roles=ordRoles.filter(([role])=>available.some(p=>p.ruolo===role)&&!crew.some(p=>p.ruolo===role));
 if(!roles.length){box.innerHTML='<div class="notice warn">Nessun ruolo libero con operatori qualificati.</div>';return}
 box.innerHTML='<div class="ord-editor-inner"><div class="field"><label>Ruolo</label><select data-ord-role>'+
  roles.map(([r,name])=>'<option value="'+esc(r)+'">'+esc(name)+'</option>').join('')+
  '</select></div><div class="field"><label>Categoria personale</label><select data-ord-category><option value="VOLONTARIO">Volontari</option><option value="DIPENDENTE">Dipendenti</option></select></div><div class="field"><label>Operatore</label><select data-ord-badge></select></div>'+
  '<div class="actions"><button class="btn yellow" type="button" data-ord-confirm>Assegna definitivamente</button>'+
  '<button class="btn secondary" type="button" data-ord-close>Chiudi</button></div><div data-ord-feedback></div></div>';
 box.querySelector('[data-ord-role]').onchange=()=>ordChoices(id);
 box.querySelector('[data-ord-category]').onchange=()=>ordChoices(id);
 box.querySelector('[data-ord-confirm]').onclick=()=>ordAssign(id);
 box.querySelector('[data-ord-close]').onclick=()=>{box.innerHTML=''};
 ordChoices(id);
}
function ordChoices(id){
 const s=ordItems.find(x=>x.id===id),box=$('ordEditor-'+id);
 if(!s||!box)return;
 const select=box.querySelector('[data-ord-badge]'),role=box.querySelector('[data-ord-role]')?.value,dep=box.querySelector('[data-ord-category]')?.value==='DIPENDENTE';
 if(!select)return;
 const taken=new Set(ordCrew.filter(x=>x.servizio_id===id).map(x=>x.badge_personale));
 const options=(ordEligible.get(s.data_servizio)||[]).filter(x=>x.ruolo===role&&!taken.has(x.badge)&&cgeIsEmployee(people.find(p=>p.badge===x.badge))===dep)
  .sort((a,b)=>String(a.badge).localeCompare(String(b.badge),'it',{numeric:true}));
 select.innerHTML='<option value="">Scegli '+(dep?'dipendente':'volontario')+'</option>'+
  options.map(x=>'<option value="'+esc(x.badge)+'">'+esc(x.nome_completo+' · badge '+x.badge)+'</option>').join('');
}
async function ordAssign(id){
 if(ordBusy||!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
 const s=ordItems.find(x=>x.id===id&&x.data_servizio===ordDay),box=$('ordEditor-'+id);
 if(!s||!box)return;
 const role=box.querySelector('[data-ord-role]')?.value,badge=box.querySelector('[data-ord-badge]')?.value;
 const member=(ordEligible.get(s.data_servizio)||[]).find(x=>x.ruolo===role&&x.badge===badge);
 if(!member)return msg('ordMsg','Seleziona un operatore qualificato.','warn');
 if(!confirm('Assegnare definitivamente '+member.nome_completo+' come '+
   (ordRoles.find(x=>x[0]===role)?.[1]||role)+' al servizio '+s.tipo_servizio+
   ' del '+s.data_servizio+'?'))return;
 ordBusy=true;const button=box.querySelector('[data-ord-confirm]');if(button)button.disabled=true;
 try{
  const r=await sb.rpc('cge_ordinari_assegna',{p_servizio:id,p_badge:badge,p_ruolo:role});
  if(r.error)throw r.error;
  await loadOrdinaryCalendar();
  msg('ordMsg','Operatore assegnato definitivamente al servizio.','ok');
 }catch(e){
  const feedback=box.querySelector('[data-ord-feedback]');
  if(feedback)feedback.innerHTML='<div class="notice err">'+esc(e.message||String(e))+'</div>';
  else msg('ordMsg',e.message||String(e),'err');
 }finally{ordBusy=false;const btn=$('ordEditor-'+id)?.querySelector('[data-ord-confirm]');if(btn)btn.disabled=false}
}
async function ordRemoveAssignment(id){
 if(ordBusy||!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
 const row=ordCrew.find(x=>x.id===id);
 if(!row)return msg('ordMsg','Componente non trovato. Aggiorna il calendario.','warn');
 const service=ordItems.find(x=>x.id===row.servizio_id);
 if(!service)return msg('ordMsg','Servizio non trovato. Aggiorna il calendario.','warn');
 const name=people.find(p=>p.badge===row.badge_personale)?.nome_completo||row.badge_personale;
 const role=ordRoles.find(r=>r[0]===row.ruolo)?.[1]||row.ruolo;
 if(!confirm('Rimuovere '+name+' ('+role+') dall’equipaggio del servizio '+service.tipo_servizio+' del '+service.data_servizio+'?'))return;
 ordBusy=true;msg('ordMsg','Rimozione componente in corso...');
 try{
  const r=await sb.from('servizi_equipaggio').delete().eq('id',id).eq('servizio_id',row.servizio_id);
  if(r.error)throw r.error;
  await loadOrdinaryCalendar();
  msg('ordMsg','Componente rimosso. Puoi assegnare subito la persona o il ruolo corretto.','ok');
 }catch(e){msg('ordMsg',e.message||String(e),'err')}
 finally{ordBusy=false}
}

function ordMove(n){
 if(n===0){ordCursor=new Date();ordDay=todaySafe()}
 else{ordCursor=new Date(ordCursor.getFullYear(),ordCursor.getMonth()+n,1);ordDay=calYmd(ordCursor)}
 loadOrdinaryCalendar();
}
$('ordPrev').onclick=()=>ordMove(-1);$('ordNext').onclick=()=>ordMove(1);
$('ordToday').onclick=()=>ordMove(0);$('ordRefresh').onclick=loadOrdinaryCalendar;
$('ordTypeFilter').onchange=ordDraw;


// Gestione degli equipaggi ordinari direttamente nel Calendario servizi.
// Riutilizza le RPC di verifica qualifiche e assegnazione del modulo ordinari.
let calOrdBusy=false;
function calOrdService(id){
 return opCalEvents.find(e=>e.kind==='service'&&String(e.raw.id)===String(id))?.raw||null;
}
async function calOrdOpen(id){
 const service=calOrdService(id),box=$('calOrdEditor-'+id);
 if(!service||!box||calOrdBusy||!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
 if(box.dataset.open==='true'){box.innerHTML='';box.dataset.open='false';return}
 box.dataset.open='true';
 box.innerHTML='<div class="muted">Verifica qualifiche disponibili...</div>';
 const r=await sb.rpc('cge_ordinari_abilitati',{p_giorno:service.data_servizio});
 if(!box.isConnected||box.dataset.open!=='true')return;
 if(r.error){box.innerHTML='<div class="notice err">'+esc(r.error.message)+'</div>';return}
 const eligible=r.data||[],crew=service.assignments||[];
 const roles=ordRoles.filter(([role])=>eligible.some(p=>p.ruolo===role)&&!crew.some(p=>p.ruolo===role));
 if(!roles.length){box.innerHTML='<div class="notice warn">Nessun ruolo disponibile con operatori qualificati.</div>';return}
 box.innerHTML='<div class="ord-editor-inner"><div class="field"><label>Ruolo</label><select data-cal-ord-role>'+
  roles.map(([role,name])=>'<option value="'+esc(role)+'">'+esc(name)+'</option>').join('')+
  '</select></div><div class="field"><label>Categoria personale</label><select data-cal-ord-category><option value="VOLONTARIO">Volontari</option><option value="DIPENDENTE">Dipendenti</option></select></div><div class="field"><label>Operatore qualificato</label><select data-cal-ord-person></select></div>'+
  '<div class="actions"><button type="button" class="btn yellow" data-cal-ord-confirm>Assegna definitivamente</button>'+
  '<button type="button" class="btn secondary" data-cal-ord-close>Chiudi</button></div><div data-cal-ord-msg></div></div>';
 const roleSelect=box.querySelector('[data-cal-ord-role]'),personSelect=box.querySelector('[data-cal-ord-person]'),categorySelect=box.querySelector('[data-cal-ord-category]');
 const choices=()=>{
  const taken=new Set(crew.map(x=>x.badge_personale));
  const selected=eligible.filter(p=>p.ruolo===roleSelect.value&&!taken.has(p.badge)&&cgeIsEmployee(people.find(x=>x.badge===p.badge))===(categorySelect.value==='DIPENDENTE'));
  personSelect.innerHTML='<option value="">Seleziona '+(categorySelect.value==='DIPENDENTE'?'dipendente':'volontario')+'</option>'+selected.map(p=>'<option value="'+esc(p.badge)+'">'+esc(p.nome_completo||p.badge)+'</option>').join('');
  box.querySelector('[data-cal-ord-confirm]').disabled=!selected.length;
 };
 roleSelect.onchange=choices;categorySelect.onchange=choices;choices();
 box.querySelector('[data-cal-ord-close]').onclick=()=>{box.innerHTML='';box.dataset.open='false'};
 box.querySelector('[data-cal-ord-confirm]').onclick=async()=>{
  const role=roleSelect.value,badge=personSelect.value;
  const member=eligible.find(p=>p.ruolo===role&&p.badge===badge);
  if(!member||calOrdBusy)return;
  if(cgeIsEmployee(people.find(x=>x.badge===badge))!==(categorySelect.value==='DIPENDENTE'))return;
  if(!confirm('Assegnare definitivamente '+member.nome_completo+' come '+(ordRoles.find(x=>x[0]===role)?.[1]||role)+' al servizio del '+service.data_servizio+'?'))return;
  calOrdBusy=true;box.querySelector('[data-cal-ord-confirm]').disabled=true;
  try{
   const result=await sb.rpc('cge_ordinari_assegna',{p_servizio:service.id,p_badge:badge,p_ruolo:role});
   if(result.error)throw result.error;
   await loadOperationalCalendar();
   msg('calMsg','Operatore assegnato al servizio.','ok');
  }catch(error){
   const dest=box.querySelector('[data-cal-ord-msg]');
   if(dest)dest.innerHTML='<div class="notice err">'+esc(error.message||String(error))+'</div>';
   else msg('calMsg',error.message||String(error),'err');
  }finally{calOrdBusy=false;const button=box.querySelector('[data-cal-ord-confirm]');if(button)button.disabled=false}
 };
}
async function calOrdRemove(assignmentId,serviceId){
 const service=calOrdService(serviceId);
 const member=service?.assignments?.find(x=>String(x.id)===String(assignmentId));
 if(!member||calOrdBusy||!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
 if(!confirm('Rimuovere '+(people.find(p=>p.badge===member.badge_personale)?.nome_completo||member.badge_personale)+' dall’equipaggio del servizio del '+service.data_servizio+'?'))return;
 calOrdBusy=true;
 try{
  const r=await sb.from('servizi_equipaggio').delete().eq('id',assignmentId).eq('servizio_id',serviceId);
  if(r.error)throw r.error;
  await loadOperationalCalendar();
  msg('calMsg','Componente rimosso dall’equipaggio.','ok');
 }catch(e){msg('calMsg','Rimozione non riuscita: '+(e.message||String(e)),'err')}
 finally{calOrdBusy=false}
}


// Prenotazioni multiple: una richiesta, un servizio indipendente per ciascuna visita.
// Il riferimento di gruppo non modifica fogli viaggio, numerazione o contabilita.
(function(){
  if(typeof document==='undefined')return;
  const byId=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let saving=false;
  const today=()=>new Date().toLocaleDateString('en-CA');
  const row=(i,d='',h='09:00',dest='')=>'<div class="cge-multi-row" style="display:grid;grid-template-columns:1fr 1fr 2fr auto;gap:8px;align-items:end;margin:8px 0">'+
   '<label>Data '+i+'<input type="date" required class="multi-date" min="'+today()+'" value="'+safe(d)+'"></label>'+
   '<label>Ora visita<input type="time" required class="multi-time" value="'+safe(h)+'"></label>'+
   '<label>Destinazione / reparto<input required maxlength="250" class="multi-dest" value="'+safe(dest)+'" placeholder="Ospedale e reparto"></label>'+
   '<button type="button" class="btn secondary multi-remove">Rimuovi</button></div>';
  function open(){
   if(!['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))return;
   byId('cgeMultiDialog')?.remove();
   const dialog=document.createElement('dialog');dialog.id='cgeMultiDialog';
   dialog.style.cssText='border:2px solid #e2bb00;border-radius:12px;max-width:870px;width:94%;max-height:90vh;overflow:auto;padding:22px;background:#fff;color:#153152;box-shadow:0 18px 55px #0005';
   dialog.innerHTML='<form id="cgeMultiForm" style="display:grid;gap:10px">'+
    '<h2 style="margin:0;color:#123b72">Prenotazioni multiple paziente</h2>'+
    '<p class="muted">Inserisci il paziente una sola volta e aggiungi le singole visite. Ogni data crea un servizio separato nel Calendario servizi.</p>'+
    '<div style="background:#eef3fb;padding:12px;border-radius:9px"><label style="display:block;font-weight:700">Cerca paziente già registrato<input type="search" id="cgeMultiPatientSearch" autocomplete="off" placeholder="Digita cognome, nome oppure codice fiscale" style="width:100%"></label>'+
    '<div id="cgeMultiPatientResults" role="status" aria-live="polite" style="margin-top:7px">Cerca un paziente esistente oppure compila i dati per un nuovo paziente.</div>'+
    '<div id="cgeMultiPatientSelected" style="font-weight:700;color:#123b72"></div></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
    '<label>Nome paziente<input name="nome" required maxlength="120"></label>'+
    '<label>Cognome paziente<input name="cognome" required maxlength="120"></label>'+
    '<label>Telefono<input name="telefono" type="tel" maxlength="50"></label>'+
    '<label>Mezzo da programmare<select name="mezzo" required><option value="">Seleziona mezzo</option><option>06</option><option>07</option><option>08</option><option>09</option></select></label>'+
    '<label>Luogo di partenza<input name="partenza" required maxlength="250" placeholder="Indirizzo carico paziente"></label>'+
    '<label>Tipo servizio<select name="tipo"><option value="VISITA">Visita</option><option value="TRASPORTO SEMPLICE">Trasporto semplice</option><option value="TRASFERIMENTO">Trasferimento</option></select></label></div>'+
    '<label>Note comuni (facoltative)<textarea name="note" rows="2" maxlength="1500"></textarea></label>'+
    '<h3 style="margin:5px 0 0">Appuntamenti</h3><div id="cgeMultiRows">'+row(1,today())+row(2)+'</div>'+
    '<div class="actions"><button type="button" class="btn secondary" id="cgeMultiAdd">+ Aggiungi visita</button></div>'+
    '<div id="cgeMultiFeedback" role="status" aria-live="polite"></div>'+
    '<div class="actions"><button type="submit" class="btn yellow" id="cgeMultiSave">Salva tutte le visite</button><button type="button" class="btn secondary" id="cgeMultiClose">Chiudi</button></div></form>';
   document.body.append(dialog);
   const rows=byId('cgeMultiRows'),feedback=byId('cgeMultiFeedback');
   let chosenPatient=null,searchSerial=0;
   const searchInput=byId('cgeMultiPatientSearch');
   const results=byId('cgeMultiPatientResults');
   const clearChosen=()=>{chosenPatient=null;byId('cgeMultiPatientSelected').textContent='';};
   const patientFields=['nome','cognome','telefono'];
   const setPatient=p=>{
     chosenPatient=p;
     for(const field of patientFields)byId('cgeMultiForm').elements[field].value=p[field]||'';
     if(p.indirizzo)byId('cgeMultiForm').elements.partenza.value=p.indirizzo;
     byId('cgeMultiPatientSelected').textContent='Paziente selezionato: '+p.cognome+' '+p.nome;
     results.replaceChildren();
   };
   for(const field of patientFields)byId('cgeMultiForm').elements[field].addEventListener('input',clearChosen);
   let debounce=null;
   searchInput.addEventListener('input',()=>{
     clearTimeout(debounce);
     const search=searchInput.value.trim();
     const serial=++searchSerial;
     if(search.length<2){results.textContent='Digita almeno 2 caratteri per cercare.';return}
     results.textContent='Ricerca paziente...';
     debounce=setTimeout(async()=>{
       try{
         const escaped=search.replace(/[,%()]/g,' ').trim();
         if(!escaped){results.textContent='Inserisci un nome o cognome valido.';return}
         const q=sb.from('anagrafica_pazienti')
           .select('id,nome,cognome,codice_fiscale,data_nascita,telefono,indirizzo,email')
           .or('nome.ilike.%'+escaped+'%,cognome.ilike.%'+escaped+'%,codice_fiscale.ilike.%'+escaped+'%')
           .order('cognome').order('nome').limit(30);
         const response=await q;
         if(serial!==searchSerial||!dialog.isConnected)return;
         if(response.error)throw response.error;
         const patients=response.data||[];
         results.replaceChildren();
         if(!patients.length){results.textContent='Nessun paziente trovato. Puoi compilare i dati manualmente.';return}
         const heading=document.createElement('div');heading.textContent=patients.length+' pazienti trovati — selezionane uno:';results.append(heading);
         for(const p of patients){
           const button=document.createElement('button');
           button.type='button';button.className='btn secondary';
           button.style.cssText='display:block;width:100%;text-align:left;margin:4px 0;padding:8px';
           button.textContent=[p.cognome,p.nome,p.data_nascita?'nato/a '+p.data_nascita:'',p.codice_fiscale||''].filter(Boolean).join(' · ');
           button.onclick=()=>setPatient(p);
           results.append(button);
         }
       }catch(err){if(serial===searchSerial)results.textContent='Errore ricerca pazienti: '+(err.message||String(err));}
     },250);
   });
   rows.onclick=e=>{if(e.target.closest('.multi-remove')&&rows.children.length>1){e.target.closest('.cge-multi-row').remove();}};
   byId('cgeMultiAdd').onclick=()=>{
    if(rows.children.length>=30)return feedback.textContent='Massimo 30 appuntamenti per richiesta.';
    const div=document.createElement('div');div.innerHTML=row(rows.children.length+1);
    rows.appendChild(div.firstElementChild);
   };
   byId('cgeMultiClose').onclick=()=>{if(!saving)dialog.close()};
   dialog.addEventListener('close',()=>dialog.remove());
   byId('cgeMultiForm').onsubmit=async e=>{
    e.preventDefault();if(saving)return;
    const form=e.currentTarget,fd=new FormData(form);
    const visits=[...rows.querySelectorAll('.cge-multi-row')].map(x=>({
     date:x.querySelector('.multi-date').value,
     time:x.querySelector('.multi-time').value,
     dest:x.querySelector('.multi-dest').value.trim()
    }));
    if(!visits.length||visits.some(v=>!v.date||!v.time||!v.dest))return feedback.textContent='Completa data, ora e destinazione per ogni visita.';
    if(visits.some(v=>v.date<today()))return feedback.textContent='Non inserire appuntamenti nel passato.';
    if(new Set(visits.map(v=>v.date+'|'+v.time+'|'+v.dest.toLowerCase())).size!==visits.length)
     return feedback.textContent='Una visita risulta duplicata: correggi data, ora o destinazione.';
    if(!confirm('Creare '+visits.length+' servizi distinti per '+fd.get('nome')+' '+fd.get('cognome')+'?'))return;
    const group='MULTI-'+crypto.randomUUID();
    const common={paziente_id:chosenPatient?.id||null,paziente_nome:String(fd.get('nome')).trim(),paziente_cognome:String(fd.get('cognome')).trim(),
      telefono:String(fd.get('telefono')||'').trim()||null,
      ...(chosenPatient?{codice_fiscale:chosenPatient.codice_fiscale||null,data_nascita:chosenPatient.data_nascita||null,paziente_indirizzo:chosenPatient.indirizzo||null,paziente_email:chosenPatient.email||null}:{}),
      mezzo:fd.get('mezzo'),tipo_servizio:fd.get('tipo'),
      luogo_partenza:String(fd.get('partenza')).trim(),riferimento_richiesta:group,
      note:String(fd.get('note')||'').trim()||null,stato:'DA ESEGUIRE',stato_gestionale:'DA ASSEGNARE',
      equipaggio_minimo:fd.get('mezzo')==='06'?1:2};
    const payload=visits.map(v=>({...common,data_servizio:v.date,ora_appuntamento_prevista:v.time,
      ora_prevista:v.time,destinazione:v.dest}));
    saving=true;byId('cgeMultiSave').disabled=true;feedback.textContent='Salvataggio in corso...';
    try{
     const result=await sb.from('servizi_giornalieri').insert(payload).select('id,data_servizio');
     if(result.error)throw result.error;
     if((result.data||[]).length!==payload.length)throw Error('Numero di servizi restituiti non corrispondente: verifica prima di riprovare.');
     dialog.close();
     if(typeof loadOperationalCalendar==='function')await loadOperationalCalendar();
     if(typeof loadOrdinaryCalendar==='function')await loadOrdinaryCalendar();
     if(typeof msg==='function'&&byId('calMsg'))msg('calMsg',visits.length+' visite create correttamente. Ogni servizio e modificabile singolarmente.','ok');
    }catch(error){feedback.textContent='Salvataggio non riuscito: '+(error.message||String(error))+'. Nessun tentativo automatico di reinvio.';}
    finally{saving=false;const btn=byId('cgeMultiSave');if(btn)btn.disabled=false;}
   };
   dialog.showModal();
  }
  function attach(){
   const anchor=byId('calMsg');
   if(!anchor||byId('cgeMultiOpen'))return;
   const b=document.createElement('button');b.id='cgeMultiOpen';b.type='button';
   b.className='btn yellow';b.style.margin='8px 8px 8px 0';
   b.textContent='＋ Prenotazioni multiple paziente';b.onclick=open;
   anchor.parentElement.insertBefore(b,anchor);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);
  else attach();
})();

// Carica il modulo aggiuntivo per più appuntamenti nello stesso trasporto.
(function(){const sc=document.createElement('script');sc.src='visite-stesso-trasporto.js?v=20261103-5';document.body.appendChild(sc);})();
