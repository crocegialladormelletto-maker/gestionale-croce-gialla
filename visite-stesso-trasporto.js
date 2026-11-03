/* Croce Gialla — più appuntamenti nello stesso trasporto */
(function(){
  if(typeof ordDrawDay!=='function'||typeof sb==='undefined')return;
  const oldDraw=ordDrawDay;
  const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isEditable=s=>s&&s.data_servizio>=todaySafe()&&!['CHIUSO','ANNULLATO','TERMINATO','DA CONTABILIZZARE'].includes(String(s.stato_gestionale||'').toUpperCase());
  const visits=s=>Array.isArray(s?.appuntamenti_visite)?s.appuntamenti_visite:[];
  let saving=false;
  function draw(){
    oldDraw();
    document.querySelectorAll('#ordDayList .ord-card[data-ord-id]').forEach(card=>{
      const s=ordItems.find(x=>String(x.id)===card.dataset.ordId);
      if(!s)return;
      const list=visits(s);
      if(list.length>=2){
        const info=document.createElement('div');info.className='notice';
        info.style.cssText='margin:8px 0;border-left:5px solid #e3b900;padding:8px';
        info.innerHTML='<strong>🔁 '+(list.length===2?'DOPPIA VISITA':'VISITE MULTIPLE')+'</strong>'+
         list.map((v,i)=>'<div>'+(i+1)+'ª visita: '+safe(v.ora||'—')+' · '+safe(v.reparto||'—')+'</div>').join('');
        card.querySelector('.actions')?.before(info);
      }
      if(!isEditable(s))return;
      const btn=document.createElement('button');btn.type='button';btn.className='btn yellow';
      btn.textContent='🕒 Orari visite ('+list.length+')';
      card.querySelector('.actions')?.append(btn);
      btn.onclick=()=>edit(s,card);
    });
  }
  function edit(s,card){
    const editor=card.querySelector('.ord-editor');
    if(!editor)return;
    const appointments=visits(s);
    const rows=appointments.length?appointments:[{ora:'',reparto:''},{ora:'',reparto:''}];
    editor.innerHTML='<div style="border:1px solid #e4be00;border-radius:10px;padding:12px;margin-top:10px">'+
     '<h3>Appuntamenti dello stesso trasporto</h3><p class="muted">Un solo servizio e un solo foglio viaggio. Aggiungi gli orari e i reparti delle visite.</p>'+
     '<div data-visit-list></div><div class="actions"><button type="button" class="btn secondary" data-visit-add>+ Aggiungi visita</button>'+
     '<button type="button" class="btn yellow" data-visit-save>Salva appuntamenti</button>'+
     '<button type="button" class="btn secondary" data-visit-cancel>Chiudi</button></div><div data-visit-feedback role="status"></div></div>';
    const list=editor.querySelector('[data-visit-list]');
    function add(v={}){
      const el=document.createElement('div');el.style.cssText='display:grid;grid-template-columns:1fr 2fr auto;gap:8px;align-items:end;margin:8px 0';
      el.innerHTML='<label>Orario visita<input type="time" data-visit-time required value="'+safe(v.ora||'')+'"></label>'+
        '<label>Ospedale / reparto<input data-visit-place required maxlength="250" placeholder="Es. Cardiologia" value="'+safe(v.reparto||'')+'"></label>'+
        '<button type="button" class="btn secondary" data-visit-remove>Rimuovi</button>';
      el.querySelector('[data-visit-remove]').onclick=()=>{if(list.children.length>1)el.remove()};
      list.append(el);
    }
    rows.forEach(add);
    editor.querySelector('[data-visit-add]').onclick=()=>{if(list.children.length>=10)return;add()};
    editor.querySelector('[data-visit-cancel]').onclick=()=>editor.replaceChildren();
    editor.querySelector('[data-visit-save]').onclick=async()=>{
      if(saving)return;
      const all=[...list.children].map(el=>({
        ora:el.querySelector('[data-visit-time]').value,
        reparto:el.querySelector('[data-visit-place]').value.trim()
      }));
      const feedback=editor.querySelector('[data-visit-feedback]');
      if(all.some(v=>!v.ora||!v.reparto)){feedback.textContent='Completa orario e reparto per ciascuna visita.';return}
      if(new Set(all.map(v=>v.ora+'|'+v.reparto.toLowerCase())).size!==all.length){
        feedback.textContent='Hai inserito due volte lo stesso appuntamento.';return;
      }
      saving=true;editor.querySelector('[data-visit-save]').disabled=true;
      try{
        const result=await sb.from('servizi_giornalieri')
          .update({appuntamenti_visite:all}).eq('id',s.id).eq('updated_at',s.updated_at).select('id');
        if(result.error)throw result.error;
        if(!result.data?.length)throw Error('Il servizio è stato modificato. Ricarica il calendario e riprova.');
        await loadOrdinaryCalendar();
        if(typeof loadOperationalCalendar==='function')await loadOperationalCalendar();
        if(typeof msg==='function')msg('ordMsg','Appuntamenti salvati nello stesso trasporto.','ok');
      }catch(e){feedback.textContent='Errore salvataggio: '+(e.message||String(e))}
      finally{saving=false;const button=editor.querySelector('[data-visit-save]');if(button)button.disabled=false}
    };
  }
  ordDrawDay=draw;
})();
/* Accesso diretto dalla schermata Calendario servizi principale */
(function(){
 const $=id=>document.getElementById(id);
 const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function launch(){
  $('cgeMainVisitsDialog')?.remove();
  const dialog=document.createElement('dialog');dialog.id='cgeMainVisitsDialog';
  dialog.style.cssText='border:2px solid #e6bb00;border-radius:12px;padding:20px;max-width:800px;width:94%;max-height:90vh;overflow:auto';
  dialog.innerHTML='<h2>🕒 Visite nello stesso trasporto</h2><p>Seleziona la data e il servizio già programmato. Gli appuntamenti restano collegati a un solo foglio viaggio.</p>'+
  '<label>Data del trasporto <input id="cgeVisitsDate" type="date" value="2026-11-23"></label>'+
  '<div id="cgeVisitsServices" style="margin:12px 0"></div><div id="cgeVisitsEditor"></div>'+
  '<button type="button" class="btn secondary" id="cgeVisitsClose">Chiudi</button>';
  document.body.append(dialog);
  $('cgeVisitsClose').onclick=()=>dialog.close();
  dialog.onclose=()=>dialog.remove();
  async function search(){
   const root=$('cgeVisitsServices');root.textContent='Caricamento trasporti...';$('cgeVisitsEditor').replaceChildren();
   const result=await sb.from('servizi_giornalieri').select('id,data_servizio,paziente_nome,paziente_cognome,destinazione,tipo_servizio,appuntamenti_visite,updated_at,stato_gestionale')
      .eq('data_servizio',$('cgeVisitsDate').value).order('ora_prevista');
   if(result.error){root.textContent='Errore: '+result.error.message;return}
   const services=(result.data||[]).filter(s=>!['ANNULLATO','CHIUSO','TERMINATO'].includes(s.stato_gestionale));
   root.replaceChildren();
   if(!services.length){root.textContent='Nessun trasporto modificabile in questa data.';return}
   services.forEach(s=>{
    const b=document.createElement('button');b.type='button';b.className='btn secondary';
    b.style.cssText='display:block;width:100%;text-align:left;margin:5px 0';
    b.textContent=[s.paziente_cognome,s.paziente_nome,s.tipo_servizio,s.destinazione].filter(Boolean).join(' · ');
    b.onclick=()=>editor(s);root.append(b);
   });
  }
  function editor(s){
   const root=$('cgeVisitsEditor');root.replaceChildren();
   const title=document.createElement('h3');title.textContent='Appuntamenti per '+[s.paziente_nome,s.paziente_cognome].filter(Boolean).join(' ');root.append(title);
   const list=document.createElement('div');root.append(list);
   const existing=Array.isArray(s.appuntamenti_visite)?s.appuntamenti_visite:[];
   function add(v={}){
    const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:1fr 2fr auto;gap:8px;margin:8px 0';
    row.innerHTML='<label>Orario<input type="time" required value="'+escapeHtml(v.ora||'')+'"></label>'+
    '<label>Ospedale / reparto<input maxlength="250" required value="'+escapeHtml(v.reparto||'')+'"></label>'+
    '<button type="button" class="btn secondary">Rimuovi</button>';
    row.querySelector('button').onclick=()=>{if(list.children.length>1)row.remove()};
    list.append(row);
   }
   (existing.length?existing:[{},{}]).forEach(add);
   const addBtn=document.createElement('button');addBtn.type='button';addBtn.className='btn secondary';addBtn.textContent='+ Aggiungi visita';
   addBtn.onclick=()=>{if(list.children.length<10)add()};root.append(addBtn);
   const save=document.createElement('button');save.type='button';save.className='btn yellow';save.style.margin='8px';save.textContent='Salva orari visite';root.append(save);
   const feedback=document.createElement('div');root.append(feedback);
   save.onclick=async()=>{
    const visits=[...list.children].map(row=>({ora:row.querySelector('input[type=time]').value,reparto:row.querySelector('input:not([type=time])').value.trim()}));
    if(visits.some(v=>!v.ora||!v.reparto)){feedback.textContent='Inserisci tutti gli orari e i reparti.';return}
    save.disabled=true;feedback.textContent='Salvataggio...';
    const result=await sb.from('servizi_giornalieri').update({appuntamenti_visite:visits})
      .eq('id',s.id).eq('updated_at',s.updated_at).select('id,updated_at');
    save.disabled=false;
    if(result.error){feedback.textContent='Errore: '+result.error.message;return}
    if(!result.data?.length){feedback.textContent='Il servizio è stato aggiornato altrove: chiudi e riapri.';return}
    s.appuntamenti_visite=visits;s.updated_at=result.data[0].updated_at;
    feedback.textContent='✓ Visite salvate sullo stesso trasporto.';
    if(typeof loadOrdinaryCalendar==='function')loadOrdinaryCalendar();
    if(typeof loadOperationalCalendar==='function')loadOperationalCalendar();
   };
  }
  $('cgeVisitsDate').onchange=search;
  dialog.showModal();search();
 }
 function attach(){
  const anchor=$('calMsg');
  if(!anchor||$('cgeMainVisitsButton'))return;
  const b=document.createElement('button');b.id='cgeMainVisitsButton';b.type='button';b.className='btn yellow';
  b.style.cssText='margin:8px 8px 8px 0';b.textContent='🕒 Visite nello stesso trasporto';b.onclick=launch;
  anchor.parentElement.insertBefore(b,anchor);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();

/* Visualizzazione degli orari quando si apre una scheda servizio. */
(function(){
 if(typeof window.openService!=='function')return;
 const originalOpen=window.openService;
 const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let requestNumber=0;
 function renderPanel(service){
   document.getElementById('cgeServiceVisitsPanel')?.remove();
   const items=Array.isArray(service?.appuntamenti_visite)?service.appuntamenti_visite:[];
   if(!items.length)return;
   const panel=document.createElement('aside');
   panel.id='cgeServiceVisitsPanel';
   panel.setAttribute('aria-label','Orari delle visite del servizio');
   panel.style.cssText='position:fixed;right:20px;bottom:20px;z-index:2147483000;width:min(430px,calc(100vw - 40px));max-height:65vh;overflow:auto;background:white;color:#14305a;border:3px solid #e9bf00;border-radius:12px;box-shadow:0 12px 45px #0005;padding:15px;font:inherit';
   const heading=document.createElement('div');heading.style.cssText='display:flex;justify-content:space-between;gap:8px;align-items:center';
   heading.innerHTML='<strong>🕒 '+(items.length===2?'DOPPIA VISITA':'VISITE DEL TRASPORTO')+'</strong>';
   const close=document.createElement('button');close.type='button';close.textContent='✕';close.setAttribute('aria-label','Chiudi riepilogo visite');close.className='btn secondary';
   close.onclick=()=>panel.remove();heading.append(close);panel.append(heading);
   const sub=document.createElement('p');sub.style.cssText='margin:6px 0;color:#456';
   sub.textContent=[service.paziente_cognome,service.paziente_nome,service.data_servizio].filter(Boolean).join(' · ');
   panel.append(sub);
   items.forEach((v,i)=>{
     const line=document.createElement('div');line.style.cssText='padding:9px 0;border-top:1px solid #e2e7ef';
     const title=document.createElement('strong');title.textContent=(i+1)+'ª visita — '+(v.ora||'Orario da definire');line.append(title);
     const dest=document.createElement('div');dest.textContent=v.reparto||'Reparto da definire';line.append(dest);panel.append(line);
   });
   const foot=document.createElement('small');foot.textContent='Un solo servizio e un solo foglio viaggio.';panel.append(foot);
   document.body.append(panel);
 }
 window.openService=function(id,...args){
   const seq=++requestNumber;
   const output=originalOpen.call(this,id,...args);
   Promise.resolve(output).then(async()=>{
     const found=await sb.from('servizi_giornalieri').select('id,data_servizio,paziente_nome,paziente_cognome,appuntamenti_visite').eq('id',id).maybeSingle();
     if(seq===requestNumber&&!found.error&&found.data)renderPanel(found.data);
   }).catch(()=>{});
   return output;
 };
})();
