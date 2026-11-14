/* Croce Gialla - estensioni Anagrafica pazienti, novembre 2026 */
(function(){
'use strict';
const $p=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FIELDS=['destinazioni_abituali','contatto_nome','contatto_relazione','contatto_telefono','note_operative'];
const ADDRESS_FIELDS=['ritiro_via','ritiro_civico','ritiro_comune','ritiro_cap','ritiro_provincia'];
const ADDRESS_IDS=['paPickupStreet','paPickupNumber','paPickupCity','paPickupCap','paPickupProvince'];
const RESIDENCE_FIELDS=['residenza_via','residenza_civico','residenza_comune','residenza_cap','residenza_provincia'];
const RESIDENCE_IDS=['paResidenceStreet','paResidenceNumber','paResidenceCity','paResidenceCap','paResidenceProvince'];
function assembleAddress(parts){return [[parts[0],parts[1]].filter(Boolean).join(' '),[parts[3],parts[2]].filter(Boolean).join(' '),parts[4]?'('+parts[4]+')':''].filter(Boolean).join(', ');}
const IDS=['paDestinations','paContactName','paContactRelation','paContactPhone','paOperationalNotes'];
const SELECT='id,nome,cognome,codice_fiscale,data_nascita,telefono,indirizzo,email,residenza_via,residenza_civico,residenza_comune,residenza_cap,residenza_provincia,indirizzo_ritiro_abituale,ritiro_via,ritiro_civico,ritiro_comune,ritiro_cap,ritiro_provincia,destinazioni_abituali,contatto_nome,contatto_relazione,contatto_telefono,note_operative,updated_at,updated_by';
const section=$p('paSave')?.closest('.section');
if(!section || typeof sb==='undefined')return;
const toolbar=$p('paSave').parentElement;
// Sostituisce solo il campo visivo, mantenendo il vecchio input per i servizi esistenti.
const legacyResidence=$p('paAddress');
const residenceContainer=legacyResidence.closest('.field');
const residenceBlock=document.createElement('div');
residenceBlock.className='field';
residenceBlock.style.gridColumn='1 / -1';
residenceBlock.innerHTML=`<label style="font-weight:800;margin-bottom:8px">Indirizzo principale del paziente</label>
<div id="paResidenceGrid" style="display:grid;grid-template-columns:minmax(180px,3fr) minmax(75px,1fr) minmax(150px,2fr) minmax(85px,1fr) minmax(78px,.8fr);gap:10px">
 <div class="field"><label for="paResidenceStreet">Via / Piazza</label><input id="paResidenceStreet" maxlength="240" placeholder="Via Roma"></div>
 <div class="field"><label for="paResidenceNumber">Numero civico</label><input id="paResidenceNumber" maxlength="20" placeholder="12/A"></div>
 <div class="field"><label for="paResidenceCity">Comune</label><input id="paResidenceCity" maxlength="120" placeholder="Dormelletto"></div>
 <div class="field"><label for="paResidenceCap">CAP</label><input id="paResidenceCap" maxlength="5" inputmode="numeric" pattern="[0-9]{5}" placeholder="28040" title="Inserire un CAP di 5 cifre"></div>
 <div class="field"><label for="paResidenceProvince">Provincia</label><input id="paResidenceProvince" maxlength="2" pattern="[A-Za-z]{2}" placeholder="NO" style="text-transform:uppercase" title="Inserire la sigla di 2 lettere"></div>
</div>
<div id="paResidenceLegacy" class="muted hidden" style="margin-top:5px"></div>
<style>@media(max-width:850px){#paResidenceGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#paResidenceGrid .field:first-child{grid-column:1/-1}}@media(max-width:480px){#paResidenceGrid{grid-template-columns:1fr!important}#paResidenceGrid .field:first-child{grid-column:auto}}</style>`;
residenceContainer.replaceWith(residenceBlock);
legacyResidence.style.display='none';
residenceBlock.append(legacyResidence);
function syncResidence(){
 const vals=RESIDENCE_IDS.map(id=>$p(id).value.trim());
 vals[4]=vals[4].toUpperCase();
 if(vals.some(Boolean))legacyResidence.value=assembleAddress(vals);
}
RESIDENCE_IDS.forEach(id=>$p(id).addEventListener('input',syncResidence));
const info=document.createElement('div');
info.innerHTML=`
<div class="section" style="background:#f5f9fd;border:1px solid #dce8f2;margin-top:14px">
 <h3>Indirizzo di ritiro abituale <span class="muted">(facoltativo)</span></h3>
 <div style="display:grid;grid-template-columns:minmax(180px,3fr) minmax(75px,1fr) minmax(150px,2fr) minmax(85px,1fr) minmax(78px,.8fr);gap:10px" id="paAddressGrid">
 <div class="field"><label for="paPickupStreet">Via / Piazza</label><input id="paPickupStreet" maxlength="240" placeholder="Via Roma"></div>
 <div class="field"><label for="paPickupNumber">N. civico</label><input id="paPickupNumber" maxlength="20" placeholder="12/A"></div>
 <div class="field"><label for="paPickupCity">Comune</label><input id="paPickupCity" maxlength="120" placeholder="Dormelletto"></div>
 <div class="field"><label for="paPickupCap">CAP</label><input id="paPickupCap" maxlength="5" inputmode="numeric" placeholder="28040" pattern="[0-9]{5}" title="Il CAP deve essere composto da 5 cifre"></div>
 <div class="field"><label for="paPickupProvince">Provincia</label><input id="paPickupProvince" maxlength="2" placeholder="NO" style="text-transform:uppercase" pattern="[A-Za-z]{2}" title="Usa la sigla di 2 lettere"></div>
 </div>
 <style>@media(max-width:850px){#paAddressGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#paAddressGrid .field:first-child{grid-column:1/-1}}@media(max-width:480px){#paAddressGrid{grid-template-columns:1fr!important}#paAddressGrid .field:first-child{grid-column:auto}}</style>
 <div id="paPickupLegacy" class="muted hidden" style="margin-top:5px"></div>
 <div class="field" style="margin-top:10px"><label for="paDestinations">Destinazioni abituali (una per riga)</label><textarea id="paDestinations" maxlength="2000" rows="2" placeholder="Ospedale, ambulatorio, RSA, indirizzo"></textarea></div>
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
// Impostazione compatta: gruppi chiari, campi esistenti spostati (non ricreati).
const originalGrid=section.querySelector('.grid3');
if(originalGrid){
 const profile=document.createElement('div');
 profile.id='paCompactProfile';
 const field=id=>$p(id)?.closest('.field');
 const createGroup=(heading,ids,extraClass='')=>{
  const group=document.createElement('section');
  group.className='pa-compact-group';
  const title=document.createElement('h3');title.textContent=heading;group.append(title);
  const grid=document.createElement('div');grid.className='pa-compact-fields '+extraClass;
  ids.forEach(id=>{const node=id==='residence'?residenceBlock:field(id);if(node)grid.append(node)});
  group.append(grid);profile.append(group);
 };
 createGroup('Dati anagrafici',['paName','paSurname','paCf','paDob'],'pa-personal-fields');
 createGroup('Indirizzo di residenza',['residence'],'pa-residence-fields');
 createGroup('Recapiti',['paPhone','paEmail'],'pa-contact-fields');
 originalGrid.replaceWith(profile);
}
const extraSection=info.querySelector('.section');
if(extraSection){
 const details=document.createElement('details');
 details.id='paExtraDetails';details.className='pa-extra-details';
 const summary=document.createElement('summary');
 summary.textContent='Informazioni aggiuntive (facoltative)';
 details.append(summary);
 extraSection.style.marginTop='0';
 extraSection.style.background='transparent';
 extraSection.style.border='0';
 extraSection.style.padding='12px 4px 6px';
 details.append(extraSection);
 info.prepend(details);
}
toolbar.classList.add('pa-sticky-actions');
$p('paSave').textContent='💾 Salva paziente';
const patientStyle=document.createElement('style');
patientStyle.textContent=`
#paCompactProfile{display:grid;gap:12px}
#paCompactProfile .pa-compact-group{border:1px solid #dce5ef;border-radius:12px;background:#fff;padding:15px}
#paCompactProfile .pa-compact-group h3{font-size:16px;color:#11385b;margin:0 0 12px}
#paCompactProfile .pa-compact-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#paCompactProfile .pa-personal-fields{grid-template-columns:repeat(2,minmax(0,1fr))}
#paCompactProfile .pa-compact-group .field{min-width:0;margin:0}
#paCompactProfile .pa-compact-group input{width:100%}
#paCompactProfile #paResidenceGrid{grid-template-columns:minmax(180px,3fr) minmax(75px,1fr) minmax(150px,2fr) minmax(85px,1fr) minmax(78px,.8fr)}
#paCompactProfile .pa-residence-fields{display:block}
.pa-extra-details{margin:12px 0;border:1px solid #dce5ef;border-radius:12px;overflow:hidden;background:#f6f9fc}
.pa-extra-details>summary{cursor:pointer;padding:15px 18px;font-weight:800;color:#11385b;list-style:none;display:flex;align-items:center;justify-content:space-between}
.pa-extra-details>summary::after{content:'⌄';font-size:20px}
.pa-extra-details[open]>summary::after{content:'⌃'}
.pa-extra-details>summary::-webkit-details-marker{display:none}
.pa-extra-details[open]>summary{border-bottom:1px solid #dce5ef}
.pa-extra-details textarea{min-height:60px}
.pa-sticky-actions{position:sticky;bottom:0;z-index:12;background:#fff;padding:12px 8px!important;border-top:2px solid #e1eaf3;box-shadow:0 -5px 18px #0b31551a;border-radius:10px;display:flex;flex-wrap:wrap;gap:8px}
.pa-sticky-actions #paSave{background:#f8d635!important;color:#15385b!important;padding:12px 20px!important;font-size:15px!important}
@media(max-width:850px){#paCompactProfile #paResidenceGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#paCompactProfile #paResidenceGrid .field:first-child{grid-column:1/-1}}
@media(max-width:600px){#paCompactProfile .pa-compact-fields{grid-template-columns:1fr}#paCompactProfile #paResidenceGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pa-sticky-actions{bottom:0}.pa-sticky-actions #paSave{flex:1}}
`;
document.head.append(patientStyle);
const audit=document.createElement('div');audit.id='paAuditPanel';audit.className='hidden';audit.innerHTML='<h3>🕓 Storico modifiche</h3><div id="paAuditRows" class="muted"></div>';
$p('patientTransportHistory').before(audit);
let viewSeq=0,historySeq=0;
const oldFormRow=patientFormRow;
patientFormRow=function(){
 const row=oldFormRow();
 FIELDS.forEach((k,i)=>row[k]=$p(IDS[i]).value.trim()||null);
 ADDRESS_FIELDS.forEach((k,i)=>row[k]=$p(ADDRESS_IDS[i]).value.trim()||null);
 RESIDENCE_FIELDS.forEach((k,i)=>row[k]=$p(RESIDENCE_IDS[i]).value.trim()||null);
 row.residenza_provincia=row.residenza_provincia?.toUpperCase()||null;
 const residenceParts=RESIDENCE_IDS.map(id=>$p(id).value.trim());
 residenceParts[4]=residenceParts[4].toUpperCase();
 // Se non sono ancora stati compilati i campi separati, conserva l'indirizzo storico.
 row.indirizzo=residenceParts.some(Boolean)?assembleAddress(residenceParts):(adminPatientRecord?.id===adminPatientId?(adminPatientRecord.indirizzo||null):legacyResidence.value.trim()||null);
 legacyResidence.value=row.indirizzo||'';
 row.ritiro_provincia=row.ritiro_provincia?.toUpperCase()||null;
 const hasParts=ADDRESS_FIELDS.some(k=>row[k]);
 const legacy=adminPatientRecord?.id===adminPatientId?(adminPatientRecord.indirizzo_ritiro_abituale||null):null;
 row.indirizzo_ritiro_abituale=hasParts?[ [row.ritiro_via,row.ritiro_civico].filter(Boolean).join(' '),[row.ritiro_cap,row.ritiro_comune].filter(Boolean).join(' '),row.ritiro_provincia? '('+row.ritiro_provincia+')':'' ].filter(Boolean).join(', '):legacy;
 return row;
};
$p('paSave').addEventListener('click',e=>{for(const id of ['paPickupCap','paPickupProvince','paResidenceCap','paResidenceProvince']){const field=$p(id);if(field.value.trim()&&!field.checkValidity()){e.stopImmediatePropagation();field.reportValidity();return;}}},true);
const oldOpen=patientAdminOpen;
patientAdminOpen=function(p,clearSearch=true){
 oldOpen(p,clearSearch);
 const seq=++viewSeq;
 IDS.concat(ADDRESS_IDS,RESIDENCE_IDS).forEach(id=>$p(id).value='');
 $p('paResidenceLegacy').classList.add('hidden');$p('paResidenceLegacy').textContent='';
 legacyResidence.value=p?.indirizzo||'';
 $p('paPickupLegacy').classList.add('hidden');$p('paPickupLegacy').textContent='';
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
  ADDRESS_FIELDS.forEach((k,i)=>$p(ADDRESS_IDS[i]).value=row[k]||'');
  RESIDENCE_FIELDS.forEach((k,i)=>$p(RESIDENCE_IDS[i]).value=row[k]||'');
  legacyResidence.value=row.indirizzo||'';
  const hasResidenceParts=RESIDENCE_FIELDS.some(k=>row[k]);
  if(!hasResidenceParts&&row.indirizzo){
   $p('paResidenceLegacy').textContent='Indirizzo precedente conservato: '+row.indirizzo+'. Puoi suddividerlo nei cinque campi quando aggiorni la scheda.';
   $p('paResidenceLegacy').classList.remove('hidden');
  }
  const structured=ADDRESS_FIELDS.some(k=>row[k]);
  if(!structured&&row.indirizzo_ritiro_abituale){$p('paPickupLegacy').textContent='Indirizzo precedente conservato: '+row.indirizzo_ritiro_abituale+' · Compila le nuove caselle per sostituirlo.';$p('paPickupLegacy').classList.remove('hidden');}
  if(row.updated_at)$p('paLastUpdated').textContent='Ultimo aggiornamento: '+new Date(row.updated_at).toLocaleString('it-IT');
  await Promise.allSettled([checkRestriction(row,seq),loadAudit(row.id,seq)]);
 })();
};
const LABELS={nome:'Nome',cognome:'Cognome',codice_fiscale:'Codice fiscale',data_nascita:'Data nascita',telefono:'Telefono',indirizzo:'Indirizzo',residenza_via:'Via residenza',residenza_civico:'Civico residenza',residenza_comune:'Comune residenza',residenza_cap:'CAP residenza',residenza_provincia:'Provincia residenza',email:'Email',indirizzo_ritiro_abituale:'Ritiro abituale',ritiro_via:'Via',ritiro_civico:'Civico',ritiro_comune:'Comune',ritiro_cap:'CAP',ritiro_provincia:'Provincia',destinazioni_abituali:'Destinazioni frequenti',contatto_nome:'Referente',contatto_relazione:'Relazione',contatto_telefono:'Telefono referente',note_operative:'Note operative'};
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
