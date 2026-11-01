async function printStaffMonthlyReport(origin){
 const ym=origin==='archive'?document.getElementById('meseArchivio')?.value:ymNow();
 if(!/^\d{4}-\d{2}$/.test(ym||'')){alert('Seleziona un mese valido');return;}
 const w=window.open('','_blank');
 if(!w){alert('Consenti i popup per aprire la stampa.');return;}
 w.document.write('<!doctype html><meta charset="utf-8"><title>Report in preparazione</title><p style="font:16px Arial;padding:24px">Caricamento dati del registro...</p>');
 w.document.close();
 const yyyy=Number(ym.slice(0,4)),mm=Number(ym.slice(5,7));
 const end=new Date(Date.UTC(yyyy,mm,1)).toISOString().slice(0,10);
 try{
  const all=[];
  for(let offset=0;offset<10000;offset+=1000){
   const result=await sb.from('registro_viaggi')
    .select('data,stato,tipo_servizio,scheda_118,mezzo,km_percorsi,km_iniziali,km_finali')
    .gte('data',ym+'-01').lt('data',end).eq('stato','CHIUSO').is('eliminato_at',null)
    .order('data',{ascending:true}).range(offset,offset+999);
   if(result.error)throw result.error;
   all.push(...(result.data||[]));
   if((result.data||[]).length<1000)break;
  }
  const label=new Date(yyyy,mm-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const fmt=n=>Number(n||0).toLocaleString('it-IT');
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kmOf=x=>Number(x.km_percorsi??(x.km_iniziali!=null&&x.km_finali!=null?Math.max(0,x.km_finali-x.km_iniziali):0))||0;
  const classify=x=>{
   const type=String(x.tipo_servizio||'').trim().toLowerCase();
   if(type==='emergenza / urgenza'||type==='118'||String(x.scheda_118||'').trim())return '118';
   if(type.includes('assistenza'))return 'assistenze';
   if(['dimissione','visita','trasferimento','trasporto semplice','trasporto ordinario'].includes(type))return 'ordinari';
   return 'altri';
  };
  const types=[
   {key:'118',label:'Interventi 118'},
   {key:'ordinari',label:'Trasporti ordinari e visite'},
   {key:'assistenze',label:'Assistenze manifestazioni'},
   {key:'altri',label:'Sociali, interni e altri'}
  ].map(g=>({key:g.key,label:g.label,n:all.filter(x=>classify(x)===g.key).length}));
  const cars=[...new Set(['06','07','08','09',...all.map(x=>x.mezzo).filter(Boolean)])].sort().map(code=>{
   const a=all.filter(x=>String(x.mezzo)===String(code));
   return {code,n:a.length,km:Math.round(a.reduce((sum,x)=>sum+kmOf(x),0))};
  });
  const totalKm=Math.round(all.reduce((sum,x)=>sum+kmOf(x),0));
  const bar=(label,n,max,other,blue)=>{
   const pct=Math.round(100*n/Math.max(1,max));
   return '<div class="bar-row"><span>'+safe(label)+'</span><div class="bar-track"><i class="'+(blue?'navy':'gold')+'" style="width:'+pct+'%"></i></div><strong>'+fmt(n)+'</strong>'+(other?'<small>'+safe(other)+'</small>':'')+'</div>';
  };
  const carBars=cars.map(c=>bar('Mezzo '+c.code,c.n,Math.max(...cars.map(v=>v.n),1),fmt(c.km)+' km',false)).join('');
  const typeBars=types.map(t=>bar(t.label,t.n,Math.max(...types.map(v=>v.n),1),'',true)).join('');
  const logo='https://primary.jwwb.nl/public/s/b/j/temp-jdsqfuxejozahvwvidxb/logo-ridimensionato-no-sfondo-high.png?enable=upscale&enable-io=true&height=320';
  const css=[
   '@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#eaf0f7;font-family:Arial,Helvetica,sans-serif;color:#12355e}',
   '.tools{text-align:center;padding:10px;background:#fff;border-bottom:1px solid #d9e2ed}.tools button{background:#14376a;color:white;border:0;border-radius:8px;padding:12px 18px;font-weight:bold;cursor:pointer;margin:0 4px}',
   '.page{background:#fff;max-width:190mm;min-height:267mm;margin:15px auto;box-shadow:0 8px 22px #14376a22;padding:0 8mm 8mm;position:relative;overflow:hidden}.page:before{content:"";position:absolute;left:-12px;top:0;width:170px;height:150px;background:linear-gradient(135deg,#103a76 0 34%,#ffd313 34% 45%,transparent 45%);pointer-events:none}.page:after{content:"";position:absolute;right:-30px;top:95px;width:190px;height:120px;background:linear-gradient(138deg,transparent 0 45%,#ffd313 45% 54%,#0e396e 54% 64%,transparent 64%);pointer-events:none}',
   '.top{height:5px;margin:0 -8mm 10px;background:transparent}header{text-align:center;position:relative;z-index:1}',
   'header img{width:228px;height:228px;object-fit:contain;display:block;margin:0 auto 5px}h1{font-size:31px;line-height:1.12;letter-spacing:-.4px;margin:2px auto 5px;font-weight:1000;white-space:nowrap}',
   '.accent{height:5px;background:#ffcf00;border-radius:2px;margin:9px 0 7px}.subtitle{font-size:15px;margin:0 0 12px}',
   '.month{display:inline-block;background:#12376e;color:white;border-radius:29px;padding:10px 30px;text-transform:capitalize;font-size:23px;font-weight:900;margin:3px 0 19px}',
   '.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:18px}.card{border:1.5px solid #163d6a;border-radius:11px;text-align:center;overflow:hidden;background:linear-gradient(#fff,#fffef9)}',
   '.card .label{display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;min-height:63px;padding:12px 3px 7px}.card .value{display:block;background:linear-gradient(#ffe983,#ffda22);font-size:29px;font-weight:1000;padding:9px 2px}',
   '.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{border:1.5px solid #12376e;border-radius:11px;overflow:hidden;min-height:244px}.panel h2{background:#12376e;color:#fff;font-size:17px;padding:12px;margin:0}.panel main{padding:12px 10px}',
   '.bar-row{display:grid;grid-template-columns:103px 1fr 38px;align-items:center;gap:6px;margin:10px 0 16px;font-size:10px}.bar-row span{font-weight:bold}.bar-row strong{text-align:right}.bar-row small{grid-column:2/4;text-align:right;color:#6a7c90;font-size:9px}',
   '.bar-track{height:11px;border-radius:8px;background:#e6eaf0;overflow:hidden}.bar-track i{display:block;height:100%;border-radius:8px}.bar-track i.gold{background:#fbcf1e}.bar-track i.navy{background:#12376e}',
   '.thanks{margin-top:18px;background:linear-gradient(110deg,#fff4bd,#fffaf0);border:2px solid #f0c600;border-radius:11px;padding:18px 14px;display:flex;align-items:center;gap:14px}.thanks b{font-size:15px;line-height:1.4;font-style:italic}.thanks .icon{font-size:30px}',
   '.note{font-size:9px;line-height:1.35;color:#64758b;margin:12px 0 8px}.footer{margin-top:8px;padding:11px 0;border-top:2px solid #ffce00;text-align:center;font-size:9px;color:#607087}',
   '@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.tools{display:none}.page{max-width:none;min-height:0;margin:0;box-shadow:none;padding:0}.top{margin:0 0 8px}.cards,.cols,.panel,.thanks{break-inside:avoid}}',
   '@media screen and (max-width:690px){.page{width:100%;min-height:0;padding:0 12px 15px}.top{margin:0 -12px 12px}.cols{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,1fr)}}'
  ].join('');
  const stats=[
   ['Servizi effettuati',fmt(all.length)],
   ['Chilometri percorsi',fmt(totalKm)+' km'],
   ['Interventi 118',fmt(types[0].n)],
   ['Mezzi operativi',fmt(cars.filter(x=>x.n>0).length)]
  ].map(x=>'<div class="card"><span class="label">'+safe(x[0])+'</span><b class="value">'+safe(x[1])+'</b></div>').join('');
  const html=[
   '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report attività '+safe(label)+'</title><style>',css,'</style></head><body>',
   '<div class="tools"><button onclick="window.print()">Stampa / Salva PDF</button><button onclick="window.close()">Chiudi</button></div>',
   '<div class="page"><div class="top"></div><header><img src="'+safe(logo)+'" alt="Logo Croce Gialla Emergenza ODV"><h1>REPORT MENSILE DELLE ATTIVITÀ</h1><div class="accent"></div>',
   '<p class="subtitle">Croce Gialla Emergenza ODV · Dormelletto (NO)</p><div class="month">'+safe(label)+'</div></header>',
   '<section class="cards">',stats,'</section>',
   '<section class="cols"><div class="panel"><h2>Attività per mezzo</h2><main>',carBars,'</main></div>',
   '<div class="panel"><h2>Suddivisione attività</h2><main>',typeBars,'</main></div></section>',
   '<div class="thanks"><span class="icon">🤝</span><b>Grazie a tutti i volontari e dipendenti per l’impegno, la disponibilità e il servizio svolto a favore della comunità.</b></div>',
   '<p class="note">Riepilogo dei servizi chiusi registrati nel periodo. Le categorie sono aggregate per tipologia e possono variare in seguito a rettifiche autorizzate.</p>',
   '<footer class="footer">Documento informativo per il personale · Nessun dato sanitario o personale riportato · Generato il '+safe(new Date().toLocaleString('it-IT'))+'</footer>',
   '</div></body></html>'
  ].join('');
  w.document.open();w.document.write(html);w.document.close();w.focus();
 }catch(error){
  w.document.open();w.document.write('<!doctype html><meta charset="utf-8"><p style="font:16px Arial;padding:20px">Impossibile creare il report: '+String(error?.message||error).replace(/[&<>]/g,'')+'</p>');w.document.close();
 }
}
