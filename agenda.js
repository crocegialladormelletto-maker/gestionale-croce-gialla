/* Agenda Croce Gialla — accesso regolato dalle policy RLS Supabase. */
(function(){
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;',"'":'&#39;'}[c]));
const fields=['titolo','data_evento','ora_inizio','ora_fine','luogo','referente','note'];
const types={pres:{table:'agenda_presidenza',title:'Appuntamenti Presidente'},events:{table:'agenda_eventi',title:'Eventi e manifestazioni'}};
function isAdmin(){return typeof prof!=='undefined'&&prof?.ruolo==='AMMINISTRATORE'}
function kind(id){return id==='agendaPres'?'pres':'events'}
function panel(id){return $(id==='volAgenda'?'volAgenda':id)}
function status(id,t,err=false){const node=$(id+'Msg');if(node){node.textContent=t;node.style.color=err?'#af2323':'#146a58'}}
function recordForm(type,r={}){
 const hasEvent=type==='events';
 return '<form class="agenda-form" style="display:grid;gap:9px;max-width:680px;margin:14px 0">'+
 '<input name="id" type="hidden" value="'+safe(r.id||'')+'">'+
 '<label>Titolo / motivo<input name="titolo" required maxlength="200" value="'+safe(r.titolo||'')+'"></label>'+
 '<label>Data<input type="date" name="data_evento" required value="'+safe(r.data_evento||'')+'"></label>'+
 '<div class="grid3"><label>Ora inizio<input type="time" name="ora_inizio" value="'+safe((r.ora_inizio||'').slice(0,5))+'"></label><label>Ora fine<input type="time" name="ora_fine" value="'+safe((r.ora_fine||'').slice(0,5))+'"></label></div>'+
 '<label>Luogo<input name="luogo" maxlength="250" value="'+safe(r.luogo||'')+'"></label>'+
 (hasEvent?'<label>Descrizione<textarea name="descrizione">'+safe(r.descrizione||'')+'</textarea></label><label>Volontari necessari<input type="number" min="0" max="999" name="volontari_richiesti" value="'+Number(r.volontari_richiesti||0)+'"></label><label>Stato<select name="stato">'+['PROGRAMMATO','CONFERMATO','CONCLUSO','ANNULLATO'].map(s=>'<option '+(r.stato===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label>':'<label>Referente<input name="referente" value="'+safe(r.referente||'')+'"></label>')+
 '<label>Note '+(hasEvent?'organizzative':'riservate')+'<textarea name="note">'+safe(r.note||'')+'</textarea></label>'+
 '<div class="actions"><button class="btn yellow" type="submit">💾 Salva</button><button type="button" class="btn secondary agenda-cancel">Annulla</button></div></form>';
}
let records={pres:[],events:[]},adhesions=[];
async function load(type,forVolunteer=false){
 const id=forVolunteer?'volAgenda':type==='pres'?'agendaPres':'agendaEvents';
 if(!$(id))return;
 const {data,error}=await sb.from(types[type].table).select('*').order('data_evento',{ascending:true}).order('ora_inizio',{ascending:true});
 if(error)return status(id,'Errore lettura calendario: '+error.message,true);
 records[type]=data||[];
 if(type==='events'){
   const ids=records.events.map(x=>x.id);
   if(ids.length){const x=await sb.from('agenda_adesioni').select('id,evento_id,utente_id,badge_personale').in('evento_id',ids);adhesions=x.error?[]:x.data||[]}
   else adhesions=[];
 }
 render(type,forVolunteer);
}
function render(type,forVolunteer=false){
 const id=forVolunteer?'volAgenda':type==='pres'?'agendaPres':'agendaEvents',root=$(id);
 if(!root)return;
 const edit=isAdmin()&&!forVolunteer;
 let html='<h2>'+safe(types[type].title)+'</h2><p class="muted">Calendario condiviso · appuntamenti ordinati per data</p>';
 if(edit)html+='<button type="button" class="btn yellow agenda-new">✚ Nuovo '+(type==='pres'?'appuntamento':'evento')+'</button><div class="agenda-editor"></div>';
 html+='<div class="agenda-list" style="margin-top:14px">';
 html+=records[type].length?records[type].map(r=>{
 const date=new Date(r.data_evento+'T12:00:00').toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
 const mine=adhesions.some(x=>x.evento_id===r.id&&(x.utente_id===prof?.user_id));
 const count=adhesions.filter(x=>x.evento_id===r.id).length;
 return '<article class="card" style="padding:14px;margin:10px 0;border-left:5px solid #ffdb17"><b>'+safe(date)+' · '+safe((r.ora_inizio||'').slice(0,5))+'</b><h3>'+safe(r.titolo)+'</h3><p>'+safe(r.luogo||'Luogo da definire')+'</p>'+
 (type==='pres'?'<p>'+safe(r.referente||'')+'</p><p>'+safe(r.note||'')+'</p>':'<p>'+safe(r.descrizione||'')+'</p><p><b>'+safe(r.stato)+'</b> · Volontari necessari: '+Number(r.volontari_richiesti||0)+(edit?' · Adesioni: '+count:'')+'</p>')+
 (edit?'<button class="btn secondary agenda-edit" data-id="'+safe(r.id)+'">Modifica</button> <button class="btn danger agenda-delete" data-id="'+safe(r.id)+'">Elimina</button>':'')+
 (forVolunteer&&r.stato!=='ANNULLATO'&&r.stato!=='CONCLUSO'?'<button class="btn '+(mine?'secondary':'yellow')+' agenda-rsvp" data-id="'+safe(r.id)+'">'+(mine?'Ritira disponibilità':'✅ Do la mia disponibilità')+'</button>':'')+
 '</article>';
 }).join(''):'<div class="notice">Nessun appuntamento registrato.</div>';
 html+='</div>';
 root.innerHTML=html;
 root.querySelector('.agenda-new')?.addEventListener('click',()=>showForm(type,id));
 root.querySelectorAll('.agenda-edit').forEach(b=>b.onclick=()=>showForm(type,id,records[type].find(x=>x.id===b.dataset.id)));
 root.querySelectorAll('.agenda-delete').forEach(b=>b.onclick=()=>remove(type,b.dataset.id));
 root.querySelectorAll('.agenda-rsvp').forEach(b=>b.onclick=()=>rsvp(b.dataset.id));
}
function showForm(type,id,row){const target=$(id)?.querySelector('.agenda-editor');if(!target)return;target.innerHTML=recordForm(type,row);target.querySelector('.agenda-cancel').onclick=()=>target.replaceChildren();target.querySelector('form').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());const key=data.id;delete data.id;data.ora_inizio||=null;data.ora_fine||=null; if(type==='events')data.volontari_richiesti=Number(data.volontari_richiesti)||0;
 const q=key?sb.from(types[type].table).update(data).eq('id',key):sb.from(types[type].table).insert(data);
 const res=await q;if(res.error)return status(id,res.error.message,true);await load(type);status(id,'Salvato correttamente.');
};}
async function remove(type,id){if(!isAdmin()||!confirm('Eliminare definitivamente?'))return;const x=await sb.from(types[type].table).delete().eq('id',id);if(x.error)return alert(x.error.message);await load(type)}
async function rsvp(evento_id){if(prof?.ruolo!=='VOLONTARIO')return;const old=adhesions.find(x=>x.evento_id===evento_id&&x.utente_id===prof.user_id);
 const x=old?await sb.from('agenda_adesioni').delete().eq('id',old.id):await sb.from('agenda_adesioni').insert({evento_id,utente_id:prof.user_id,badge_personale:prof.badge_personale});
 if(x.error)return status('volAgenda',x.error.message,true);await load('events',true);
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v==='agendaPres'&&isAdmin())setTimeout(()=>load('pres'),0);
 if(b.dataset.v==='agendaEvents'&&['AMMINISTRATORE','CENTRALINO'].includes(prof?.ruolo))setTimeout(()=>load('events'),0);
 if(b.dataset.volTarget==='volAgenda'||b.dataset.volHomeTarget==='volAgenda')setTimeout(()=>load('events',true),0);
});
})();
