/* Croce Gialla - estensioni Anagrafica pazienti, novembre 2026 */
(function(){
'use strict';
const $p=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FIELDS=['indirizzo_ritiro_abituale','destinazioni_abituali','contatto_nome','contatto_relazione','contatto_telefono','note_operative'];
const IDS=['paPickup','paDestinations','paContactName','paContactRelation','paContactPhone','paOperationalNotes'];
const SELECT='id,nome,cognome,codice_fiscale,data_nascita,telefono,indirizzo,email,indirizzo_ritiro_abituale,destinazioni_abituali,contatto_nome,contatto_relazione,contatto_telefono,note_operative,updated_at,updated_by';
const section=$p('paSave')?.closest('.section');
if(!section || typeof sb==='undefined')return;
const toolbar=$p('paSave').parentElement;
const info=document.createElement('div');
info.innerHTML=`
<div class="section" style="background:#f5f9fd;border:1px solid #dce8f2;margin-top:14px">
 <h3>📍 Indirizzi abituali e destinazioni</h3>
 <div class="grid3">
 <div class="field"><label>Indirizzo di ritiro abituale</label><input id="paPickup" maxlength="400" placeholder="Se diverso dalla residenza"></div>
 <div class="field" style="grid-column:span 2"><label>Destinazioni abituali (una per riga)</label><textarea id="paDestinations" maxlength="2000" rows="3" placeholder="Ospedale, ambulatorio, RSA, indirizzo"></textarea></div>
 </div>
 <h3>☎️ Contatto di riferimento</h3><div class="grid3">
 <div class="field"><label>Nome del referente</label><input id="paContactName" maxlength="160"></div>
 <div class="field"><label>Rapporto con il paziente</label><input id="paContactRelation" maxlength="100"></div>
 <div class="field"><label>Telefono del referente</label><input id="paContactPhone" maxlength="60"></div></div>
 <h3>📝 Note operative</h3>
 <div class="field"><label>Indicazioni logistiche utili all'equipaggio</label><textarea id="paOperationalNotes" maxlength="2000" rows="3" placeholder="Citofono, ingresso, punto di incontro. Non inserire diagnosi o dati clinici."></textarea></div>
</div>
<div id="paRestrictionInfo" role="status" aria-live="polite"></div>
<div id="paLastUpdated" class="muted"></div>`;
toolbar.before(info);
const audit=document.createElement('div');audit.id='paAuditPanel';audit.className='hidden';audit.innerHTML='<h3>🕓 Storico modifiche</h3><div id="paAuditRows" class="muted"></div>';
$p('patientTransportHistory').before(audit);
let viewSeq=0,historySeq=0;
const oldFormRow=patientFormRow;
patientFormRow=function(){
 const row=oldFormRow();
 FIELDS.forEach((k,i)=>row[k]=$p(IDS[i]).value.trim()||null);
 return row;
};
const oldOpen=patientAdminOpen;
patientAdminOpen=function(p,clearSearch=true){
 oldOpen(p,clearSearch);
 const seq=++viewSeq;
 IDS.forEach(id=>$p(id).value='');
 $p('paLastUpdated').textContent='';
 $p('paRestrictionInfo').innerHTML='';
 audit.classList.toggle('hidden',!p?.id);
 $p('paAuditRows').textContent=p?.id?'Caricamento…':'';
 if(!p?.id)return;
 // Recupero completo anche quando la scheda proviene dal vecchio elenco.
 (async()=>{
  const r=await sb.from('anagrafica_pazienti').select(SELECT).eq('id',p.id).single();
  if(seq!==viewSeq||adminPatientId!==p.id)return;
  if(r.error){$p('paLastUpdated').textContent='Alcuni dettagli non sono disponibili: '+r.error.message;return;}
  const row=r.data;adminPatientRecord=row;
  FIELDS.forEach((k,i)=>$p(IDS[i]).value=row[k]||'');
  if(row.updated_at)$p('paLastUpdated').textContent='Ultimo aggiornamento: '+new Date(row.updated_at).toLocaleString('it-IT');
  await Promise.allSettled([checkRestriction(row,seq),loadAudit(row.id,seq)]);
 })();
};
const LABELS={nome:'Nome',cognome:'Cognome',codice_fiscale:'Codice fiscale',data_nascita:'Data nascita',telefono:'Telefono',indirizzo:'Indirizzo',email:'Email',indirizzo_ritiro_abituale:'Ritiro abituale',destinazioni_abituali:'Destinazioni frequenti',contatto_nome:'Referente',contatto_relazione:'Relazione',contatto_telefono:'Telefono referente',note_operative:'Note operative'};
async function loadAudit(id,seq){
 const r=await sb.from('anagrafica_pazienti_modifiche').select('operazione,modificato_il,modificato_da,dati_precedenti,dati_nuovi').eq('paziente_id',id).order('modificato_il',{ascending:false}).limit(50);
 if(seq!==viewSeq||adminPatientId!==id)return;
 if(r.error){$p('paAuditRows').textContent='Storico non disponibile: '+r.error.message;return;}
 const rows=r.data||[];
 let names=new Map();
 const ids=[...new Set(rows.map(x=>x.modificato_da).filter(Boolean))];
 if(ids.length){
  const u=await sb.from('accessi_app').select('user_id,nome').in('user_id',ids);
  if(!u.error)names=new Map((u.data||[]).map(x=>[x.user_id,x.nome]));
 }
 if(seq!==viewSeq||adminPatientId!==id)return;
 $p('paAuditRows').innerHTML=rows.length?rows.map(x=>{
  const a=x.dati_precedenti||{},b=x.dati_nuovi||{};
  const fields=Object.keys(LABELS).filter(k=>a[k]!==b[k]&&!(a[k]==null&&b[k]==null)).map(k=>LABELS[k]);
  return '<div class="box" style="margin:7px 0"><b>'+safe(new Date(x.modificato_il).toLocaleString('it-IT'))+' · '+safe(x.operazione)+'</b><div class="muted">Operatore: '+safe(names.get(x.modificato_da)||'Non disponibile')+'</div><div>'+safe(fields.join(', ')||'Anagrafica')+'</div></div>';
 }).join(''):'Nessuna modifica registrata dall’attivazione dello storico.';
}
async function checkRestriction(p,seq){
 const cf=String(p.codice_fiscale||'').trim().toUpperCase();
 let r;
 if(cf)r=await sb.from('clienti_restrizioni').select('id').eq('stato','ATTIVA').eq('codice_fiscale_piva',cf).limit(1);
 if(!cf||(!r.error&&!r.data?.length)){
  r=await sb.from('clienti_restrizioni').select('id').eq('stato','ATTIVA').ilike('denominazione',[p.cognome,p.nome].join(' ')).limit(1);
 }
 if(seq!==viewSeq||adminPatientId!==p.id)return;
 if(r.error){$p('paRestrictionInfo').innerHTML='<div class="notice warn">Verifica restrizioni non disponibile: controllare manualmente.</div>';return}
 if(r.data?.length)$p('paRestrictionInfo').innerHTML='<div class="notice warn"><b>⚠ Restrizione amministrativa attiva.</b> Verifica in <a href="clienti-con-restrizioni/" target="_blank" rel="noopener">Clienti con Restrizioni</a> prima di confermare un trasporto ordinario. Le emergenze 118 non vengono bloccate.</div>';
}
// Aggiorna lo storico con due sezioni e il riutilizzo del flusso Duplica servizio.
loadPatientTransportHistory=async function(id){
 const seq=++historySeq;
 const status=$p('patientTransportStatus'),container=$p('patientTransportRows');
 status.textContent='Caricamento servizi…';container.innerHTML='';
 const r=await sb.from('servizi_giornalieri').select('id,data_servizio,ora_partenza_prevista,tipo_servizio,mezzo,destinazione,stato_gestionale').eq('paziente_id',id).order('data_servizio',{ascending:false}).limit(200);
 if(seq!==historySeq||adminPatientId!==id)return;
 if(r.error){status.textContent='Impossibile leggere i servizi: '+r.error.message;return}
 const rows=r.data||[],today=todaySafe();
 const future=rows.filter(x=>x.data_servizio>=today&&!['CHIUSO','ANNULLATO'].includes(x.stato_gestionale));
 const past=rows.filter(x=>!future.includes(x));
 status.textContent=future.length+' futuri o programmati · '+past.length+' precedenti'+(rows.length>=200?' (ultimi 200 collegati)':'');
 const sheetMap=new Map();
 if(rows.length){
  const a=await sb.from('fogli_viaggio').select('servizio_giornaliero_id,numero_foglio').in('servizio_giornaliero_id',rows.map(x=>x.id));
  if(!a.error)(a.data||[]).forEach(x=>sheetMap.set(x.servizio_giornaliero_id,x.numero_foglio));
 }
 if(seq!==historySeq||adminPatientId!==id)return;
 const group=(title,list)=>'<h4>'+title+' ('+list.length+')</h4>'+(!list.length?'<div class="muted">Nessun servizio in questa sezione.</div>':'<div style="overflow-x:auto"><table style="width:100%;min-width:730px"><thead><tr><th>Data</th><th>Ora</th><th>Tipo</th><th>Destinazione</th><th>Mezzo</th><th>Foglio viaggio</th><th>Azioni</th></tr></thead><tbody>'+list.map(x=>'<tr><td>'+safe(x.data_servizio)+'</td><td>'+safe(String(x.ora_partenza_prevista||'').slice(0,5)||'—')+'</td><td>'+safe(x.tipo_servizio||'—')+'</td><td>'+safe(x.destinazione||'—')+'</td><td>'+safe(x.mezzo||'—')+'</td><td>'+safe(sheetMap.get(x.id)||'—')+'</td><td><button type="button" class="btn secondary" data-pa-open="'+safe(x.id)+'">Apri</button> <button type="button" class="btn yellow" data-pa-repeat="'+safe(x.id)+'">Ripeti trasporto</button></td></tr>').join('')+'</tbody></table></div>');
 container.innerHTML='<div class="notice">Ripeti trasporto apre la funzione Duplica servizio: controlla nuova data, orari, mezzo e importo prima di salvarlo.</div>'+group('📅 Trasporti futuri',future)+group('🚑 Storico trasporti',past);
 container.querySelectorAll('[data-pa-open]').forEach(b=>b.onclick=()=>openService(b.dataset.paOpen));
 container.querySelectorAll('[data-pa-repeat]').forEach(b=>b.onclick=()=>duplicateServiceRequest(b.dataset.paRepeat));
};
// Quando si richiama un paziente nel nuovo servizio, riprende ritiro e note logistiche.
const oldUse=usePatientForService;
usePatientForService=function(p){
 oldUse(p);
 const id=p?.id;if(!id)return;
 (async()=>{
  const r=await sb.from('anagrafica_pazienti').select('indirizzo_ritiro_abituale,note_operative,destinazioni_abituali').eq('id',id).single();
  if(r.error||servicePatientId!==id)return;
  if(r.data.indirizzo_ritiro_abituale&&!$p('loadAddress').value)$p('loadAddress').value=r.data.indirizzo_ritiro_abituale;
  if(r.data.note_operative&&!$p('note').value.trim())$p('note').value=r.data.note_operative;
  const lines=String(r.data.destinazioni_abituali||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(lines.length&&!$p('dest').value){
   const wrap=$p('dest').parentElement;
   let sel=$p('paDestSelect');
   if(!sel){sel=document.createElement('select');sel.id='paDestSelect';sel.style.marginTop='6px';wrap.append(sel);sel.onchange=()=>{if(sel.value)$p('dest').value=sel.value;};}
   sel.innerHTML='<option value="">Scegli una destinazione abituale (facoltativo)</option>'+lines.map(x=>'<option value="'+safe(x)+'">'+safe(x)+'</option>').join('');
  }
 })();
};
const oldReset=resetNewServiceForm;
resetNewServiceForm=function(){oldReset();$p('paDestSelect')?.remove()};
// Controllo restrizioni sui pazienti selezionati per i nuovi servizi.
const priorUse=usePatientForService;
usePatientForService=function(p){
 priorUse(p);
 if(!p?.id)return;
 const current=p.id;
 (async()=>{
  const cf=String(p.codice_fiscale||'').trim().toUpperCase();
  let r;
  if(cf)r=await sb.from('clienti_restrizioni').select('id').eq('stato','ATTIVA').eq('codice_fiscale_piva',cf).limit(1);
  if(!cf||(!r.error&&!r.data?.length))r=await sb.from('clienti_restrizioni').select('id').eq('stato','ATTIVA').ilike('denominazione',[p.cognome,p.nome].join(' ')).limit(1);
  if(servicePatientId!==current)return;
  if(r.data?.length)msg('patientLookupMsg','⚠ Restrizione amministrativa attiva: chiedere verifica prima di confermare il trasporto ordinario. Il 118 non è bloccato.','warn');
 })();
};
})();
