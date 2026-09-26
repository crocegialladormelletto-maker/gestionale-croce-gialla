// Calendario Visita / Trasferimento / Trasporto semplice — amministrazione e centralino
let ordCursor=new Date(),ordDay=todaySafe(),ordItems=[],ordCrew=[],ordEligible=new Map(),ordSeq=0,ordBusy=false;
const ordRoles=[['AUTISTA','Autista'],['CAPO_SERVIZIO','Capo servizio'],['SOCCORRITORE','Soccorritore'],['SECONDO_SOCCORRITORE','Secondo soccorritore'],['ACCOMPAGNATORE','Accompagnatore'],['AFFIANCATO','Affiancato']];
function ordType(value){
 const t=String(value||'').trim().toLocaleUpperCase('it-IT');
 return t==='VISITA'?'VISITA':t==='TRASFERIMENTO'?'TRASFERIMENTO':
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
  .select('id,data_servizio,tipo_servizio,paziente_nome,paziente_cognome,luogo_partenza,destinazione,ospedale_destinazione,mezzo,ora_partenza_prevista,ora_arrivo_destinazione_prevista,ora_rientro_previsto,equipaggio_minimo,capo_servizio_obbligatorio,stato,stato_gestionale')
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
  '</select></div><div class="field"><label>Operatore</label><select data-ord-badge></select></div>'+
  '<div class="actions"><button class="btn yellow" type="button" data-ord-confirm>Assegna definitivamente</button>'+
  '<button class="btn secondary" type="button" data-ord-close>Chiudi</button></div><div data-ord-feedback></div></div>';
 box.querySelector('[data-ord-role]').onchange=()=>ordChoices(id);
 box.querySelector('[data-ord-confirm]').onclick=()=>ordAssign(id);
 box.querySelector('[data-ord-close]').onclick=()=>{box.innerHTML=''};
 ordChoices(id);
}
function ordChoices(id){
 const s=ordItems.find(x=>x.id===id),box=$('ordEditor-'+id);
 if(!s||!box)return;
 const select=box.querySelector('[data-ord-badge]'),role=box.querySelector('[data-ord-role]')?.value;
 if(!select)return;
 const taken=new Set(ordCrew.filter(x=>x.servizio_id===id).map(x=>x.badge_personale));
 const options=(ordEligible.get(s.data_servizio)||[]).filter(x=>x.ruolo===role&&!taken.has(x.badge))
  .sort((a,b)=>String(a.badge).localeCompare(String(b.badge),'it',{numeric:true}));
 select.innerHTML='<option value="">Scegli operatore</option>'+
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
