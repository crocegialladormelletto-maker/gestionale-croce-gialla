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
$('login').classList.add('off');$('private').classList.remove('off');msg('Accesso effettuato');await calendar();
}
$('form').onsubmit=async e=>{e.preventDefault();const badge=$('badge').value.trim().padStart(2,'0');if(!allowed.has(badge)){msg('Badge non autorizzato');return}
const password=$('pin').value;msg('Verifica delle credenziali...');
const r=await db.auth.signInWithPassword({email:'badge-'+badge+'@access.crocegiallaemergenza.it',password});
if(r.error){msg('Badge o PIN non validi: riprova inserendoli manualmente.');return}
$('pin').value='';await check()};
$('exit').onclick=async()=>{await db.auth.signOut();user=null;account=null;location.reload()};
const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
$('month').value=today.slice(0,7);$('date').value=today;
const category=x=>{const t=(x.tipo_servizio||'').toLowerCase(),c=$('category').value;return c==='tutti'||(c==='dimissioni'&&t.includes('dimission'))||(c==='assistenze'&&(t.includes('assistenza')||t.includes('manifestazione')))||(c==='ordinari'&&(t.includes('visita')||t.includes('trasferimento')||t.includes('ordinario'))) };
async function calendar(){
const m=$('month').value;if(!m)return;
const last=new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();
const r=await db.from('servizi_giornalieri').select('data_servizio,tipo_servizio,ora_partenza_prevista,destinazione,mezzo').gte('data_servizio',m+'-01').lte('data_servizio',m+'-'+String(last).padStart(2,'0')).order('ora_partenza_prevista');
if(r.error){msg('Calendario non disponibile: '+r.error.message);return}
const grouped={};for(const x of (r.data||[]).filter(category))(grouped[x.data_servizio]??=[]).push(x);
const out=[];for(let d=1;d<=last;d++){const date=m+'-'+String(d).padStart(2,'0'),rows=grouped[date]||[];out.push('<button class="day '+(rows.length?'':'empty')+'" data-date="'+date+'">'+d+' · '+(rows.length?rows.length+' servizi':'Nessun servizio')+'</button>');if(rows.length)out.push('<div style="padding-left:18px">'+rows.map(x=>safe((x.ora_partenza_prevista||'').slice(0,5)+' '+x.tipo_servizio+' mezzo '+x.mezzo+' '+(x.destinazione||''))).join('<hr>')+'</div>')}
$('calendar').innerHTML=out.join('');
}
$('refresh').onclick=calendar;$('category').onchange=calendar;
$('calendar').onclick=e=>{const b=e.target.closest('[data-date]');if(b){$('date').value=b.dataset.date;$('date').scrollIntoView({behavior:'smooth',block:'center'})}};
$('new').onsubmit=async e=>{e.preventDefault();const t=$('type').value;
if(t!=='Assistenza manifestazione'&&(!$('name').value.trim()||!$('surname').value.trim())){msg('Inserisci nome e cognome paziente');return}
const r=await db.from('servizi_giornalieri').insert({data_servizio:$('date').value,ora_prevista:$('time').value,ora_partenza_prevista:$('time').value,mezzo:$('vehicle').value,tipo_servizio:t,categoria_servizio:'ORDINARIO',luogo_carico_paziente:$('pickup').value||null,destinazione:$('destination').value||null,paziente_nome:$('name').value||null,paziente_cognome:$('surname').value||null,fonte:'MOBILE_DIREZIONE',creato_da:user.id}).select('id').single();
if(r.error){msg('Errore inserimento: '+r.error.message);return}msg('Servizio inserito correttamente');await calendar()};
check().catch(()=>msg('Problema temporaneo di accesso.'));
