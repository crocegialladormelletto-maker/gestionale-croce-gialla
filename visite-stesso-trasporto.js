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

/* Visite dentro la scheda servizio e tablet; nessun popup. */
(function(){
 const el=id=>document.getElementById(id);
 const safe=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const entries=s=>Array.isArray(s?.appuntamenti_visite)?s.appuntamenti_visite:[];
 let active=0,tabletActive=0;
 function showMain(s){
  el('cgeVisitDetailInline')?.remove();
  const first=el('detailForm')?.querySelector('.section');
  if(!first||!s||el('serviceDetail')?.classList.contains('hidden'))return;
  const p=document.createElement('section');p.className='section';p.id='cgeVisitDetailInline';
  p.style.cssText='border:2px solid #dbb800;background:#fffdf1';
  p.innerHTML='<h3>🔁 Orari delle visite</h3><p class="muted">Stesso trasporto, un solo foglio viaggio.</p><div data-list></div>'+
   '<div class="actions" style="margin-top:10px"><button class="btn secondary" type="button" data-add>+ Aggiungi visita</button>'+
   '<button class="btn yellow" type="button" data-save>Salva appuntamenti</button></div><div data-status role="status"></div>';
  first.after(p);const list=p.querySelector('[data-list]');
  const add=v=>{
   const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:1fr 2fr auto;gap:8px;margin:8px 0;align-items:end';
   row.innerHTML='<label>Orario visita<input type="time" data-time value="'+safe(v?.ora||'')+'"></label>'+
   '<label>Ospedale / reparto<input type="text" data-place maxlength="250" value="'+safe(v?.reparto||'')+'"></label>'+
   '<button type="button" class="btn secondary" data-remove>Rimuovi</button>';
   row.querySelector('[data-remove]').onclick=()=>{if(list.children.length>1)row.remove()};
   list.append(row);
  };
  (entries(s).length?entries(s):[{},{}]).forEach(add);
  p.querySelector('[data-add]').onclick=()=>{if(list.children.length<10)add({})};
  let busy=false;
  p.querySelector('[data-save]').onclick=async()=>{
   if(busy)return;const msg=p.querySelector('[data-status]'),button=p.querySelector('[data-save]');
   const data=[...list.children].map(row=>({ora:row.querySelector('[data-time]').value,reparto:row.querySelector('[data-place]').value.trim()}));
   if(data.some(x=>!x.ora||!x.reparto)){msg.textContent='Inserisci ora e reparto di ogni visita.';return}
   if(new Set(data.map(x=>x.ora+'|'+x.reparto.toLowerCase())).size!==data.length){msg.textContent='Appuntamento duplicato.';return}
   busy=true;button.disabled=true;
   try{
    const r=await sb.from('servizi_giornalieri').update({appuntamenti_visite:data}).eq('id',s.id).eq('updated_at',s.updated_at).select('id,updated_at');
    if(r.error)throw r.error;if(!r.data?.length)throw Error('Servizio modificato: riaprilo e riprova.');
    s.updated_at=r.data[0].updated_at;s.appuntamenti_visite=data;
    msg.textContent='✓ Appuntamenti salvati, disponibili anche per gli equipaggi.';
   }catch(e){msg.textContent='Errore: '+(e.message||String(e))}
   finally{busy=false;button.disabled=false}
  };
 }
 function showTablet(id,data){
  el('cgeTabletVisitsInline')?.remove();
  if(!data?.length||String(tabletCurrentService?.id)!==String(id))return;
  const field=el('tabletServiceData');if(!field)return;
  const panel=document.createElement('div');panel.id='cgeTabletVisitsInline';panel.className='section';
  panel.style.cssText='border:2px solid #dbb800;background:#fffdf1;margin:12px 0';
  panel.innerHTML='<h3>🔁 '+(data.length===2?'DOPPIA VISITA':'VISITE MULTIPLE')+'</h3>'+
   data.map((v,i)=>'<div style="padding:10px;margin:7px 0;border-left:5px solid #ffdb17;background:#edf4fc"><b>'+
   (i+1)+'ª visita · ore '+safe(v.ora)+'</b><div>'+safe(v.reparto)+'</div></div>').join('');
  field.after(panel);
 }
 if(typeof loadServiceDetail==='function'){
  const original=loadServiceDetail;
  loadServiceDetail=async function(...args){
   const token=++active;const ret=await original.apply(this,args);
   if(token===active&&typeof currentService!=='undefined')showMain(currentService);
   return ret;
  };
 }
 if(typeof openTabletService==='function'){
  const original=openTabletService;
  openTabletService=async function(id,...args){
   const token=++tabletActive;
   el('cgeTabletVisitsInline')?.remove();
   const ret=await original.call(this,id,...args);
   try{
    const r=await sb.from('servizi_giornalieri').select('appuntamenti_visite').eq('id',id).maybeSingle();
    if(r.error)throw r.error;
    if(token===tabletActive)showTablet(id,entries(r.data));
   }catch(e){const area=el('tabletDetailMsg');if(area)area.textContent='Visite non disponibili: '+(e.message||String(e))}
   return ret;
  };
 }
})();
