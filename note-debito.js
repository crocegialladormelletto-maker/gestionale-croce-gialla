/* Croce Gialla - Note di Debito; accesso esclusivo Amministrazione.
   L'invio email apre una bozza: l'allegato PDF va aggiunto manualmente.
   Nessun messaggio viene contrassegnato come inviato senza integrazione mail. */
(function(){
 'use strict';
 const el=id=>document.getElementById(id);
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=x=>Number(x||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
 const niceDate=x=>x?String(x).slice(0,10).split('-').reverse().join('/'):'—';
 const isAdmin=()=>prof?.ruolo==='AMMINISTRATORE';
 let active=null,createBusy=false,saveBusy=false,seq=0;
 function info(text,kind=''){msg('ndMsg',text,kind);msg('ndActionMsg',text,kind)}
 function amountPreview(){
  const gross=Number(el('ndAmount').value||0),discount=Number(el('ndDiscount').value||0);
  el('ndTotal').value=money(Math.max(0,gross-discount));
 }
 function fill(row){
  active=row;
  el('ndNumber').textContent=row.numero;
  el('ndState').textContent=row.stato;
  for(const [id,key] of Object.entries({
   ndDate:'data_documento',ndServiceDate:'data_servizio',ndName:'intestatario',
   ndCF:'cf_piva',ndAddress:'indirizzo',ndCap:'cap',ndComune:'comune',
   ndProvincia:'provincia',ndEmail:'email',ndDescription:'descrizione',
   ndAmount:'importo',ndDiscount:'sconto',ndPayment:'modalita_pagamento',
   ndPayDate:'data_pagamento'
  }))el(id).value=row[key]??'';
  el('ndLinked').textContent='Foglio Viaggio '+row.numero_foglio;
  const draft=row.stato==='BOZZA';
  el('ndForm').querySelectorAll('input,textarea,select').forEach(node=>node.disabled=!draft);
  el('ndSave').classList.toggle('hidden',!draft);
  el('ndIssue').classList.toggle('hidden',!draft);
  el('ndPrint').disabled=false;
  el('ndEmailSend').disabled=false;
  el('ndPrint').title=draft?'Prima emetti la Nota di Debito per ottenere il documento definitivo.':'Stampa o salva la Nota di Debito in PDF.';
  el('ndEmailSend').title=draft?'Prima emetti la Nota di Debito.':'Prepara il messaggio email per il destinatario.';
  el('ndNoDuplicate').textContent=draft
   ?'Bozza: controlla numerazione, intestatario, importo, sconto e dati di pagamento prima di emettere.'
   :'Nota emessa. Per correzioni successive rivolgersi all’Amministrazione.';
  amountPreview();
 }
 async function read(id){
  if(!isAdmin())return;
  info('Caricamento della Nota di Debito...');
  const r=await sb.from('note_di_debito').select('*').eq('id',id).single();
  if(r.error)return info(r.error.message,'err');
  fill(r.data);selectView('debitNoteDetail');info('');
  window.scrollTo({top:0,behavior:'smooth'});
 }
 window.ndOpen=read;
 async function getForFoglio(f){
  if(!isAdmin()||!f)return;
  const id=++seq;const box=el('ndFromSheet');
  if(!box)return;
  const closed=f.stato==='CHIUSO';
  box.classList.toggle('hidden',!closed);
  if(!closed)return;
  el('ndFromSheetButton').disabled=true;
  el('ndFromSheetButton').textContent='Verifica Nota di Debito...';
  const r=await sb.from('note_di_debito').select('id,numero,stato').eq('foglio_viaggio_id',f.id).maybeSingle();
  if(id!==seq)return;
  if(r.error){el('ndFromSheetButton').textContent='Errore: aggiorna la scheda';info(r.error.message,'err');return}
  if(r.data){
   el('ndFromSheetButton').textContent='Apri Nota di Debito '+r.data.numero+' · '+r.data.stato;
   el('ndFromSheetButton').disabled=false;
   el('ndFromSheetButton').onclick=()=>read(r.data.id);
   el('ndFromSheetInfo').textContent='Una sola Nota di Debito per Foglio Viaggio.';
  }else{
   el('ndFromSheetButton').textContent='✚ Crea Nota di Debito';
   el('ndFromSheetButton').disabled=false;
   el('ndFromSheetButton').onclick=()=>createFromSheet(f.id);
   el('ndFromSheetInfo').textContent='Creazione manuale, riservata all’Amministrazione.';
  }
 }
 window.ndRefreshForFoglio=getForFoglio;
 async function createFromSheet(id){
  if(!isAdmin()||createBusy||!id)return;
  if(!confirm('Creare UNA Nota di Debito in bozza collegata al Foglio Viaggio chiuso? Verifica che la numerazione non sia già stata usata nei documenti precedenti.'))return;
  createBusy=true;
  el('ndFromSheetButton').disabled=true;
  try{
   const r=await sb.rpc('cge_crea_nota_debito',{p_foglio:id});
   if(r.error)throw r.error;
   await read(r.data);
   info('Bozza creata. Controlla i dati prima di emetterla.','ok');
  }catch(e){el('ndFromSheetButton').disabled=false;info(e.message||String(e),'err')}
  finally{createBusy=false}
 }
 function payload(){
  const amount=Number(el('ndAmount').value),discount=Number(el('ndDiscount').value);
  const name=el('ndName').value.trim(),description=el('ndDescription').value.trim();
  if(!name||!description)throw new Error('Intestatario e descrizione sono obbligatori.');
  if(!Number.isFinite(amount)||!Number.isFinite(discount)||amount<0||discount<0||discount>amount)
   throw new Error('Controlla importo e sconto.');
  const email=el('ndEmail').value.trim();
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Indirizzo email non valido.');
  return {data_documento:el('ndDate').value,intestatario:name,cf_piva:el('ndCF').value.trim()||null,
   indirizzo:el('ndAddress').value.trim()||null,cap:el('ndCap').value.trim()||null,
   comune:el('ndComune').value.trim()||null,provincia:el('ndProvincia').value.trim()||null,
   email:email||null,descrizione:description,importo:amount,sconto:discount,
   modalita_pagamento:el('ndPayment').value||null,
   data_pagamento:el('ndPayDate').value||null,updated_at:new Date().toISOString()};
 }
 async function save(){
  if(!isAdmin()||!active||active.stato!=='BOZZA'||saveBusy)return false;
  let row;try{row=payload()}catch(e){info(e.message,'warn');return false}
  saveBusy=true;el('ndSave').disabled=true;el('ndIssue').disabled=true;
  info('Salvataggio della bozza in corso…');
  try{
   const r=await sb.from('note_di_debito').update(row).eq('id',active.id).eq('stato','BOZZA').select('*').single();
   if(r.error){info('Errore nel salvataggio: '+r.error.message,'err');return false}
   fill(r.data);info('Bozza salvata correttamente.','ok');return true;
  }catch(e){
   info('Errore nel salvataggio: '+(e.message||String(e)),'err');return false;
  }finally{
   saveBusy=false;
   if(active?.stato==='BOZZA'){el('ndSave').disabled=false;el('ndIssue').disabled=false}
  }
 }
 async function issue(){
  if(!isAdmin()||!active||active.stato!=='BOZZA')return info('La Nota di Debito non è più in stato BOZZA.','warn');
  if(!confirm('Emettere DEFINITIVAMENTE '+active.numero+'? Dopo l’emissione la Nota di Debito non sarà più modificabile.'))return;
  const ok=await save();
  if(!ok)return;
  info('Emissione della Nota di Debito in corso…');
  el('ndIssue').disabled=true;
  try{
   const r=await sb.rpc('cge_emetti_nota_debito',{p_id:active.id});
   if(r.error){info('Errore durante l’emissione: '+r.error.message,'err');el('ndIssue').disabled=false;return}
   await read(active.id);
   info('Nota di Debito emessa correttamente. Ora puoi usare Stampa / Salva PDF e Prepara email.','ok');
  }catch(e){
   info('Errore durante l’emissione: '+(e.message||String(e)),'err');
   if(active?.stato==='BOZZA')el('ndIssue').disabled=false;
  }
 }
 window.ndSaveDraft=save;
 window.ndIssueNote=issue;
 el('ndSave').onclick=save;
 el('ndIssue').onclick=issue;
 function printHtml(n){
  const line=(k,v)=>'<div style="margin:6px 0"><b>'+safe(k)+':</b> '+safe(v||'—')+'</div>';
  return '<div class="print-page" style="font-family:Arial,sans-serif;color:#182c3a">'+
    '<div class="print-head"><img class="print-logo" src="'+LOGO_URL+'" alt="">'+
    '<div class="print-org"><h1>CROCE GIALLA EMERGENZA ODV</h1>'+
    '<div>Via I° Maggio 1 · 28040 Dormelletto (NO)</div>'+
    '<div>C.F. 91023880031 · P. IVA 02809130038</div>'+
    '<div>Tel. 0322 282730 · tesoreria@crocegiallaemergenza.it</div></div>'+
    '<div class="print-doc"><h2>NOTA DI DEBITO</h2><b>'+safe(n.numero)+'</b><div>'+niceDate(n.data_documento)+'</div></div></div>'+
    '<div class="print-box"><b>DESTINATARIO / INTESTATARIO</b>'+
    line('Nome e cognome / intestatario',n.intestatario)+line('C.F. / P. IVA',n.cf_piva)+
    line('Indirizzo',n.indirizzo)+line('CAP · Comune · Provincia',[n.cap,n.comune,n.provincia].filter(Boolean).join(' · '))+'</div>'+
    '<div class="print-box" style="margin-top:12px"><b>DETTAGLIO DEL SERVIZIO</b>'+
    line('Data servizio',niceDate(n.data_servizio))+line('Foglio Viaggio',n.numero_foglio)+
    '<div style="white-space:pre-wrap;margin:10px 0">'+safe(n.descrizione)+'</div></div>'+
    '<table style="width:100%;border-collapse:collapse;margin:16px 0" border="1" cellpadding="7">'+
    '<thead><tr><th style="text-align:left">Descrizione</th><th>Prezzo</th><th>Sconto</th><th>Importo</th></tr></thead>'+
    '<tbody><tr><td>'+safe(n.descrizione)+'</td><td>'+money(n.importo)+'</td><td>'+money(n.sconto)+'</td><td>'+money(n.totale)+'</td></tr></tbody></table>'+
    '<div style="text-align:right;font-size:17pt;font-weight:bold;color:#12375d;margin:12px 0">TOTALE DA CORRISPONDERE: '+money(n.totale)+'</div>'+
    '<div class="print-box"><b>MODALITÀ DI PAGAMENTO</b>'+
    line('Metodo',n.modalita_pagamento||'Da concordare')+
    line('Già pagato',n.data_pagamento?'Sì · '+niceDate(n.data_pagamento):'No')+
    line('Banca','UniCredit - filiale di Borgomanero')+
    '<div style="margin:8px 0;font-weight:bold;font-size:13pt">IBAN: IT84M0200845222000107312436</div>'+
    line('Causale',n.numero)+'</div>'+
    '<div style="font-size:8pt;margin-top:14px;line-height:1.5">Operazione senza applicazione dell’Iva ai sensi dell’art. 1, commi 54–89, L. 190/2014, come modificata dalle L. 208/2015 e L. 145/2018.<br>'+
    'Imposta di bollo: esente ai sensi dell’art. 82, comma 5, D.Lgs. 117/2017.</div>'+
    '<div style="margin-top:15px;border-top:2px solid #e6c741;padding-top:8px">Sostieni la Croce Gialla con il tuo 5×1000: C.F. <b>91023880031</b></div></div>';
 }
 el('ndPrint').onclick=()=>{
  if(!isAdmin()||!active)return info('Nota di Debito non disponibile.','warn');
  if(active.stato!=='EMESSA')return info('La Nota di Debito è ancora in BOZZA: premi prima “Emetti Nota di Debito”, poi potrai stamparla o salvarla in PDF.','warn');
  const print=el('printSheet'),oldTitle=document.title;
  document.body.classList.remove('print-roster','print-emergency','print-assistance');
  print.innerHTML=printHtml(active);
  print.classList.remove('hidden');document.title='Nota_di_Debito_'+active.numero;
  const restore=()=>{document.title=oldTitle;print.classList.add('hidden');window.removeEventListener('afterprint',restore)};
  window.addEventListener('afterprint',restore);window.print();
 };
 el('ndEmailSend').onclick=()=>{
  if(!isAdmin()||!active)return info('Nota di Debito non disponibile.','warn');
  if(active.stato!=='EMESSA')return info('La Nota di Debito è ancora in BOZZA: emettila prima di preparare l’email al destinatario.','warn');
  if(!active.email)return info('Inserisci l’indirizzo email corretto quando la nota è ancora in bozza.','warn');
  if(!confirm('Aprire un messaggio email indirizzato a '+active.email+'? Salva prima il PDF e ALLEGALO manualmente: il gestionale non invia automaticamente file o email.'))return;
  const subject='Croce Gialla Emergenza ODV – Nota di Debito '+active.numero;
  const body='Gentile destinatario,\n\nin allegato la Nota di Debito '+active.numero+
   ' relativa al servizio del '+niceDate(active.data_servizio)+
   '.\n\nCordiali saluti,\nCroce Gialla Emergenza ODV\ntesoreria@crocegiallaemergenza.it';
  location.href='mailto:'+encodeURIComponent(active.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  info('Bozza email aperta: allega il PDF e premi Invia nel tuo programma di posta. L’invio non è registrato automaticamente.','warn');
 };
 el('ndBack').onclick=()=>view('debitNotes');
 el('ndFromSheetOpenList').onclick=()=>view('debitNotes');
 async function list(){
  if(!isAdmin())return;
  const r=await sb.from('note_di_debito').select('id,numero,data_documento,intestatario,totale,stato,numero_foglio').order('created_at',{ascending:false}).limit(500);
  if(r.error)return msg('ndListMsg',r.error.message,'err');
  el('ndRows').innerHTML=(r.data||[]).length?r.data.map(n=>'<tr><td><b>'+safe(n.numero)+'</b></td><td>'+safe(niceDate(n.data_documento))+'</td>'+
    '<td>'+safe(n.intestatario)+'</td><td>'+safe(n.numero_foglio)+'</td><td>'+money(n.totale)+'</td><td>'+safe(n.stato)+'</td>'+
    '<td><button class="btn secondary" type="button" data-nd-open="'+safe(n.id)+'">Apri</button></td></tr>').join(''):
    '<tr><td colspan="7">Nessuna Nota di Debito registrata.</td></tr>';
  el('ndRows').querySelectorAll('[data-nd-open]').forEach(b=>b.onclick=()=>read(b.dataset.ndOpen));
  msg('ndListMsg','');
 }
 window.ndLoadList=list;
 el('ndRefresh').onclick=list;
 el('ndAmount').oninput=amountPreview;el('ndDiscount').oninput=amountPreview;
})();
