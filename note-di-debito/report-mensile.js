/* Report Note di Debito - informativo e amministrativo, consultabile dai soli amministratori */
const ndReportEuro=x=>Number(x||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const ndReportEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ndReportLocalMonth=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const ndReportDate=x=>x?String(x).slice(0,10).split('-').reverse().join('/'): '—';
function ndReportInit(){
 const pick=document.getElementById('ndReportMonth');
 if(pick&&!pick.value)pick.value=ndReportLocalMonth();
}
async function ndReportGenerate(kind){
 if(prof?.ruolo!=='AMMINISTRATORE'){alert('Report riservato all’Amministrazione.');return;}
 const ym=document.getElementById('ndReportMonth')?.value;
 if(!/^\d{4}-\d{2}$/.test(ym||'')){alert('Seleziona il mese del report.');return;}
 const yr=Number(ym.slice(0,4)),mo=Number(ym.slice(5,7));
 if(mo<1||mo>12){alert('Mese non valido.');return;}
 const next=new Date(Date.UTC(yr,mo,1)).toISOString().slice(0,10);
 const current=ndReportLocalMonth(),through=ym===current?new Date().toISOString().slice(0,10):new Date(Date.UTC(yr,mo,0)).toISOString().slice(0,10);
 const popup=window.open('','_blank');
 if(!popup){alert('Consenti l’apertura di popup per stampare il report.');return;}
 popup.document.write('<!doctype html><meta charset="utf-8"><title>Preparazione report</title><p style="font:16px Arial;padding:28px">Caricamento delle Note di Debito...</p>');popup.document.close();
 try{
  const all=[];
  for(let off=0;off<10000;off+=1000){
   const r=await sb.from('note_di_debito')
    .select('id,numero,anno,progressivo,data_documento,totale,stato,data_pagamento,modalita_pagamento,intestatario')
    .order('data_documento',{ascending:false}).range(off,off+999);
   if(r.error)throw r.error;
   all.push(...(r.data||[]));
   if((r.data||[]).length<1000)break;
  }
  const issued=all.filter(n=>n.stato==='EMESSA');
  const issuedMonth=issued.filter(n=>n.data_documento>=ym+'-01'&&n.data_documento<next);
  const paidMonth=issued.filter(n=>n.data_pagamento>=ym+'-01'&&n.data_pagamento<next);
  const isPaidAtCutoff=n=>!!n.data_pagamento&&n.data_pagamento<=through;
  const issuedToCutoff=issued.filter(n=>n.data_documento&&n.data_documento<=through);
  const unpaidIssuedMonth=issuedMonth.filter(n=>!isPaidAtCutoff(n));
  const unpaidAll=issuedToCutoff.filter(n=>!isPaidAtCutoff(n));
  const sum=arr=>arr.reduce((v,n)=>v+Number(n.totale||0),0);
  const totalIssued=sum(issuedMonth),totalReceived=sum(paidMonth),dueForIssueMonth=sum(unpaidIssuedMonth),duePortfolio=sum(unpaidAll);
  const modeName=v=>{
   const s=String(v||'').trim().toUpperCase();
   if(s.includes('BONIFICO'))return 'Bonifici';
   if(s.includes('POS'))return 'POS';
   if(s.includes('CONTANT'))return 'Contanti';
   return 'Altri / non specificati';
  };
  const paymentsByMode=['Contanti','POS','Bonifici','Altri / non specificati'].map(name=>{
   const records=paidMonth.filter(n=>modeName(n.modalita_pagamento)===name);
   return {name,count:records.length,total:sum(records)};
  });
  const cutoffMs=Date.parse(through+'T12:00:00Z');
  const ageDays=n=>Math.max(0,Math.floor((cutoffMs-Date.parse(n.data_documento+'T12:00:00Z'))/86400000));
  const ages=[
   {label:'0–30 giorni',lo:0,hi:30},
   {label:'31–60 giorni',lo:31,hi:60},
   {label:'61–90 giorni',lo:61,hi:90},
   {label:'Oltre 90 giorni',lo:91,hi:Infinity}
  ].map(x=>{const arr=unpaidAll.filter(n=>ageDays(n)>=x.lo&&ageDays(n)<=x.hi);return {...x,count:arr.length,total:sum(arr)};});
  const monthLabel=new Date(yr,mo-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const logo=typeof NOTE_LOGO==='string'?NOTE_LOGO:'';
  const rows=(items,render)=>items.map(render).join('');
  const cards=[
   ['Note emesse',issuedMonth.length.toLocaleString('it-IT')],
   ['Totale emesso',ndReportEuro(totalIssued)],
   ['Incassi nel mese',ndReportEuro(totalReceived)],
   ['Da incassare sulle note del mese',ndReportEuro(dueForIssueMonth)]
  ].map(c=>'<div class="stat"><small>'+ndReportEsc(c[0])+'</small><b>'+ndReportEsc(c[1])+'</b></div>').join('');
  const paymentBars=rows(paymentsByMode,x=>{
   const width=Math.round(100*x.total/Math.max(1,...paymentsByMode.map(v=>v.total)));
   return '<div class="bar-row"><strong>'+ndReportEsc(x.name)+'</strong><span class="track"><i style="width:'+width+'%"></i></span><b>'+ndReportEuro(x.total)+'</b></div>';
  });
  const agedRows=rows(ages,x=>'<tr><td>'+ndReportEsc(x.label)+'</td><td class="right">'+x.count+'</td><td class="right">'+ndReportEuro(x.total)+'</td></tr>');
  const detailRows=rows(issuedMonth.slice().sort((a,b)=>String(a.numero||'').localeCompare(String(b.numero||''),'it')),n=>
   '<tr><td>'+ndReportEsc(n.numero||'—')+'</td><td>'+ndReportDate(n.data_documento)+'</td><td>'+ndReportEsc(n.intestatario||'—')+'</td><td class="right">'+ndReportEuro(n.totale)+'</td><td>'+ndReportEsc(modeName(n.modalita_pagamento))+'</td><td>'+ndReportDate(n.data_pagamento)+'</td><td class="right">'+ndReportEuro(isPaidAtCutoff(n)?0:n.totale)+'</td></tr>');
  const brandStyle=[
   '@page{size:A4 portrait;margin:9mm}*{box-sizing:border-box}body{margin:0;background:#e8eef6;color:#12375d;font-family:Arial,Helvetica,sans-serif}',
   '.toolbar{background:#fff;padding:12px;text-align:center;border-bottom:1px solid #ccd5df}.toolbar button{padding:11px 18px;background:#12375d;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer}',
   '.sheet{width:190mm;min-height:270mm;background:#fff;margin:14px auto;padding:0 8mm 12mm;box-shadow:0 7px 25px #12375d22;overflow:hidden}',
   '.stripe{height:9px;margin:0 -8mm 12px;background:linear-gradient(110deg,#12375d 0 75%,#ffd11a 75%)}header{text-align:center}',
   '.logo{width:112px;height:112px;object-fit:contain;display:block;margin:auto}h1{font-size:24px;margin:5px 0;color:#12375d;line-height:1.1}.rule{height:4px;background:#ffd11a;border-radius:4px}',
   '.sub{font-size:13px;margin:8px 0 12px}.month{display:inline-block;background:#12375d;color:#fff;padding:9px 25px;border-radius:25px;font-size:20px;font-weight:900;text-transform:capitalize;margin-bottom:17px}',
   '.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}.stat{border:1px solid #aec0d3;border-radius:10px;overflow:hidden;text-align:center}.stat small{display:block;font-weight:800;min-height:36px;padding:12px 6px 8px}.stat b{display:block;background:#ffe15a;padding:10px 5px;font-size:23px}',
   '.panel{border:1px solid #a9b9cc;border-radius:10px;overflow:hidden;margin:13px 0}.panel h2{background:#12375d;color:#fff;font-size:16px;margin:0;padding:11px 13px}.panel-body{padding:11px 14px}',
   '.bar-row{display:grid;grid-template-columns:102px 1fr 100px;gap:8px;align-items:center;font-size:12px;margin:11px 0}.bar-row b{text-align:right}.track{height:12px;background:#e9eef4;border-radius:10px;overflow:hidden}.track i{display:block;background:#ffd11a;height:100%;border-radius:10px}',
   '.summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}.summary-box{background:#f4f7fb;border:1px solid #d7e0ea;border-radius:8px;padding:12px}.summary-box small{display:block;color:#54657c;font-weight:bold}.summary-box b{display:block;margin-top:6px;font-size:20px}',
   'table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e3eaf1;padding:8px 5px;font-size:11px;text-align:left}th{background:#f1f5fa;font-weight:900}.right{text-align:right}.details table{table-layout:fixed} .details th,.details td{font-size:9px;overflow-wrap:anywhere}',
   '.muted{font-size:10px;color:#66778a;line-height:1.4}.footer{border-top:2px solid #ffd11a;padding-top:9px;margin-top:15px;text-align:center;color:#56677a;font-size:10px}',
   '.second{break-before:page}.second h2{font-size:21px;border-bottom:4px solid #ffd11a;padding-bottom:9px}.private{font-size:11px;font-weight:800;color:#9b2732}',
   '@media print{body{background:#fff;print-color-adjust:exact;-webkit-print-color-adjust:exact}.toolbar{display:none}.sheet{margin:0;width:auto;min-height:0;padding:0;box-shadow:none}.stripe{margin:0 0 12px}.second{break-before:page}.stat,.panel,table{break-inside:avoid}}',
   '@media screen and (max-width:720px){.sheet{width:100%;min-height:0;padding:0 13px 20px}.stripe{margin:0 -13px 12px}.bar-row{grid-template-columns:90px 1fr 85px}}'
  ].join('');
  const agingText='Anzianità calcolata dalla data del documento, non dalla scadenza: il gestionale non registra una data di scadenza per tutte le note.';
  const admin=kind==='admin';
  const html=[
   '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report Note di Debito - '+ndReportEsc(monthLabel)+'</title><style>'+brandStyle+'</style></head><body>',
   '<div class="toolbar"><button onclick="window.print()">🖨 Stampa / Salva PDF</button></div>',
   '<div class="sheet"><div class="stripe"></div><header><img class="logo" src="'+logo+'" alt="Logo Croce Gialla Emergenza ODV"><h1>REPORT MENSILE NOTE DI DEBITO</h1><div class="rule"></div>',
   '<p class="sub">Croce Gialla Emergenza ODV · Dormelletto (NO)</p><div class="month">'+ndReportEsc(monthLabel)+'</div></header>',
   '<section class="cards">'+cards+'</section>',
   '<section class="summary"><div class="summary-box"><small>Residuo delle note emesse nel mese, al '+ndReportDate(through)+'</small><b>'+ndReportEuro(dueForIssueMonth)+'</b></div>',
   '<div class="summary-box"><small>Totale note ancora non pagate, fino al '+ndReportDate(through)+'</small><b>'+ndReportEuro(duePortfolio)+'</b></div></section>',
   '<section class="panel"><h2>Incassi effettivi del mese, per modalità</h2><div class="panel-body">'+paymentBars+'</div></section>',
   '<section class="panel"><h2>Anzianità delle note non incassate · situazione al '+ndReportDate(through)+'</h2><div class="panel-body"><table><thead><tr><th>Fascia</th><th class="right">Note</th><th class="right">Totale</th></tr></thead><tbody>'+agedRows+'</tbody></table><p class="muted">'+ndReportEsc(agingText)+'</p></div></section>',
   '<p class="muted">Le note emesse sono attribuite al mese del documento; gli incassi al mese del pagamento. Un bonifico ricevuto nel mese può riferirsi a una nota precedente. Sono escluse le bozze e le fatture Aruba.</p>',
   '<footer class="footer">Croce Gialla Emergenza ODV · Report economico mensile · '+(admin?'Uso amministrativo riservato':'Riepilogo aggregato senza dati personali')+'</footer></div>',
   admin?'<div class="sheet second details"><div class="stripe"></div><h2>Dettaglio amministrativo · '+ndReportEsc(monthLabel)+'</h2><p class="private">DOCUMENTO RISERVATO · NON DISTRIBUIRE AL PERSONALE</p><p>Note emesse nel periodo: '+issuedMonth.length+' · Totale '+ndReportEuro(totalIssued)+' · Residuo al '+ndReportDate(through)+' '+ndReportEuro(dueForIssueMonth)+'</p><table><thead><tr><th>Nota</th><th>Data</th><th>Intestatario</th><th class="right">Totale</th><th>Pagamento</th><th>Pagata il</th><th class="right">Residuo</th></tr></thead><tbody>'+(detailRows||'<tr><td colspan="7">Nessuna nota emessa nel mese.</td></tr>')+'</tbody></table><p class="muted">Il residuo considera soltanto il pagamento integrale registrato nella Nota di Debito. Non rappresenta eventuali acconti registrati in sistemi esterni.</p><footer class="footer">Croce Gialla Emergenza ODV · Uso amministrativo · Generato il '+new Date().toLocaleString('it-IT')+'</footer></div>':'',
   '</body></html>'
  ].join('');
  popup.document.open();popup.document.write(html);popup.document.close();popup.focus();
 }catch(e){
  popup.document.open();popup.document.write('<!doctype html><meta charset="utf-8"><p style="font:16px Arial;padding:25px">Errore nella preparazione del report: '+ndReportEsc(e?.message||e)+'</p>');popup.document.close();
 }
}
