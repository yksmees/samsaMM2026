const API = localStorage.getItem('apiUrl') || window.JALKA_API_URL || 'http://localhost:3000';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let matches = [], predictions = [], leaderboard = [], players = [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function api(path, options = {}) {
  const r = await fetch(API + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '', ...(options.headers || {}) } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Serveri viga');
  return data;
}

async function loadPublicPlayers() {
  try { players = await api('/api/public/players'); } catch { players = [{name:'Admin'}]; }
  $('loginName').innerHTML = players.map(p => `<option>${esc(p.name)}</option>`).join('');
}

async function login() {
  try {
    const data = await api('/api/login', { method:'POST', body: JSON.stringify({ name:$('loginName').value, password:$('loginPassword').value }) });
    token = data.token; user = data.user;
    localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
    await boot();
  } catch(e) { $('loginError').textContent = e.message; }
}

function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); location.reload(); }
function setTab(name){ document.querySelectorAll('.tabpane').forEach(x=>x.classList.add('hidden')); $(name).classList.remove('hidden'); document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name)); }
function point(m,p){ if(m.homeScore===null||m.awayScore===null||!p) return ''; const ah=+m.homeScore,aa=+m.awayScore,ph=+p.homeScore,pa=+p.awayScore; if(ph===ah&&pa===aa)return 4; let s=Math.sign(ah-aa)===Math.sign(ph-pa)?2:0; if(ph===ah)s++; if(pa===aa)s++; return s; }

async function loadAll(){ matches=await api('/api/matches'); predictions=await api('/api/predictions/me'); leaderboard=await api('/api/leaderboard'); if(user.role==='admin') players=await api('/api/players'); }
function predFor(id){ return predictions.find(p=>p.matchId===id); }
function fillFilters(){ const rounds=[...new Set(matches.map(m=>m.round))]; const groups=[...new Set(matches.map(m=>m.group).filter(Boolean))]; $('roundFilter').innerHTML='<option value="">Kõik voorud</option>'+rounds.map(r=>`<option>${esc(r)}</option>`).join(''); $('groupFilter').innerHTML='<option value="">Kõik grupid</option>'+groups.map(g=>`<option>${esc(g)}</option>`).join(''); }
function renderMatches(){ const q=$('search').value.toLowerCase(), rf=$('roundFilter').value, gf=$('groupFilter').value; $('matches').innerHTML=matches.filter(m=>(!rf||m.round===rf)&&(!gf||m.group===gf)&&`${m.date} ${m.time} ${m.round} ${m.group} ${m.home} ${m.away} ${m.venue}`.toLowerCase().includes(q)).map(m=>{ const p=predFor(m.id)||{}; return `<div class="match"><div class="muted"><b>${esc(String(m.date).slice(0,10))}</b><br>${esc(m.time)}</div><div><div class="muted">${esc(m.round)} ${m.group?' Grupp '+esc(m.group):''}</div><div class="teams">${esc(m.home)} vs ${esc(m.away)}</div><div class="muted">${esc(m.venue)} · õige skoor ${m.homeScore ?? '-'}:${m.awayScore ?? '-'}</div></div><div class="pred"><input type="number" min="0" value="${p.homeScore ?? ''}" data-id="${m.id}" data-side="homeScore"><span>:</span><input type="number" min="0" value="${p.awayScore ?? ''}" data-id="${m.id}" data-side="awayScore"></div><div class="pts">${point(m,p)}</div></div>`; }).join(''); }
function renderLeaderboard(){ $('leaderRows').innerHTML=leaderboard.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.points}</td><td>${r.predictions}</td></tr>`).join(''); const me=leaderboard.findIndex(r=>r.id===user.id); $('myRank').textContent=me>=0?me+1:'-'; $('myPoints').textContent=me>=0?leaderboard[me].points:0; $('myDone').textContent=predictions.length; }
function renderAdmin(){ if(user.role!=='admin') return; $('players').innerHTML=players.map(p=>`<div class="row"><input value="${esc(p.name)}" data-pid="${p.id}" data-k="name"><select data-pid="${p.id}" data-k="role"><option ${p.role==='player'?'selected':''}>player</option><option ${p.role==='admin'?'selected':''}>admin</option></select><input placeholder="uus parool" data-pid="${p.id}" data-k="password"><button onclick="savePlayer('${p.id}')">Salvesta</button></div>`).join(''); $('adminMatches').innerHTML=matches.map(m=>`<div class="row gameRow"><b>${m.id}</b><input value="${esc(String(m.date).slice(0,10))}" data-mid="${m.id}" data-k="date"><input value="${esc(m.time)}" data-mid="${m.id}" data-k="time"><input value="${esc(m.round)}" data-mid="${m.id}" data-k="round"><input value="${esc(m.group||'')}" data-mid="${m.id}" data-k="group"><input value="${esc(m.home)}" data-mid="${m.id}" data-k="home"><input value="${esc(m.away)}" data-mid="${m.id}" data-k="away"><input value="${esc(m.venue||'')}" data-mid="${m.id}" data-k="venue"><input type="number" value="${m.homeScore ?? ''}" data-mid="${m.id}" data-k="homeScore"><input type="number" value="${m.awayScore ?? ''}" data-mid="${m.id}" data-k="awayScore"><button onclick="saveMatch(${m.id})">OK</button></div>`).join(''); }
async function savePredictions(){ const map={}; document.querySelectorAll('#matches input').forEach(inp=>{ const id=+inp.dataset.id; map[id]=map[id]||{matchId:id}; map[id][inp.dataset.side]=inp.value===''?null:+inp.value; }); const clean=Object.values(map).filter(p=>p.homeScore!==null&&p.awayScore!==null); await api('/api/predictions',{method:'POST',body:JSON.stringify({predictions:clean})}); await refresh(); alert('Salvestatud'); }
async function savePlayer(id){ const body={}; document.querySelectorAll(`[data-pid="${id}"]`).forEach(i=>{ if(i.value) body[i.dataset.k]=i.value; }); await api('/api/players/'+id,{method:'PUT',body:JSON.stringify(body)}); await refresh(); }
async function saveMatch(id){ const m={}; document.querySelectorAll(`[data-mid="${id}"]`).forEach(i=>{ m[i.dataset.k]=i.type==='number'?(i.value===''?null:+i.value):i.value; }); await api('/api/matches/'+id,{method:'PUT',body:JSON.stringify(m)}); await refresh(); }
async function addPlayer(){ const name=prompt('Mängija nimi'); const password=prompt('Algne parool','1234'); if(name&&password){ await api('/api/players',{method:'POST',body:JSON.stringify({name,password})}); await refresh(); } }
async function addMatch(){ const next=Math.max(...matches.map(m=>m.id))+1; await api('/api/matches',{method:'POST',body:JSON.stringify({id:next,date:'2026-06-11',time:'15:00 ET',round:'Uus mäng',group:'',home:'Kodumeeskond',away:'Võõrsilmeeskond',venue:'Staadion'})}); await refresh(); }
async function changePassword(){ try{ await api('/api/change-password',{method:'POST',body:JSON.stringify({oldPassword:$('oldPassword').value,newPassword:$('newPassword').value})}); $('accountMsg').textContent='Parool muudetud'; }catch(e){ $('accountMsg').textContent=e.message; } }
async function syncScores(){ const r=await api('/api/admin/sync-scores',{method:'POST'}); alert(r.message); await refresh(); }
async function refresh(){ await loadAll(); fillFilters(); renderMatches(); renderLeaderboard(); renderAdmin(); }
async function boot(){ $('login').classList.add('hidden'); $('app').classList.remove('hidden'); $('hello').textContent=`Tere, ${user.name}`; document.querySelectorAll('.adminOnly').forEach(x=>x.classList.toggle('hidden',user.role!=='admin')); await refresh(); }

document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$('loginBtn').onclick=login; $('logoutBtn').onclick=logout; $('savePredictions').onclick=savePredictions; $('changePassword').onclick=changePassword; $('syncScores').onclick=syncScores; $('addPlayer').onclick=addPlayer; $('addMatch').onclick=addMatch; $('search').oninput=renderMatches; $('roundFilter').onchange=renderMatches; $('groupFilter').onchange=renderMatches;
if(token&&user) boot().catch(logout); else loadPublicPlayers();
