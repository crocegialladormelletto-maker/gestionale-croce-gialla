// APP Volontari — calendario servizi ordinari specifici (Visita, Trasferimento, Trasporto semplice)
let volOrdCursor=new Date(),volOrdSelected=todaySafe(),volOrdServices=[],volOrdSeq=0,volOrdBusy=false;
const VOL_ORD_ROLES=[
 ['AUTISTA','Autista'],['CAPO_SERVIZIO','Capo servizio'],
 ['SOCCORRITORE','Soccorritore'],['SECONDO_SOCCORRITORE','Secondo soccorritore'],
 ['ACCOMPAGNATORE','Accompagnatore'],['AFFIANCATO','Affiancato']
];
function volOrdQualified(day){
 return VOL_ORD_ROLES.filter(([role])=>vfcalQualificationRows.some(q=>
  (q.codice_qualifica===role||(role==='ACCOMPAGNATORE'&&q.codice_qualifica==='ALLEGATO_A'))
  &&(!q.valida_dal||q.valida_dal<=day)&&(!q.valida_al||q.valida_al>=day)));
}
function volOrdCoverage(s){
 const roles=s.ruoli_occupati||[];
 const min=Math.max(1,Number(s.equipaggio_minimo)||2);
 const complete=roles.length>=min&&roles.includes('AUTISTA')&&(!s.capo_servizio_obbligatorio||roles.includes('CAPO_SERVIZIO'));
 return {complete,label:complete?'Equipaggio minimo presente':'Da completare · '+roles.length+'/'+min+
  (!roles.includes('AUTISTA')?' · manca autista':'')+
  (s.capo_servizio_obbligatorio&&!roles.includes('CAPO_SERVIZIO')?' · manca capo servizio':'')};
}
function volOrdRender(){
 const range=calVisibleRange(volOrdCursor,'month');
 $('volOrdTitle').textContent=calMonthTitle(volOrdCursor);
 let html='';
 for(let i=0;i<range.cells;i++){
  const date=new Date(range.start);date.setDate(range.start.getDate()+i);
  const day=calYmd(date),items=volOrdServices.filter(s=>s.data_servizio===day);
  const complete=items.every(s=>volOrdCoverage(s).complete);
  html+='<button type="button" class="dim-date '+
   (date.getMonth()!==volOrdCursor.getMonth()?'dim-out ':'')+
   (day===todaySafe()?'dim-today ':'')+(day===volOrdSelected?'dim-selected':'')+
   '" data-vol-ord-day="'+day+'"><b>'+date.getDate()+'</b>'+
   (items.length?'<small>🚐 '+items.length+
    ' <span class="dim-dot '+(complete?'ok':'partial')+'"></span></small>':'')+'</button>';
 }
 $('volOrdGrid').innerHTML=html;
 $('volOrdGrid').querySelectorAll('[data-vol-ord-day]').forEach(b=>b.onclick=()=>{
  volOrdSelected=b.dataset.volOrdDay;
  if(new Date(volOrdSelected+'T12:00:00').getMonth()!==volOrdCursor.getMonth()){
   volOrdCursor=new Date(volOrdSelected+'T12:00:00');
   loadVolOrd();
  }else volOrdRender();
 });
 volOrdRenderDay();
}
function volOrdRenderDay(){
 $('volOrdDayTitle').textContent='Servizi ordinari · '+dimDayTitle(volOrdSelected);
 const rows=volOrdServices.filter(s=>s.data_servizio===volOrdSelected)
  .sort((a,b)=>String(a.ora_partenza_prevista||'99:99').localeCompare(String(b.ora_partenza_prevista||'99:99')));
 $('volOrdDay').innerHTML=rows.length?rows.map(s=>{
  const occupied=s.ruoli_occupati||[],mine=s.ruolo_assegnato;
  const available=volOrdQualified(s.data_servizio).filter(([role])=>!occupied.includes(role));
  const coverage=volOrdCoverage(s);
  const times='Partenza '+(calTime(s.ora_partenza_prevista)||'—')+
    ' · Arrivo previsto '+(calTime(s.ora_arrivo_destinazione_prevista)||'—')+
    ' · Rientro '+(calTime(s.ora_rientro_previsto)||'—');
  let action='';
  if(mine)action='<div class="notice ok">Sei iscritto definitivamente come '+
   esc(VOL_ORD_ROLES.find(([role])=>role===mine)?.[1]||mine)+
   '. Per variazioni contatta il Centralino.</div>';
  else if(s.data_servizio>=todaySafe()){
   if(available.length)action='<div class="actions" style="margin-top:8px">'+
    '<select aria-label="Ruolo per il servizio ordinario" data-vol-ord-role="'+esc(s.id)+'" style="flex:1 1 145px">'+
    available.map(([role,label])=>'<option value="'+esc(role)+'">'+esc(label)+'</option>').join('')+
    '</select><button type="button" class="btn yellow" data-vol-ord-join="'+esc(s.id)+
    '">Mi segno (definitivo)</button></div>';
   else action='<div class="muted">'+
    (volOrdQualified(s.data_servizio).length?'I ruoli per cui sei qualificato sono già occupati.':'Non risulti qualificato per i ruoli disponibili.')+
    ' Contatta il Centralino.</div>';
  }
  return '<div class="dim-slot"><b>🚐 '+esc(s.tipo_servizio)+'</b>'+
   ' <span class="pill '+(coverage.complete?'g':'')+'">'+esc(coverage.label)+'</span>'+
   '<div class="muted">'+esc(s.data_servizio)+' · Mezzo '+esc(s.mezzo||'—')+'</div>'+
   '<div class="muted">'+esc(times)+'</div>'+
   '<div class="muted">I dati del paziente e il percorso completo sono disponibili nell’area personale dopo l’assegnazione.</div>'+
   action+'</div>';
 }).join(''):'<div class="notice">Nessun servizio ordinario programmato per questo giorno. Scegli una data con 🚐 oppure chiedi al Centralino di inserire il servizio.</div>';
 $('volOrdDay').querySelectorAll('[data-vol-ord-join]').forEach(b=>b.onclick=()=>volOrdJoin(b.dataset.volOrdJoin));
}
async function loadVolOrd(){
 if(!volunteerBadge)return;
 const seq=++volOrdSeq,range=calVisibleRange(volOrdCursor,'month');
 msg('volOrdMsg','Caricamento visite, trasferimenti e trasporti semplici...');
 const r=await sb.rpc('cge_volontario_ordinari_calendario',{
  p_dal:range.startYmd,p_al:range.endYmd
 });
 if(seq!==volOrdSeq)return;
 if(r.error){volOrdServices=[];volOrdRender();return msg('volOrdMsg',r.error.message,'err')}
 volOrdServices=r.data||[];
 volOrdRender();msg('volOrdMsg','');
}
async function volOrdJoin(id){
 if(volOrdBusy)return;
 const service=volOrdServices.find(s=>s.id===id&&s.data_servizio===volOrdSelected);
 if(!service||service.ruolo_assegnato||service.data_servizio<todaySafe())return;
 const role=$('volOrdDay').querySelector('[data-vol-ord-role="'+id+'"]')?.value;
 if(!volOrdQualified(service.data_servizio).some(([r])=>r===role)||
  (service.ruoli_occupati||[]).includes(role))
 return msg('volOrdMsg','Seleziona un ruolo libero per cui sei qualificato.','warn');
 if(!confirm('Confermi l’iscrizione DEFINITIVA al servizio '+service.tipo_servizio+
  ' del '+service.data_servizio+' come '+
  (VOL_ORD_ROLES.find(([r])=>r===role)?.[1]||role)+
  '? Non potrai annullarla autonomamente.'))return;
 volOrdBusy=true;msg('volOrdMsg','Registrazione definitiva in corso...');
 try{
  const r=await sb.rpc('cge_volontario_ordinari_iscriviti',{p_servizio:id,p_ruolo:role});
  if(r.error)throw r.error;
  await loadVolunteerArea();
  msg('volOrdMsg','Iscrizione definitiva registrata. Il servizio è disponibile anche in «I miei servizi».','ok');
 }catch(e){msg('volOrdMsg',e.message||String(e),'err')}
 finally{volOrdBusy=false}
}
function volOrdMove(n){
 if(n===0){volOrdCursor=new Date();volOrdSelected=todaySafe()}
 else{
  volOrdCursor=new Date(volOrdCursor.getFullYear(),volOrdCursor.getMonth()+n,1);
  volOrdSelected=calYmd(volOrdCursor);
 }
 loadVolOrd();
}
$('volOrdPrev').onclick=()=>volOrdMove(-1);
$('volOrdNext').onclick=()=>volOrdMove(1);
$('volOrdToday').onclick=()=>volOrdMove(0);
$('volOrdRefresh').onclick=loadVolOrd;
