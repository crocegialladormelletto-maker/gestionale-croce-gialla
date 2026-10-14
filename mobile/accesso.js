const $=id=>document.getElementById(id);
const db=supabase.createClient('https://ihottewckpwpwqzpxusl.supabase.co','sb_publishable_K7aTp6hLR_Pcpn7UGvArLg_DEgBjlH4');
const allowed=new Set(['02','13']);let user=null,account=null;
const msg=t=>$('notice').textContent=t;
const safe=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function check(){
const result=await db.auth.getUser();
if(result.error||!result.data.user){$('private').classList.add('off');$('login').classList.remove('off');return}
const p=await db.from('accessi_app').select('badge_personale,nome,ruolo,attivo').single();
if(p.error||!p.data||!p.data.attivo||p.data.ruolo!=='VOLONTARIO'||!allowed.has(p.data.badge_personale)){
await db.auth.signOut();$('private').classList.add('off');$('login').classList.remove('off');msg('Accesso non autorizzato');return}
user=result.data.user;account=p.data;$('hello').textContent='Benvenuto, '+account.nome;
$('login').classList.add('off');$('private').classList.remove('off');msg('Accesso effettuato');switchMobileScreen('home');await loadHome();await calendar();
}
$('form').onsubmit=async e=>{e.preventDefault();const badge=$('badge').value.trim().padStart(2,'0');if(!allowed.has(badge)){msg('Badge non autorizzato');return}
const password=$('pin').value;msg('Verifica delle credenziali...');
const r=await db.auth.signInWithPassword({email:'badge-'+badge+'@access.crocegiallaemergenza.it',password});
if(r.error){msg('Badge o PIN non validi: riprova inserendoli manualmente.');return}
$('pin').value='';await check()};
$('exit').onclick=async()=>{await db.auth.signOut();user=null;account=null;location.reload()};
const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});$('servicesFrom').value=today;$('servicesTo').value=new Date(Date.now()+30*86400000).toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
$('month').value=today.slice(0,7);$('date').value=today;
const category=x=>{const t=(x.tipo_servizio||'').toLowerCase(),c=$('category').value;return c==='tutti'||(c==='dimissioni'&&t.includes('dimission'))||(c==='assistenze'&&(t.includes('assistenza')||t.includes('manifestazione')))||(c==='ordinari'&&(t.includes('visita')||t.includes('trasferimento')||t.includes('ordinario'))) };
async function calendar(){
const m=$('month').value;if(!m){$('calendarStatus').textContent='Seleziona un mese.';return}$('calendarStatus').textContent='Caricamento calendario in corso…';
const last=new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();
const r=await db.from('servizi_giornalieri').select('data_servizio,tipo_servizio,ora_partenza_prevista,destinazione,mezzo').gte('data_servizio',m+'-01').lte('data_servizio',m+'-'+String(last).padStart(2,'0')).order('ora_partenza_prevista');
if(r.error){$('calendarStatus').textContent='Errore nel caricamento: '+r.error.message;msg('Calendario non disponibile: '+r.error.message);return}
const grouped={};for(const x of (r.data||[]).filter(category))(grouped[x.data_servizio]??=[]).push(x);
const [year,month]=m.split('-').map(Number),offset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
const out=['L','M','M','G','V','S','D'].map(x=>'<div class="weekday">'+x+'</div>');
for(let i=0;i<offset;i++)out.push('<div class="blank"></div>');
for(let d=1;d<=last;d++){const date=m+'-'+String(d).padStart(2,'0'),rows=grouped[date]||[];
const classes=[...new Set(rows.map(x=>(x.tipo_servizio||'').toLowerCase().includes('assistenza')?'assistenza':/visita|trasferimento|ordinario/i.test(x.tipo_servizio||'')?'ordinario':'dimissione'))];const dots=classes.map(t=>'<span class="dot '+t+'"></span>').join('');
out.push('<button type="button" class="day '+(rows.length?'busy':'empty')+'" data-date="'+date+'" aria-label="'+d+' '+(rows.length?rows.length+' servizi':'nessun servizio')+'"><strong>'+d+'</strong><span class="dots">'+dots+'</span><small>'+(rows.length?rows.length+' serv.':'–')+'</small></button>')}
$('calendar').innerHTML=out.join('');
$('calendarStatus').textContent='Calendario '+m+': '+(r.data||[]).filter(category).length+' servizi. Seleziona una giornata.';
showDay(m===today.slice(0,7)?today:m+'-01',grouped);
window.cgeGrouped=grouped;
function showDay(date,map){document.querySelectorAll('[data-date]').forEach(b=>b.classList.toggle('selected',b.dataset.date===date));const rows=map[date]||[];$('dayDetails').innerHTML='<b>'+safe(date)+'</b> · '+(rows.length?rows.length+' servizi':'Nessun servizio registrato')+rows.map(x=>'<p>'+safe((x.ora_partenza_prevista||'').slice(0,5)+' · '+x.tipo_servizio+' · mezzo '+x.mezzo+' · Destinazione: '+(x.destinazione||'Non indicata'))+'</p>').join('');$('date').value=date;}

}
async function showServices(){
 const from=$('servicesFrom').value,to=$('servicesTo').value;
 if(!from||!to||from>to){$('servicesStatus').textContent='Seleziona un intervallo di date valido.';return}
 $('servicesStatus').textContent='Caricamento servizi ed equipaggi…';
 const r=await db.from('servizi_giornalieri').select('id,data_servizio,tipo_servizio,ora_partenza_prevista,mezzo,destinazione,luogo_carico_paziente,stato_gestionale').gte('data_servizio',from).lte('data_servizio',to).order('data_servizio').order('ora_partenza_prevista').limit(500);
 if(r.error){$('servicesStatus').textContent='Errore: '+r.error.message;return}
 const rows=r.data||[],crewMap={};
 const ids=rows.map(x=>x.id);
 let warning='';
 if(ids.length){
  const crew=await db.from('servizi_equipaggio').select('servizio_id,badge_personale,ruolo').in('servizio_id',ids);
  if(crew.error){warning=' · Equipaggi non disponibili: '+crew.error.message}
  else{
   const badges=[...new Set((crew.data||[]).map(x=>x.badge_personale).filter(Boolean))];
   let names={};
   if(badges.length){
    const people=await db.from('personale').select('badge,nome_completo').in('badge',badges);
    if(people.error)warning=' · Nominativi non disponibili: '+people.error.message;
    else names=Object.fromEntries((people.data||[]).map(p=>[p.badge,p.nome_completo]));
   }
   for(const person of crew.data||[])(crewMap[person.servizio_id]??=[]).push((names[person.badge_personale]||'Badge '+person.badge_personale)+' ('+(person.ruolo||'Equipaggio')+')');
  }
 }
 $('servicesStatus').textContent=rows.length+' servizi nel periodo selezionato'+(rows.length===500?' (primi 500)':'')+warning;
 $('servicesList').innerHTML=rows.map(x=>'<article><b>'+safe(x.data_servizio)+' · '+safe((x.ora_partenza_prevista||'').slice(0,5))+' · Mezzo '+safe(x.mezzo)+'</b><p>'+safe(x.tipo_servizio)+' · '+safe(x.stato_gestionale||'')+'</p><p>'+'<strong>Carico:</strong> '+safe(x.luogo_carico_paziente||'Non indicato')+'<br><strong>Destinazione:</strong> '+safe(x.destinazione||'Non indicata')+'</p><p><strong>👥 Equipaggio:</strong> '+((crewMap[x.id]||[]).length? (crewMap[x.id]||[]).map(safe).join(', '):warning?'Non disponibile':'Non ancora assegnato')+'</p></article>').join('')||'<p>Nessun servizio registrato nel periodo.</p>';
} $('loadServices').onclick=showServices;
$('refresh').onclick=async()=>{try{await calendar()}catch(e){$('calendarStatus').textContent='Errore: '+e.message;msg('Errore calendario: '+e.message)}};$('category').onchange=calendar;
$('calendar').onclick=e=>{const b=e.target.closest('[data-date]');if(b){const date=b.dataset.date;document.querySelectorAll('[data-date]').forEach(x=>x.classList.toggle('selected',x===b));$('date').value=date;const rows=(window.cgeGrouped||{})[date]||[];$('dayDetails').innerHTML='<b>'+safe(date)+'</b> · '+(rows.length?rows.length+' servizi':'Nessun servizio registrato')+rows.map(x=>'<p>'+safe((x.ora_partenza_prevista||'').slice(0,5)+' · '+x.tipo_servizio+' · mezzo '+x.mezzo+' · '+(x.destinazione||''))+'</p>').join('')}};$('newForDay').onclick=()=>{switchMobileScreen('new');};async function loadHome(){if(!user)return;$('homeStats').textContent='Caricamento riepilogo…';const until=new Date(Date.now()+7*86400000).toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});const r=await db.from('servizi_giornalieri').select('data_servizio,ora_partenza_prevista,tipo_servizio,mezzo,destinazione').gte('data_servizio',today).lte('data_servizio',until).order('data_servizio').order('ora_partenza_prevista').limit(150);if(r.error){$('homeStats').textContent='Riepilogo non disponibile: '+r.error.message;$('homeUpcoming').textContent='';return}const rows=r.data||[],todayRows=rows.filter(x=>x.data_servizio===today);$('homeStats').innerHTML='<div class="home-stat"><strong>'+todayRows.length+'</strong>Oggi</div><div class="home-stat"><strong>'+rows.length+'</strong>Prossimi 7 giorni</div>';$('homeUpcoming').innerHTML=rows.slice(0,5).map(x=>'<div class="home-upcoming"><b>'+safe(x.data_servizio)+' · '+safe((x.ora_partenza_prevista||'').slice(0,5))+'</b>'+safe(x.tipo_servizio)+' · Mezzo '+safe(x.mezzo)+'<div>'+'<strong>Destinazione:</strong> '+safe(x.destinazione||'Non indicata')+'</div></div>').join('')||'<p>Nessun servizio nei prossimi sette giorni.</p>'};$('homeRefresh').onclick=loadHome;
function switchMobileScreen(target){const id={home:'homeSection',calendar:'calendarSection',new:'newSection',services:'servicesSection'}[target];if(!id)return;document.querySelectorAll('#private>section').forEach(x=>x.classList.toggle('active-screen',x.id===id));document.querySelectorAll('#mobileNav [data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target===target));window.scrollTo({top:0,behavior:'instant'});}document.querySelectorAll('#mobileNav [data-target]').forEach(button=>button.onclick=async()=>{const target=button.dataset.target;if(target==='new'&&!$('date').value)$('date').value=today;switchMobileScreen(target);if(target==='home')await loadHome();if(target==='calendar')await calendar();if(target==='services')await showServices();});
$('new').onsubmit=async e=>{e.preventDefault();const t=$('type').value;
if(t!=='Assistenza manifestazione'&&(!$('name').value.trim()||!$('surname').value.trim())){msg('Inserisci nome e cognome paziente');return}
const r=await db.from('servizi_giornalieri').insert({data_servizio:$('date').value,ora_prevista:$('time').value,ora_partenza_prevista:$('time').value,ora_carico_paziente_prevista:$('loadTime').value||null,ora_arrivo_destinazione_prevista:$('arrivalTime').value||null,ora_rientro_previsto:$('endTime').value||null,mezzo:$('vehicle').value,tipo_servizio:t,categoria_servizio:'ORDINARIO',luogo_carico_paziente:$('pickup').value||null,destinazione:$('destination').value||null,paziente_nome:$('name').value||null,paziente_cognome:$('surname').value||null,fonte:'MOBILE_DIREZIONE',creato_da:user.id}).select('id').single();
if(r.error){msg('Errore inserimento: '+r.error.message);return}msg('Servizio inserito correttamente');await calendar()};
check().catch(e=>msg('Problema temporaneo di accesso: '+e.message));
