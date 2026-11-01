/* Croce Gialla — stampa riepiloghi mensili: ordinari + 118, anche per Centralino. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>{if(!v)return '—';const [y,m,d]=String(v).slice(0,10).split('-');return d&&m&&y?d+'/'+m+'/'+y:String(v)};
const monthName=v=>{const [y,m]=String(v||'').split('-').map(Number);return y&&m?new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)):'Mese'};
const kms=x=>Number(x.km_percorsi??(x.km_arrivo!=null&&x.km_partenza!=null?Math.max(0,Number(x.km_arrivo)-Number(x.km_partenza)):0))||0;
const closed=x=>String(x.stato||'').toUpperCase()==='CHIUSO';
const logo=typeof LOGO_URL!=='undefined'?LOGO_URL:'';
const allowed=()=>typeof prof!=='undefined'&&['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo);
function showError(id,error){const target=$(id);if(target)target.textContent=String(error?.message||error||'Errore di stampa')}
function popup(){
 const win=window.open('','_blank');
 if(!win){alert('Il browser ha bloccato la finestra. Consenti i popup per il gestionale per stampare.');return null}
 win.document.open();
 win.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Preparazione riepilogo</title></head><body style="font:17px Arial;padding:28px"><h2>Preparazione della stampa…</h2><p>La finestra di stampa si aprirà automaticamente. Se non compare, usa il pulsante «Stampa ora» nel documento.</p></body></html>');
 win.document.close();
 return win;
}
function writeReport(win,{type,month,rows,columns,printedCount,printedKm,vehicles}){
 if(!win||win.closed)return;
 const cols=columns.map(c=>'<th>'+safe(c.label)+'</th>').join('');
 const body=rows.map(x=>'<tr>'+columns.map(c=>'<td'+(c.numeric?' class="num"':'')+'>'+safe(c.value(x))+'</td>').join('')+'</tr>').join('');
 const doc='<!doctype html><html lang="it"><head><meta charset="utf-8"><title>'+safe(type)+' — '+safe(monthName(month))+'</title><style>'+
 '@page{size:A4 landscape;margin:9mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#19364b;margin:0;font-size:11px}.actions{background:#f0f5fc;padding:12px 16px;display:flex;gap:12px;align-items:center;margin-bottom:14px;border:1px solid #ccd9e5;border-radius:7px}.actions button{background:#174778;color:white;border:0;border-radius:7px;padding:11px 18px;font-size:15px;font-weight:bold;cursor:pointer}.actions span{font-size:13px}.head{display:flex;align-items:center;gap:13px;padding-bottom:12px;border-bottom:4px solid #153b60}.head img{height:70px;width:70px;object-fit:contain}.org{flex:1}.org h1{font-size:21px;margin:0;color:#153b60}.org p{font-size:11px;color:#49677e}.doc-title{text-align:right}.doc-title h2{font-size:20px;margin:0;color:#ae202a}.doc-title strong{font-size:15px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0}.card{border:1px solid #b7c8d5;padding:10px;border-radius:6px}.card small{font-size:10px;font-weight:bold;color:#526b7e;display:block}.card strong{font-size:19px;color:#153b60;display:block;margin-top:4px}.meta{color:#526878;margin:10px 0 13px;font-size:11px}.bar{background:#ecf3f9;border-left:6px solid #f4c400;padding:9px;font-size:13px;font-weight:bold;margin:10px 0 8px}table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1px solid #adbecb;padding:7px 6px;vertical-align:top;overflow-wrap:anywhere}th{background:#153b60;color:white;font-weight:bold;font-size:10.5px;text-align:left}td{font-size:11px;line-height:1.35}tbody tr:nth-child(even){background:#f2f6fa}tr{break-inside:avoid}.num{text-align:right;white-space:nowrap}footer{border-top:1px solid #cbd5df;padding-top:9px;margin-top:13px;color:#526878;font-size:10px}@media print{.actions{display:none!important}body{font-size:10.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}th{font-size:10px}td{font-size:10.5px;padding:6px 5px}thead{display:table-header-group}tr{break-inside:avoid}}'+
 '</style></head><body><div class="actions"><button id="printNow" type="button">🖨 Stampa ora / Salva PDF</button><span>Se la finestra di stampa non compare automaticamente, premi questo pulsante. Puoi scegliere «Salva come PDF».</span></div>'+
 '<header class="head">'+(logo?'<img src="'+safe(logo)+'" alt="Logo Croce Gialla">':'')+'<div class="org"><h1>CROCE GIALLA EMERGENZA ODV</h1><p>Dormelletto (NO) · Registro mensile servizi</p></div><div class="doc-title"><h2>'+safe(type.toUpperCase())+'</h2><strong>'+safe(monthName(month).toUpperCase())+'</strong></div></header>'+
 '<div class="cards"><div class="card"><small>SERVIZI EFFETTUATI / FOGLI CHIUSI</small><strong>'+printedCount+'</strong></div><div class="card"><small>KM TOTALI DEI FOGLI CHIUSI</small><strong>'+printedKm.toLocaleString('it-IT')+' km</strong></div><div class="card"><small>TOTALE FOGLI DEL MESE</small><strong>'+rows.length+'</strong></div><div class="card"><small>MEZZI UTILIZZATI</small><strong>'+safe(vehicles||'—')+'</strong></div></div>'+
 '<p class="meta">Periodo: '+safe(monthName(month))+' · Data stampa: '+safe(new Date().toLocaleString('it-IT'))+' · Valori calcolati sull’intero mese, indipendentemente dai filtri di ricerca · Importi esclusi</p>'+
 '<div class="bar">Dettaglio dei fogli viaggio</div><table><thead><tr>'+cols+'</tr></thead><tbody>'+body+'</tbody></table><footer>Croce Gialla Emergenza ODV · '+safe(type)+' · '+safe(monthName(month))+' · '+printedCount+' servizi effettuati · '+printedKm.toLocaleString('it-IT')+' km</footer></body></html>';
 win.document.open();win.document.write(doc);win.document.close();
 win.document.getElementById('printNow').onclick=()=>{win.focus();win.print()};
 // La finestra rimane stampabile anche quando il browser blocca il dialogo automatico.
 win.setTimeout(()=>{try{win.focus();win.print()}catch(e){console.warn('Stampa automatica non consentita:',e)}},650);
}
async function loadOrd(month){
 const [y,m]=month.split('-').map(Number);
 if(!y||!m||m<1||m>12)throw Error('Seleziona un mese valido.');
 const start=month+'-01',end=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
 const all=[];
 for(let offset=0;offset<10000;offset+=1000){
  const q=await sb.from('fogli_viaggio').select('id,numero_foglio,progressivo,data_servizio,mezzo,tipo_servizio,paziente_cognome,paziente_nome,luogo_partenza,destinazione,stato,km_partenza,km_arrivo,km_percorsi')
   .neq('tipo_servizio','118').gte('data_servizio',start).lt('data_servizio',end).order('data_servizio').order('progressivo').range(offset,offset+999);
  if(q.error)throw q.error;
  all.push(...(q.data||[]));
  if((q.data||[]).length<1000)break;
 }
 return all;
}
function ordColumns(){
 return [
 {label:'Data',value:x=>dt(x.data_servizio)},
 {label:'Foglio',value:x=>typeof displayFoglioNumero==='function'?displayFoglioNumero(x):x.numero_foglio||x.progressivo||'—'},
 {label:'Mezzo',value:x=>x.mezzo||'—'},
 {label:'Tipo servizio',value:x=>x.tipo_servizio||'—'},
 {label:'Paziente',value:x=>[x.paziente_cognome,x.paziente_nome].filter(Boolean).join(' ')||'—'},
 {label:'Percorso',value:x=>(x.luogo_partenza||'—')+' → '+(x.destinazione||'—')},
 {label:'Stato',value:x=>x.stato||'—'},
 {label:'KM inizio',value:x=>x.km_partenza??'—',numeric:true},
 {label:'KM fine',value:x=>x.km_arrivo??'—',numeric:true},
 {label:'KM effettuati',value:x=>x.km_percorsi??((x.km_arrivo!=null&&x.km_partenza!=null)?kms(x):'—'),numeric:true}
 ];
}
async function printOrdMonth(){
 if(!allowed())return;
 const month=$('fvArchiveMonth')?.value;
 if(!month){showError('fvArchiveMsg','Seleziona prima un mese nell’Archivio fogli viaggio.');return}
 const win=popup();if(!win)return;
 try{
  const rows=await loadOrd(month),performed=rows.filter(closed);
  if(!rows.length){win.document.body.innerHTML='<h2>Nessun foglio viaggio nel mese selezionato.</h2>';return}
  writeReport(win,{type:'Riepilogo fogli viaggio ordinari',month,rows,columns:ordColumns(),printedCount:performed.length,printedKm:performed.reduce((v,x)=>v+kms(x),0),vehicles:[...new Set(performed.map(x=>x.mezzo).filter(Boolean))].sort().join(', ')});
 }catch(e){showError('fvArchiveMsg',e);win.document.body.innerHTML='<h2>Impossibile preparare il riepilogo</h2><p>'+safe(e.message||e)+'</p>'}
}
async function load118(month){
 const [y,m]=month.split('-').map(Number),start=month+'-01',end=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
 const all=[];
 for(let offset=0;offset<10000;offset+=1000){
  const q=await sb.from('fogli_viaggio').select('id,numero_foglio,progressivo,data_servizio,mezzo,numero_scheda_118,luogo_partenza,luogo_carico,destinazione,ospedale_destinazione,luogo_rientro,ora_arrivo_dea,stato,km_partenza,km_arrivo,km_percorsi')
    .eq('tipo_servizio','118').gte('data_servizio',start).lt('data_servizio',end).order('data_servizio').order('progressivo').range(offset,offset+999);
  if(q.error)throw q.error;
  all.push(...(q.data||[]));
  if((q.data||[]).length<1000)break;
 }
 return all;
}
function columns118(){
 return [
 {label:'Data',value:x=>dt(x.data_servizio)},
 {label:'Foglio',value:x=>x.numero_foglio||'—'},
 {label:'Scheda 118',value:x=>x.numero_scheda_118||'—'},
 {label:'Mezzo',value:x=>x.mezzo||'—'},
 {label:'Percorso',value:x=>[x.luogo_partenza,x.luogo_carico,x.ospedale_destinazione||x.destinazione,x.luogo_rientro].filter(Boolean).join(' → ')||'—'},
 {label:'Arrivo DEA',value:x=>x.ora_arrivo_dea?String(x.ora_arrivo_dea).slice(0,5):'—'},
 {label:'Stato',value:x=>x.stato||'—'},
 {label:'KM inizio',value:x=>x.km_partenza??'—',numeric:true},
 {label:'KM fine',value:x=>x.km_arrivo??'—',numeric:true},
 {label:'KM effettuati',value:x=>x.km_percorsi??((x.km_partenza!=null&&x.km_arrivo!=null)?kms(x):'—'),numeric:true}
 ];
}
async function print118Month(month){
 if(!allowed()||!month)return;
 const win=popup();if(!win)return;
 try{
  const rows=await load118(month),performed=rows.filter(closed);
  if(!rows.length){win.document.body.innerHTML='<h2>Nessun foglio 118 nel mese selezionato.</h2>';return}
  writeReport(win,{type:'Riepilogo fogli viaggio 118',month,rows,columns:columns118(),printedCount:performed.length,printedKm:performed.reduce((v,x)=>v+kms(x),0),vehicles:[...new Set(performed.map(x=>x.mezzo).filter(Boolean))].sort().join(', ')});
 }catch(e){showError('fv118MonthMsg',e);win.document.body.innerHTML='<h2>Impossibile preparare il riepilogo</h2><p>'+safe(e.message||e)+'</p>'}
}
const archiveRefresh=$('fvArchiveRefresh');
if(archiveRefresh&&$('fvArchivePanel')){
 const print=document.createElement('button');
 print.type='button';print.id='fvArchivePrint';print.className='btn blue';print.textContent='🖨 Stampa riepilogo mese / Salva PDF';
 archiveRefresh.insertAdjacentElement('afterend',print);
 print.onclick=printOrdMonth;
}
if($('fv118MonthPrint'))$('fv118MonthPrint').onclick=()=>print118Month($('fv118Month')?.value);
if($('fv118ArchivePrint'))$('fv118ArchivePrint').onclick=()=>print118Month($('fv118ArchiveMonth')?.value);
window.cgeMonthlyPrint={printOrdMonth,print118Month};
})();