
const api = (p)=>`/api/${p}`;
let token = localStorage.getItem("token") || "";
let me = null;
let bonusData = null;
let showFinishedMatchesMobile = false;
let adminBonusData = null;
let adminBonusActivePlayerKey = null;

const $ = (id)=>document.getElementById(id);

async function call(path, opts={}) {
  const headers = Object.assign({"content-type":"application/json"}, opts.headers||{});
  if (token) headers.authorization = "Bearer " + token;
  const res = await fetch(api(path), Object.assign({}, opts, { headers }));
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}

function setMsg(el, ok, text){
  el.innerHTML = ok ? `<span class="ok">OK</span> ${text||""}` : `<span class="bad">VIGA:</span> ${text||""}`;
}

function setWho(){
  let label = "väljas";
  if (me){
    const display = String(me.display_name || "").trim();
    const username = String(me.username || "").trim();
    label = display || username || "sisse logitud";
    if (username && username.toLowerCase() !== label.toLowerCase()) label += ` (${username})`;
    if (me.is_admin && label.toLowerCase() !== "admin") label += " · admin";
  }
  if ($("who")) $("who").textContent = label;
  if ($("headerWho")) $("headerWho").textContent = label;
  if ($("headerUserBox")) $("headerUserBox").classList.toggle("hide", !me);
  if ($("loginCard")) $("loginCard").classList.toggle("hide", !!me);
  if ($("quickStartCard")) $("quickStartCard").classList.toggle("hide", !!me);
  if ($("importTimesCard")) $("importTimesCard").classList.add("hide");
}

function pointBadge(points){
  const p = Number(points || 0);
  const safe = Math.max(0, Math.min(5, p));
  const label = safe === 5 ? "4+1p" : `${safe}p`;
  return `<span class="points-badge others-points-badge points-${safe}">${label}</span>`;
}
function pointsHelp(){
  return `<div class="points-help"><div class="points-help-title">Punktide värvid</div><div class="points-help-grid">
    <div class="points-help-row">${pointBadge(5)}<span>õige skoor ja lisapunkt edasipääseja eest ainult play-offis</span></div>
    <div class="points-help-row">${pointBadge(4)}<span>õige skoor</span></div>
    <div class="points-help-row">${pointBadge(3)}<span>õige võitja või viik ja üks õige väravate arv</span></div>
    <div class="points-help-row">${pointBadge(2)}<span>õige võitja või õige viik</span></div>
    <div class="points-help-row">${pointBadge(1)}<span>üks õige väravate arv</span></div>
    <div class="points-help-row">${pointBadge(0)}<span>kõik vale</span></div>
  </div></div>`;
}
function pointColorClass(row, pr){
  if (!pr) return "";
  const final = finalScoreText(row);
  if (!(row?.is_finished || final)) return "";
  const p = Math.max(0, Math.min(5, Number(pr.points || 0)));
  return `points-${p}`;
}
function finalScoreText(row){
  return (row && row.final_home !== null && row.final_home !== undefined && row.final_away !== null && row.final_away !== undefined) ? `${row.final_home}:${row.final_away}` : "";
}
function matchAdvancer(row){
  if (!isPlayoff(row)) return "";
  if (row.advancing_team) return row.advancing_team;
  if (row.final_home !== null && row.final_home !== undefined && row.final_away !== null && row.final_away !== undefined){
    const h = Number(row.final_home), a = Number(row.final_away);
    if (Number.isFinite(h) && Number.isFinite(a) && h !== a) return h > a ? row.home : row.away;
  }
  return "";
}
function isPlayoff(row){ return Number(row?.match_no || 0) >= 73; }
function isPlaceholderTeamName(name){
  const s = String(name || "").trim();
  if (!s) return true;
  const n = s.toLowerCase();
  if (["tbd", "to be decided", "to be confirmed", "unknown"].includes(n)) return true;
  return /^[WL]\d+$/i.test(s) || /^[123][A-Z]+$/i.test(s) || /^[12][A-L]$/i.test(s) || /^3[A-Z]+$/i.test(s);
}
function isVisibleToUsersMatch(row){
  return !isPlayoff(row) || (!isPlaceholderTeamName(row?.home) && !isPlaceholderTeamName(row?.away));
}
function sortMatchesForPredictions(matches){
  return [...(matches || [])].sort((a,b)=>{
    const at = a?.kickoff_utc ? new Date(a.kickoff_utc).getTime() : Number.POSITIVE_INFINITY;
    const bt = b?.kickoff_utc ? new Date(b.kickoff_utc).getTime() : Number.POSITIVE_INFINITY;
    const av = Number.isFinite(at) ? at : Number.POSITIVE_INFINITY;
    const bv = Number.isFinite(bt) ? bt : Number.POSITIVE_INFINITY;
    if (av !== bv) return av - bv;
    return Number(a?.match_no || 0) - Number(b?.match_no || 0);
  });
}
function predictionNeedsAdvancer(row, ph, pa){
  if (!isPlayoff(row)) return false;
  if (ph === "" || pa === "" || ph === null || pa === null || ph === undefined || pa === undefined) return false;
  return Number.isFinite(Number(ph)) && Number.isFinite(Number(pa)) && Number(ph) === Number(pa);
}
function updateAdvancerVisibility(scope, row){
  const hInput = scope.querySelector(`input[data-mid="${row.id}"][data-side="h"]`);
  const aInput = scope.querySelector(`input[data-mid="${row.id}"][data-side="a"]`);
  const wrap = scope.querySelector(`[data-adv-wrap="${row.id}"]`);
  if (!wrap || !hInput || !aInput) return;
  const needs = predictionNeedsAdvancer(row, hInput.value, aInput.value);
  wrap.classList.toggle("hide", !needs);
  const hidden = wrap.querySelector('input[data-side="adv"]');
  if (hidden && !needs) hidden.value = "";
  if (!needs) wrap.querySelectorAll('input[data-adv-radio]').forEach(r => { r.checked = false; });
}
function isTiePrediction(pr){ return pr && Number(pr.pred_home) === Number(pr.pred_away); }
function fifaCodeKey(name){
  return String(name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/cote d['’]?ivoire/g, "ivory coast")
    .replace(/côte d['’]?ivoire/g, "ivory coast")
    .replace(/cabo verde/g, "cape verde")
    .replace(/korea republic/g, "south korea")
    .replace(/u\.?s\.?a\.?/g, "united states")
    .replace(/usa/g, "united states")
    .replace(/turkiye/g, "turkey")
    .replace(/türkiye/g, "turkey")
    .replace(/ir iran/g, "iran")
    .replace(/dr congo/g, "congo dr")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function fifaCode(name){
  const map = {
    "algeria":"ALG","argentina":"ARG","australia":"AUS","austria":"AUT","belgium":"BEL","bosnia and herzegovina":"BIH","brazil":"BRA","canada":"CAN","cape verde":"CPV","colombia":"COL","congo dr":"COD","croatia":"CRO","curacao":"CUW","czechia":"CZE","czech republic":"CZE","ecuador":"ECU","egypt":"EGY","england":"ENG","estonia":"EST","eesti":"EST","faroe islands":"FRO","france":"FRA","germany":"GER","saksamaa":"GER","ghana":"GHA","haiti":"HAI","iran":"IRN","iraq":"IRQ","ivory coast":"CIV","japan":"JPN","jordan":"JOR","latvia":"LVA","lithuania":"LTU","mexico":"MEX","morocco":"MAR","netherlands":"NED","new zealand":"NZL","norway":"NOR","panama":"PAN","paraguay":"PAR","portugal":"POR","qatar":"QAT","saudi arabia":"KSA","scotland":"SCO","senegal":"SEN","south africa":"RSA","south korea":"KOR","spain":"ESP","sweden":"SWE","switzerland":"SUI","tunisia":"TUN","turkey":"TUR","uruguay":"URU","united states":"USA","uzbekistan":"UZB"
  };
  const raw = String(name || "").trim();
  const key = fifaCodeKey(raw);
  return map[key] || raw.replace(/[^A-Za-z]/g, "").slice(0,3).toUpperCase();
}
function formatPrediction(match, pr){
  if (!pr) return "";
  let txt = `${pr.pred_home}:${pr.pred_away}`;
  if (isPlayoff(match) && isTiePrediction(pr) && pr.advancing_team){
    txt += `→${fifaCode(pr.advancing_team)}`;
  }
  return txt;
}
function optionList(options, selected=""){
  return (options || []).map(o => `<option value="${escapeHtml(o.value)}" ${String(o.value)===String(selected)?"selected":""}>${escapeHtml(o.label)}</option>`).join("");
}
function dataListOptions(options){
  return (options || []).map(o => `<option value="${escapeHtml(o.label)}"></option>`).join("");
}
function searchableInputHtml(kind, id, options, currentValue="", currentText="", placeholder="Vali vastus", disabled=false){
  const listId = `${kind}_${id}_list`;
  const text = currentText || ((options || []).find(o => String(o.value) === String(currentValue))?.label || currentValue || "");
  return `<input class="search-choice" list="${listId}" data-${kind}="${id}" value="${escapeHtml(text)}" placeholder="${escapeHtml(placeholder)}" ${disabled ? "disabled" : ""}><datalist id="${listId}">${dataListOptions(options)}</datalist>`;
}
function normalizeChoiceText(v){
  return String(v || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function resolveChoice(options, typed){
  const raw = String(typed || "").trim();
  if (!raw) return { value:"", text:"" };
  const norm = normalizeChoiceText(raw);
  const list = options || [];
  const exact = list.find(o => normalizeChoiceText(o.label) === norm || normalizeChoiceText(o.value) === norm);
  if (exact) return { value:String(exact.value), text:String(exact.label) };
  const starts = list.filter(o => normalizeChoiceText(o.label).startsWith(norm) || normalizeChoiceText(o.value).startsWith(norm));
  if (starts.length === 1) return { value:String(starts[0].value), text:String(starts[0].label) };
  const contains = list.filter(o => normalizeChoiceText(o.label).includes(norm) || normalizeChoiceText(o.value).includes(norm));
  if (contains.length === 1) return { value:String(contains[0].value), text:String(contains[0].label) };
  return null;
}
function escapeHtml(v){ return String(v ?? "").replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch] || ch)); }

function renderOthers(preds){
  if (!preds || !preds.length) return "";
  const rows = preds.map(p => `<div>${p.display_name}: <span class="score-badge">${p.pred_home}:${p.pred_away}</span></div>`).join("");
  return `<div class="others"><strong>Teiste ennustused</strong><div class="others-list">${rows}</div></div>`;
}

function parseEeDateTime(dateText, timeText){
  const d = String(dateText || "").trim();
  const t = String(timeText || "").trim();

  if (!/^\d{2}:\d{2}:\d{2}$/.test(d)) {
    throw new Error("Kuupäev peab olema formaadis DD:MM:YY.");
  }
  if (!/^\d{2}:\d{2}$/.test(t)) {
    throw new Error("Kellaaeg peab olema formaadis HH:MM.");
  }

  const [day, month, yearShort] = d.split(":").map(Number);
  const [hour, minute] = t.split(":").map(Number);
  const year = 2000 + yearShort;

  if (
    day < 1 || day > 31 ||
    month < 1 || month > 12 ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    throw new Error("Kuupäev või kellaaeg on vigane.");
  }

  // Eesti aeg juunis/juulis on UTC+3.
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, 0));
}

function formatMatchOption(m){
  return `#${m.match_no} ${m.home} - ${m.away}`;
}

function populateAdminMatchSelects(matches){
  const delSelect = $("delMatchSelect");
  if (!delSelect) return;

  const current = delSelect.value;
  delSelect.innerHTML = `<option value="">Vali kustutatav mäng</option>` + (matches || [])
    .map(m => `<option value="${m.id}">${formatMatchOption(m)}</option>`)
    .join("");

  if (current) delSelect.value = current;
}

async function refreshMe(){
  if (!token){ me=null; setWho(); return; }
  try{
    const r = await call("me",{method:"GET"});
    me = r.user;
  }catch{
    me=null;
    token="";
    localStorage.removeItem("token");
  }
  setWho();
}

async function loadAll(){
  await refreshMe();
  document.getElementById('viewsCard').classList.toggle('hide', !me);
  await loadMatchesAndPreds();
  await loadLeaderboard();
  await loadBonus();
  await loadRules();
  await loadOthersView();
  await loadPlayers();
  await loadAdminBonus();
  await loadAdminScreenshotBoard();
  toggleAdminTab();
  const activeTab = document.querySelector(".tab.active")?.getAttribute("data-tab") || "pred";
  updateImportTimesVisibility(activeTab);
}


function updateImportTimesVisibility(activeTab){
  const card = $("importTimesCard");
  if (!card) return;
  card.classList.toggle("hide", !(me && me.is_admin && activeTab === "admin"));
}

function toggleAdminTab(){
  const isA = !!(me && me.is_admin);
  document.querySelector('[data-tab="admin"]').style.display = isA ? "" : "none";
  if (!isA){
    $("admin").classList.add("hide");
    if ($("importTimesCard")) $("importTimesCard").classList.add("hide");
    if ($("account")) $("account").classList.add("hide");
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelector('[data-tab="pred"]').classList.add("active");
    $("pred").classList.remove("hide");
  }
}

async function loadMatchesAndPreds(){
  const tbody = $("mTable").querySelector("tbody");
  tbody.innerHTML = "";
  $("predMsg").textContent = "";
  try{
    const [m, p, pub] = await Promise.all([
      call("matches",{method:"GET"}),
      token ? call("predictions",{method:"GET"}) : Promise.resolve({predictions:[]}),
      token ? call("predictions/matrix",{method:"GET"}) : Promise.resolve({predictions_by_match:{}})
    ]);
    const map = new Map((p.predictions||[]).map(x=>[x.match_id, x]));
    const publicMap = pub.predictions_by_match || {};
    populateAdminMatchSelects(m.matches || []);
    const matches = sortMatchesForPredictions((m.matches || []).filter(isVisibleToUsersMatch));
    const hasFinished = matches.some(row => !!(row.is_finished || finalScoreText(row)));
    const toggleBtn = $("toggleFinishedMatches");
    if (toggleBtn) {
      toggleBtn.classList.toggle("hide", !hasFinished);
      toggleBtn.textContent = showFinishedMatchesMobile ? "Peida lõppenud mänge" : "Näita lõppenud mänge";
    }
    $("mTable").classList.toggle("show-finished", showFinishedMatchesMobile);
    for (const row of matches){
      const pr = map.get(row.id);
      const tr = document.createElement("tr");
      const final = finalScoreText(row);
      const ko = row.kickoff_utc ? new Date(row.kickoff_utc) : null;
      const koTxt = ko ? new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}).format(ko) : "";
      const koFull = ko ? new Intl.DateTimeFormat('et-EE',{timeZone:'Europe/Tallinn', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}).format(ko) : "";
      const isKickoffLocked = !!(ko && (Date.now() >= (ko.getTime() - 60*60*1000)));
      const locked = !!(isKickoffLocked && !(me && me.is_admin));
      const finished = !!(row.is_finished || final);
      const colorClass = pointColorClass(row, pr);
      tr.className = `${finished ? "match-finished" : ""} ${isKickoffLocked ? "match-locked" : ""} ${colorClass}`.trim();
      const lockBadge = isKickoffLocked ? `<span class="lock-badge">Lukus</span>` : "";
      const showAdvSelect = isPlayoff(row) && pr && Number(pr.pred_home) === Number(pr.pred_away);
      const currentAdv = pr?.advancing_team || "";
      const adv = matchAdvancer(row);
      const saveText = pr ? "Salvestatud" : "Salvesta";
      const advSelectDesktop = isPlayoff(row) ? `<div class="tie-adv-wrap ${showAdvSelect ? "" : "hide"}" data-adv-wrap="${row.id}"><div class="tie-adv-label">Kui 90 min jääb viiki, vali edasipääseja</div><input type="hidden" data-mid="${row.id}" data-side="adv" value="${escapeHtml(currentAdv)}"><div class="adv-choice-list">
        <label class="adv-choice ${locked ? "locked" : ""}"><input type="radio" name="adv_d_${row.id}" data-mid="${row.id}" data-adv-radio="${escapeHtml(row.home)}" ${currentAdv===row.home?"checked":""} ${locked ? "disabled" : ""}><span>✓ ${fifaCode(row.home)}</span></label>
        <label class="adv-choice ${locked ? "locked" : ""}"><input type="radio" name="adv_d_${row.id}" data-mid="${row.id}" data-adv-radio="${escapeHtml(row.away)}" ${currentAdv===row.away?"checked":""} ${locked ? "disabled" : ""}><span>✓ ${fifaCode(row.away)}</span></label>
      </div></div>` : "";
      const advSelectMobile = isPlayoff(row) ? `<div class="tie-adv-wrap ${showAdvSelect ? "" : "hide"}" data-adv-wrap="${row.id}"><div class="tie-adv-label">Kui 90 min jääb viiki, vali edasipääseja</div><input type="hidden" data-mid="${row.id}" data-side="adv" value="${escapeHtml(currentAdv)}"><div class="adv-choice-list">
        <label class="adv-choice ${locked ? "locked" : ""}"><input type="radio" name="adv_m_${row.id}" data-mid="${row.id}" data-adv-radio="${escapeHtml(row.home)}" ${currentAdv===row.home?"checked":""} ${locked ? "disabled" : ""}><span>✓ ${fifaCode(row.home)}</span></label>
        <label class="adv-choice ${locked ? "locked" : ""}"><input type="radio" name="adv_m_${row.id}" data-mid="${row.id}" data-adv-radio="${escapeHtml(row.away)}" ${currentAdv===row.away?"checked":""} ${locked ? "disabled" : ""}><span>✓ ${fifaCode(row.away)}</span></label>
      </div></div>` : "";
      const pointsHtml = pr ? pointBadge(pr.points) : `<span class="points-badge muted-points">-</span>`;
      tr.innerHTML = `
        <td class="mobile-card-view" colspan="5">
          <div class="mobile-pred-card ${colorClass}">
            <div class="mobile-card-top"><div class="mobile-card-top-left"><span>Mäng ${row.match_no}</span>${lockBadge}</div><div class="mobile-card-top-right"><span>${escapeHtml(row.stage || "")}</span></div></div>
            <div class="mobile-score-line prediction-action-scope">
              <span class="mobile-team mobile-home">${escapeHtml(row.home)}</span>
              <input class="small" data-mid="${row.id}" data-side="h" value="${pr?pr.pred_home:""}" placeholder="0" inputmode="numeric" ${locked ? "disabled" : ""}>
              <input class="small" data-mid="${row.id}" data-side="a" value="${pr?pr.pred_away:""}" placeholder="0" inputmode="numeric" ${locked ? "disabled" : ""}>
              <span class="mobile-team mobile-away">${escapeHtml(row.away)}</span>
              ${advSelectMobile}
              <button type="button" class="${pr ? "saved" : ""}" data-save="${row.id}" ${locked ? "disabled" : ""}>${saveText}</button>
            </div>
            <div class="mobile-meta"><strong>Aeg:</strong> ${koFull || "-"}</div>
            <div class="mobile-meta"><strong>Lõpp skoor:</strong> ${final || "-"}</div>
            ${isPlayoff(row) ? `<div class="mobile-meta"><strong>Edasi:</strong> ${adv ? escapeHtml(adv) : "-"}</div>` : ""}
            <div class="mobile-meta"><strong>Punktid:</strong> <span data-points-cell="${row.id}">${pointsHtml}</span></div>
          </div>
        </td>
        <td class="desktop-pred-cell desktop-no">${row.match_no}</td>
        <td class="desktop-pred-cell desktop-stage"><span class="pill">${escapeHtml(row.stage || "")}</span></td>
        <td class="desktop-pred-cell desktop-time match-time">${koTxt}</td>
        <td class="desktop-pred-cell desktop-pred pred-cell">
          <div class="pred-controls prediction-action-scope">
            ${isKickoffLocked ? `<div class="desktop-lock-line desktop-lock-top">${lockBadge}</div>` : ""}
            <div class="desktop-score-line">
              <span class="desktop-team desktop-home">${escapeHtml(row.home)}</span>
              <input class="small" data-mid="${row.id}" data-side="h" value="${pr?pr.pred_home:""}" placeholder="0" inputmode="numeric" ${locked ? "disabled" : ""}>
              <input class="small" data-mid="${row.id}" data-side="a" value="${pr?pr.pred_away:""}" placeholder="0" inputmode="numeric" ${locked ? "disabled" : ""}>
              <span class="desktop-team desktop-away">${escapeHtml(row.away)}</span>
            </div>
            ${advSelectDesktop}
            <button type="button" class="${pr ? "saved" : ""}" data-save="${row.id}" ${locked ? "disabled" : ""}>${saveText}</button>
          </div>
          ${final ? `<div class="desktop-result-mini"><strong>Lõpp skoor:</strong> ${final}${adv ? ` · <strong>Edasi:</strong> ${escapeHtml(adv)}` : ""}</div>` : ""}
        </td>
        <td class="desktop-pred-cell desktop-points right" data-points-cell="${row.id}">${pointsHtml}</td>
      `;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll("button[data-save]").forEach(btn=>{
      const mid = Number(btn.getAttribute("data-save"));
      const scope = btn.closest(".prediction-action-scope") || btn.closest("tr") || tbody;
      const hInput = scope.querySelector(`input[data-mid="${mid}"][data-side="h"]`);
      const aInput = scope.querySelector(`input[data-mid="${mid}"][data-side="a"]`);
      const advInput = scope.querySelector(`input[data-mid="${mid}"][data-side="adv"]`);
      const matchRow = matches.find(x => Number(x.id) === mid);

      [hInput, aInput].forEach(inp=>{
        if (!inp) return;
        inp.addEventListener("input", ()=>{
          btn.classList.remove("saved");
          btn.textContent = "Salvesta";
          if (matchRow) updateAdvancerVisibility(scope, matchRow);
        });
      });
      scope.querySelectorAll(`input[data-mid="${mid}"][data-adv-radio]`).forEach(radio=>{
        radio.addEventListener("change", ()=>{
          if (advInput) advInput.value = radio.getAttribute("data-adv-radio") || "";
          btn.classList.remove("saved");
          btn.textContent = "Salvesta";
        });
      });
      if (matchRow) updateAdvancerVisibility(scope, matchRow);

      btn.addEventListener("click", async (e)=>{
        e.preventDefault();
        if (!token) return setMsg($("predMsg"), false, "Logi sisse enne ennustamist.");
        const h = hInput ? hInput.value : "";
        const a = aInput ? aInput.value : "";
        const ph = Number(h), pa = Number(a);
        if (h === "" || a === "" || !Number.isFinite(ph) || !Number.isFinite(pa)) return setMsg($("predMsg"), false, "Sisesta numbrid.");
        if (matchRow && predictionNeedsAdvancer(matchRow, ph, pa) && (!advInput || !advInput.value)) {
          return setMsg($("predMsg"), false, "Kui play-off mängu 90 minuti ennustus jääb viiki, vali edasipääseja.");
        }
        try{
          const resp = await call("predictions",{method:"POST", body: JSON.stringify({match_id: mid, pred_home: ph, pred_away: pa, advancing_team: advInput ? advInput.value : null})});
          setMsg($("predMsg"), true, "Salvestatud.");
          btn.classList.add("saved");
          btn.textContent = "Salvestatud";
          if (resp && resp.prediction) {
            document.querySelectorAll(`[data-points-cell="${mid}"]`).forEach(cell => { cell.innerHTML = pointBadge(resp.prediction.points ?? 0); });
          }
          await loadLeaderboard();
          await loadOthersView();
        }catch(e){
          setMsg($("predMsg"), false, e.message);
        }
      });
    });
  }catch(e){
    setMsg($("predMsg"), false, e.message);
  }
}


async function loadLeaderboard(){
  const groupBody = $("lbGroupTable")?.querySelector("tbody");
  const playoffBody = $("lbPlayoffTable")?.querySelector("tbody");
  if (!groupBody || !playoffBody) return;
  groupBody.innerHTML = "";
  playoffBody.innerHTML = "";
  $("lbMsg").textContent = "";
  try{
    const r = await call("leaderboard",{method:"GET"});
    renderLeaderboardRows(groupBody, r.group || [], "group");
    renderLeaderboardRows(playoffBody, r.playoff || [], "playoff");
  }catch(e){
    setMsg($("lbMsg"), false, e.message);
  }
}
function renderLeaderboardRows(tbody, rows, type="group"){
  rows.forEach((row, idx)=>{
    const tr = document.createElement("tr");
    const crown = idx === 0 ? `<span class="rank-crown">👑</span>` : "";
    const frog = rows.length > 1 && idx === rows.length - 1 ? `<span class="rank-frog">🐸</span>` : "";
    if (type === "playoff") {
      tr.innerHTML = `<td>${idx + 1}.</td><td>${escapeHtml(row.display_name)}${crown}${frog}</td><td class="right">${Number(row.playoff_points || 0)}</td><td class="right">${Number(row.bonus_points || 0)}</td><td class="right"><strong>${Number(row.points || 0)}</strong></td>`;
    } else {
      tr.innerHTML = `<td>${idx + 1}.</td><td>${escapeHtml(row.display_name)}${crown}${frog}</td><td class="right">${Number(row.points || 0)}</td>`;
    }
    tbody.appendChild(tr);
  });
}




async function loadOthersView(){
  const groupTable = $("othersGroupTable");
  const playoffTable = $("othersPlayoffTable");
  if (!groupTable || !playoffTable) return;

  const groupHead = groupTable.querySelector("thead");
  const groupBody = groupTable.querySelector("tbody");
  const playoffHead = playoffTable.querySelector("thead");
  const playoffBody = playoffTable.querySelector("tbody");

  groupHead.innerHTML = "";
  groupBody.innerHTML = "";
  playoffHead.innerHTML = "";
  playoffBody.innerHTML = "";
  $("othersMsg").textContent = "";

  if ($('othersPointsHelp')) $('othersPointsHelp').innerHTML = pointsHelp();
  if (!token) return;

  try{
    const data = await call("predictions/matrix",{method:"GET"});
    const players = (data.players || []).sort((a,b)=>String(a.display_name || "").localeCompare(String(b.display_name || ""), "et"));
    const sortNewestFirst = (a,b) => {
      const ta = Date.parse(a.kickoff_utc || a.kickoff || a.kickoff_time || "") || 0;
      const tb = Date.parse(b.kickoff_utc || b.kickoff || b.kickoff_time || "") || 0;
      if (tb !== ta) return tb - ta;
      return Number(b.match_no || 0) - Number(a.match_no || 0);
    };
    const matches = (data.matches || []).slice().sort(sortNewestFirst);
    const predictions = data.predictions || [];

    const predMap = new Map();
    for (const p of predictions){
      predMap.set(`${p.player_id}:${p.match_id}`, p);
    }

    const groupMatches = matches.filter(m => Number(m.match_no) <= 72);
    const playoffMatches = matches.filter(m => Number(m.match_no) >= 73);

    buildOthersMatrix(groupHead, groupBody, groupMatches, players, predMap);
    buildOthersMatrix(playoffHead, playoffBody, playoffMatches, players, predMap);

    if (!groupMatches.length && !playoffMatches.length){
      $("othersMsg").textContent = "Kui mängud lukku lähevad või lõppevad, tekivad need siia kõige värskem mäng vasakul.";
    }
  }catch(e){
    setMsg($("othersMsg"), false, e.message);
  }
}


function boardColorClass(match, pr){
  return "";
}

function buildOthersMatrix(thead, tbody, matches, players, predMap){
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (!matches.length){
    thead.innerHTML = `<tr><th class="sticky-col">Mänge veel pole</th></tr>`;
    return;
  }

  const head = document.createElement("tr");
  head.innerHTML = `<th class="sticky-col">Mängija</th>` + matches.map(m => {
    const finalScore = (m.final_home === null || m.final_away === null || m.final_home === undefined || m.final_away === undefined)
      ? `<span class="matrix-lock-note">lukus</span>`
      : `<span class="matrix-final-score">${m.final_home}:${m.final_away}${m.went_extra ? " AET/PEN" : ""}</span>`;
    const adv = m.advancing_team || "";
    return `<th class="others-match-head">
      <div class="match-top">#${m.match_no}</div>
      <div class="others-head-teams">
        <div class="others-team-line"><span class="others-team-name">${fifaCode(m.home)}</span>${adv === m.home ? `<span class="others-advance-marker">↑</span>` : ""}</div>
        <div class="others-team-line"><span class="others-team-name">${fifaCode(m.away)}</span>${adv === m.away ? `<span class="others-advance-marker">↑</span>` : ""}</div>
      </div>
      ${finalScore}
    </th>`;
  }).join("");
  thead.appendChild(head);

  for (const player of players){
    const tr = document.createElement("tr");
    let rowHtml = `<th class="sticky-col">${escapeHtml(player.display_name)}</th>`;

    for (const match of matches){
      const pr = predMap.get(`${player.id}:${match.id}`);
      if (!pr){
        rowHtml += `<td class="others-pred-cell"><span class="others-no-pred">-</span></td>`;
        continue;
      }
      rowHtml += `<td class="others-pred-cell"><div class="others-pred-wrap"><span class="others-pred-score">${formatPrediction(match, pr)}</span>${pointBadge(pr.points)}</div></td>`;
    }

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  }
}


let screenshotMatrixData = null;

function shortTeamName(name){ return fifaCode(name); }

function formatShortDateTime(iso){
  if (!iso) return "";
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('et-EE', { timeZone:'Europe/Tallinn', day:'2-digit', month:'short' }).format(d).replace(".", "");
  const time = new Intl.DateTimeFormat('et-EE', { timeZone:'Europe/Tallinn', hour:'2-digit', minute:'2-digit' }).format(d);
  return `${date} ${time}`;
}

function screenshotScoreClass(match, pr){ return ""; }

function populateScreenshotMatchSelect(matches){
  const select = $("screenshotMatchSelect");
  if (!select) return;

  const previous = select.value;
  const sorted = (matches || []).slice().sort((a,b)=>Number(b.match_no)-Number(a.match_no));
  select.innerHTML = sorted.length
    ? sorted.map(m => `<option value="${m.id}">#${m.match_no} ${m.home} - ${m.away}</option>`).join("")
    : `<option value="">Lõppenud mänge pole</option>`;

  if (previous && sorted.some(m => String(m.id) === previous)) {
    select.value = previous;
  }
}



function updateScreenshotControls(){
  const mode = $("screenshotMode")?.value || "single";
  const isMulti = mode === "multi";
  if ($("screenshotMatchSelect")) $("screenshotMatchSelect").classList.toggle("hide", isMulti);
  if ($("screenshotSingleLabel")) $("screenshotSingleLabel").classList.toggle("hide", isMulti);
    if ($("screenshotCountLabel")) $("screenshotCountLabel").classList.toggle("hide", !isMulti);
}

function renderScreenshotBoard(){
  updateScreenshotControls();

  const table = $("screenshotBoard");
  const msg = $("screenshotMsg");
  const select = $("screenshotMatchSelect");
  if (!table || !select) return;

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  if (msg) msg.textContent = "";

  const data = screenshotMatrixData;
  if (!data || !(data.matches || []).length){
    if (msg) msg.textContent = "Lõppenud mänge veel pole.";
    return;
  }

  const mode = $("screenshotMode")?.value || "single";
  const multi = mode === "multi";
  const players = (data.players || []).slice().sort((a,b)=>String(a.display_name || "").localeCompare(String(b.display_name || ""), "et"));
  const predMap = new Map();
  for (const p of data.predictions || []){
    predMap.set(`${p.player_id}:${p.match_id}`, p);
  }

  if (multi) {
    const count = Math.max(2, Math.min(12, Number($("screenshotCount")?.value || 3)));
    const matches = (data.matches || [])
      .slice()
      .sort((a,b)=>Number(b.match_no)-Number(a.match_no))
      .slice(0, count)
      .sort((a,b)=>Number(a.match_no)-Number(b.match_no));

    if (!matches.length){
      if (msg) msg.textContent = "Lõppenud mänge veel pole.";
      return;
    }

    const rows = [];
    rows.push(`<tr class="meta"><th></th>${matches.map(m => `<th class="game-title">${m.match_no}</th>`).join("")}</tr>`);
    rows.push(`<tr class="meta"><th></th>${matches.map(m => `<th>${formatShortDateTime(m.kickoff_utc)}</th>`).join("")}</tr>`);
    rows.push(`<tr class="teams"><th></th>${matches.map(m => `<th class="team-cell">${shortTeamName(m.home)}-${shortTeamName(m.away)}</th>`).join("")}</tr>`);
    rows.push(`<tr class="correct"><th>Õige tulemus</th>${matches.map(m => `<td>${m.final_home ?? ""}:${m.final_away ?? ""}</td>`).join("")}</tr>`);

    for (const player of players){
      let row = `<tr><th>${player.display_name}</th>`;
      for (const match of matches){
        const pr = predMap.get(`${player.id}:${match.id}`);
        if (!pr){
          row += `<td></td>`;
          continue;
        }
        row += `<td>${formatPrediction(match, pr)} ${pointBadge(pr.points)}</td>`;
      }
      row += `</tr>`;
      rows.push(row);
    }

    tbody.innerHTML = rows.join("");
    return;
  }

  const matchId = select.value || String((data.matches || [])[0]?.id || "");
  const match = (data.matches || []).find(m => String(m.id) === String(matchId));
  if (!match){
    if (msg) msg.textContent = "Vali mäng.";
    return;
  }

  const rows = [];
  rows.push(`<tr class="meta"><th></th><th>${match.match_no}</th></tr>`);
  rows.push(`<tr class="meta"><th></th><th>${formatShortDateTime(match.kickoff_utc)}</th></tr>`);
  rows.push(`<tr class="teams"><th></th><th>${shortTeamName(match.home)}-${shortTeamName(match.away)}</th></tr>`);
  rows.push(`<tr class="correct"><th>Õige tulemus</th><td>${match.final_home ?? ""}:${match.final_away ?? ""}</td></tr>`);

  for (const player of players){
    const pr = predMap.get(`${player.id}:${match.id}`);
    if (!pr) {
      rows.push(`<tr><th>${player.display_name}</th><td></td></tr>`);
      continue;
    }
    rows.push(`<tr><th>${player.display_name}</th><td>${formatPrediction(match, pr)} ${pointBadge(pr.points)}</td></tr>`);
  }

  tbody.innerHTML = rows.join("");
}

async function loadAdminScreenshotBoard(){
  if (!(me && me.is_admin)) return;
  const select = $("screenshotMatchSelect");
  if (!select) return;

  try{
    screenshotMatrixData = await call("predictions/matrix", {method:"GET"});
    const matches = (screenshotMatrixData.matches || []).sort((a,b)=>Number(b.match_no)-Number(a.match_no));
    screenshotMatrixData.matches = matches;
    populateScreenshotMatchSelect(matches);
    updateScreenshotControls();
    renderScreenshotBoard();
  }catch(e){
    if ($("screenshotMsg")) setMsg($("screenshotMsg"), false, e.message);
  }
}


async function loadRules(){
  try{
    const r = await call("rules", { method:"GET" });
    if ($("rulesText")) $("rulesText").textContent = r.rules_text || "";
    if ($("adminRulesText")) $("adminRulesText").value = r.rules_text || "";
  }catch(e){
    if ($("rulesMsg")) setMsg($("rulesMsg"), false, e.message);
  }
}

function optionsForQuestion(q, data){
  const opts = data?.options || {};
  if (q.answer_type === "team") return opts.teams || [];
  if (q.answer_type === "player") return opts.players || [];
  if (q.answer_type === "number") return opts.numbers || [];
  if (q.answer_type === "registered_user") return opts.registered_users || [];
  return [];
}

async function loadBonus(){
  const box = $("bonusQuestions");
  if (!box || !token) return;
  try{
    bonusData = await call("bonus", { method:"GET" });
    const answerMap = new Map((bonusData.answers || []).map(a => [Number(a.question_id), a]));
    const rows = (bonusData.questions || []).map(q => {
      const a = answerMap.get(Number(q.id));
      const opts = optionsForQuestion(q, bonusData);
      const savedText = String(a?.answer_text || a?.answer_value || "").trim();
      const input = q.answer_type === "text"
        ? `<input data-bonus="${q.id}" value="${escapeHtml(savedText)}" placeholder="Vastus" ${q.is_locked ? "disabled" : ""}>`
        : searchableInputHtml("bonus", q.id, opts, a?.answer_value || "", savedText, q.answer_type === "player" ? "Kirjuta nimi" : "Kirjuta ja vali", q.is_locked);
      const lockedAnswer = q.is_locked
        ? `<div class="locked-answer-view"><span>Vastus:</span> <strong>${escapeHtml(savedText || "Vastamata")}</strong></div>`
        : "";
      return `<div class="answer-grid ${q.is_locked ? "locked-question" : ""}"><div><strong>${escapeHtml(q.question_text)}</strong>${q.is_locked ? `<div class="mini locked-badge">Lukus</div>` : ""}${lockedAnswer}</div><div>${input}</div></div>`;
    }).join("");
    const unlockedCount = (bonusData.questions || []).filter(q => !q.is_locked).length;
    const lockedNote = unlockedCount ? "" : `<div class="mini" style="margin-top:10px">Lisaküsimused on lukus. Vastuseid saab vaadata, aga enam muuta ei saa.</div>`;
    box.innerHTML = rows + lockedNote + `<div class="row" style="margin-top:14px"><button id="btnSaveBonus" class="primary" type="button" ${unlockedCount ? "" : "disabled"}>Salvesta lisaküsimused</button></div>`;
    $("btnSaveBonus").onclick = saveBonusAnswers;
  }catch(e){
    setMsg($("bonusMsg"), false, e.message);
  }
}

async function saveBonusAnswers(){
  try{
    const answers = [];
    for (const q of bonusData.questions || []){
      if (q.is_locked) continue;
      const el = document.querySelector(`[data-bonus="${q.id}"]`);
      if (!el) continue;
      const typed = el.value;
      let value = typed;
      let text = typed;
      if (q.answer_type !== "text") {
        const choice = resolveChoice(optionsForQuestion(q, bonusData), typed);
        if (!choice) throw new Error(`Vali küsimusele "${q.question_text}" vastus nimekirjast.`);
        value = choice.value;
        text = choice.text;
      }
      if (value) answers.push({ question_id:q.id, answer_value:value, answer_text:text });
    }
    if (!answers.length) throw new Error("Lisaküsimused on lukus või salvestatavaid vastuseid ei ole.");
    await call("bonus/answers", { method:"POST", body:JSON.stringify({ answers }) });
    setMsg($("bonusMsg"), true, "Lisaküsimused salvestatud.");
    await loadLeaderboard();
  }catch(e){
    setMsg($("bonusMsg"), false, e.message);
  }
}

async function loadAdminBonus(){
  if (!(me && me.is_admin)) return;
  const box = $("adminBonusQuestions");
  const tabs = $("bonusUserTabs");
  const detail = $("bonusUserDetail");
  if (!box || !tabs || !detail) return;
  try{
    adminBonusData = await call("admin/bonus", { method:"GET" });
    const questions = adminBonusData.questions || [];
    const answers = adminBonusData.answers || [];
    const answersByQuestion = new Map();
    const answersByPlayer = new Map();
    for (const a of answers) {
      const qid = Number(a.question_id);
      if (!answersByQuestion.has(qid)) answersByQuestion.set(qid, []);
      answersByQuestion.get(qid).push(a);
      const playerName = a.players?.display_name || "Mängija";
      const playerId = a.player_id || playerName;
      const key = String(playerId);
      if (!answersByPlayer.has(key)) answersByPlayer.set(key, { key, name:playerName, answers:[] });
      answersByPlayer.get(key).answers.push(a);
    }
    box.innerHTML = questions.map(q => {
      const opts = optionsForQuestion(q, adminBonusData);
      const qAnswers = answersByQuestion.get(Number(q.id)) || [];
      const answeredCount = qAnswers.filter(a => String(a.answer_value || a.answer_text || "").trim()).length;
      const correctCount = qAnswers.filter(a => a.is_correct).length;
      const wrongCount = qAnswers.filter(a => String(a.answer_value || a.answer_text || "").trim() && !a.is_correct).length;
      const emptyCount = Math.max(0, (adminBonusData.players || []).filter(p => !p.is_admin).length - answeredCount);
      const totalPoints = qAnswers.reduce((sum, a) => sum + Number(a.points || 0), 0);
      const correctInput = q.answer_type === "text"
        ? `<input data-bq-correct="${q.id}" value="${escapeHtml(q.correct_answer_text || q.correct_answer_value || "")}" placeholder="Kirjuta õige vastus">`
        : searchableInputHtml("bq-correct", q.id, opts, q.correct_answer_value || "", q.correct_answer_text || "", q.answer_type === "player" ? "Kirjuta nimi ja vali õige vastus" : "Kirjuta ja vali õige vastus");
      return `<div class="card admin-bonus-card" style="margin-top:10px">
        <div class="admin-bonus-title"><strong>${escapeHtml(q.question_text)}</strong><span class="mini">${answeredCount} vastust · ${correctCount} õiget · ${totalPoints}p</span></div>
        <div class="admin-bonus-control">
          <label><span class="mini">Küsimus</span><input data-bq-text="${q.id}" value="${escapeHtml(q.question_text)}"></label>
          <label><span class="mini">Tüüp</span><select data-bq-type="${q.id}"><option ${q.answer_type==="team"?"selected":""}>team</option><option ${q.answer_type==="player"?"selected":""}>player</option><option ${q.answer_type==="number"?"selected":""}>number</option><option ${q.answer_type==="registered_user"?"selected":""}>registered_user</option><option ${q.answer_type==="text"?"selected":""}>text</option></select></label>
          <label><span class="mini">Punkte</span><input class="small" data-bq-points="${q.id}" value="${q.points || 1}" placeholder="p"></label>
          <label><span class="mini">Õige vastus</span>${correctInput}</label>
          <label class="admin-bonus-lock"><input type="checkbox" data-bq-lock="${q.id}" ${q.is_locked?"checked":""}> lukus</label>
          <button type="button" data-bq-save="${q.id}" class="primary">Salvesta ja arvuta punktid</button>
          <button type="button" data-bq-del="${q.id}">Kustuta</button>
        </div>
        <div class="admin-bonus-stats"><span>Õigeid: ${correctCount}</span><span>Valesid: ${wrongCount}</span><span>Vastamata: ${emptyCount}</span><span>Punkte kokku: ${totalPoints}</span></div>
        <div class="mini" style="margin-top:6px">Automaatne kontroll võrdleb kasutaja vastuse tehnilist väärtust siin valitud õige vastusega. Üksiku kasutaja parandamine on all tab’idega detailvaates.</div>
      </div>`;
    }).join("");

    renderAdminBonusUserTabs(questions, answersByPlayer);

    box.querySelectorAll("button[data-bq-save]").forEach(btn => btn.onclick = () => saveAdminQuestion(btn.dataset.bqSave));
    box.querySelectorAll("button[data-bq-del]").forEach(btn => btn.onclick = () => deleteAdminQuestion(btn.dataset.bqDel));
    tabs.querySelectorAll("button[data-bonus-player]").forEach(btn => btn.onclick = () => {
      adminBonusActivePlayerKey = btn.dataset.bonusPlayer;
      renderAdminBonusUserTabs(questions, answersByPlayer);
    });
    detail.querySelectorAll("button[data-ba-ok]").forEach(btn => btn.onclick = () => setBonusAnswer(btn.dataset.baOk, true, Number(btn.dataset.baPoints || 1)));
    detail.querySelectorAll("button[data-ba-bad]").forEach(btn => btn.onclick = () => setBonusAnswer(btn.dataset.baBad, false));
    renderBonusScreenshot();
  }catch(e){
    setMsg($("adminBonusMsg"), false, e.message);
  }
}

function renderAdminBonusUserTabs(questions, answersByPlayer){
  const tabs = $("bonusUserTabs");
  const detail = $("bonusUserDetail");
  if (!tabs || !detail) return;
  const players = Array.from(answersByPlayer.values()).sort((a,b)=>a.name.localeCompare(b.name, "et"));
  if (!players.length){
    tabs.innerHTML = "";
    detail.innerHTML = `<div class="sub">Kasutajate vastuseid veel ei ole.</div>`;
    return;
  }
  if (!adminBonusActivePlayerKey || !answersByPlayer.has(adminBonusActivePlayerKey)) adminBonusActivePlayerKey = players[0].key;
  tabs.innerHTML = players.map(p => `<button type="button" class="admin-user-tab ${p.key === adminBonusActivePlayerKey ? "active" : ""}" data-bonus-player="${escapeHtml(p.key)}">${escapeHtml(p.name)}</button>`).join("");
  const selected = answersByPlayer.get(adminBonusActivePlayerKey) || players[0];
  const answersByQ = new Map((selected.answers || []).map(a => [Number(a.question_id), a]));
  detail.innerHTML = `<div class="sub"><strong>${escapeHtml(selected.name)}</strong> · ${(selected.answers || []).length} vastust</div>` + questions.map(q => {
    const a = answersByQ.get(Number(q.id));
    const answerText = a ? (a.answer_text || a.answer_value || "") : "";
    const correctText = q.correct_answer_text || q.correct_answer_value || "Õige vastus valimata";
    const hasAnswer = Boolean(String(answerText).trim());
    const statusClass = !hasAnswer ? "empty" : a?.is_correct ? "ok" : "bad";
    const statusText = !hasAnswer ? "Vastamata" : a?.is_correct ? "Õige" : "Vale";
    const manualPoints = Number(q.points || 1);
    const buttons = a ? `<div class="admin-answer-actions"><button type="button" data-ba-ok="${a.id}" data-ba-points="${manualPoints}">Märgi õigeks</button><button type="button" data-ba-bad="${a.id}">Märgi valeks</button></div>` : "";
    return `<div class="admin-user-answer">
      <div class="admin-user-answer-head"><div class="admin-user-answer-title">${escapeHtml(q.question_text)}</div><span class="status-pill ${statusClass}">${statusText}</span></div>
      <div class="admin-answer-meta">
        <div class="label">Vastus</div><div>${escapeHtml(answerText || "-")}</div>
        <div class="label">Õige vastus</div><div>${escapeHtml(correctText)}</div>
        <div class="label">Punktid</div><div>${Number(a?.points || 0)} / ${manualPoints}</div>
      </div>
      ${buttons}
    </div>`;
  }).join("");
}

function sourceForType(type){
  return type === "team" ? "teams" : type === "player" ? "players" : type === "number" ? "0_20" : type === "registered_user" ? "registered_users" : "text";
}
async function saveAdminQuestion(id){
  try{
    const type = document.querySelector(`[data-bq-type="${id}"]`).value;
    const correctEl = document.querySelector(`[data-bq-correct="${id}"]`);
    let correctValue = correctEl?.value || "";
    let correctText = correctValue;
    if (type !== "text" && correctValue) {
      const pseudoQuestion = { answer_type:type };
      const choice = resolveChoice(optionsForQuestion(pseudoQuestion, adminBonusData), correctValue);
      if (!choice) throw new Error("Vali õige vastus nimekirjast.");
      correctValue = choice.value;
      correctText = choice.text;
    }
    await call(`admin/bonus/questions/${id}`, { method:"PUT", body:JSON.stringify({ question_text:document.querySelector(`[data-bq-text="${id}"]`).value, answer_type:type, options_source:sourceForType(type), points:Number(document.querySelector(`[data-bq-points="${id}"]`).value || 1), is_locked:document.querySelector(`[data-bq-lock="${id}"]`).checked, correct_answer_value:correctValue || null, correct_answer_text:correctText || null }) });
    setMsg($("adminBonusMsg"), true, "Küsimus salvestatud.");
    await loadAdminBonus(); await loadBonus(); await loadLeaderboard();
  }catch(e){ setMsg($("adminBonusMsg"), false, e.message); }
}
async function deleteAdminQuestion(id){
  if (!confirm("Kustutan lisaküsimuse?")) return;
  try{ await call(`admin/bonus/questions/${id}`, { method:"DELETE" }); await loadAdminBonus(); await loadBonus(); }
  catch(e){ setMsg($("adminBonusMsg"), false, e.message); }
}
async function setBonusAnswer(id, ok, manualPoints=1){
  try{ await call(`admin/bonus/answers/${id}`, { method:"PUT", body:JSON.stringify({ is_correct:ok, points:ok ? Number(manualPoints || 1) : 0 }) }); await loadAdminBonus(); await loadLeaderboard(); }
  catch(e){ setMsg($("adminBonusMsg"), false, e.message); }
}

function renderBonusScreenshot(){
  const table = $("bonusScreenshotBoard");
  if (!table || !adminBonusData) return;
  const tbody = table.querySelector("tbody");
  const questions = adminBonusData.questions || [];
  const answers = adminBonusData.answers || [];
  const players = new Map();
  for (const a of answers){
    const name = a.players?.display_name || "Mängija";
    if (!players.has(name)) players.set(name, new Map());
    players.get(name).set(Number(a.question_id), a);
  }
  const rows = [];
  rows.push(`<tr class="meta"><th>Kasutaja</th>${questions.map((q,i)=>`<th title="${escapeHtml(q.question_text)}">K${i+1}</th>`).join("")}</tr>`);
  rows.push(`<tr class="correct"><th>Õige vastus</th>${questions.map(q=>`<td>${escapeHtml(q.correct_answer_text || q.correct_answer_value || "")}</td>`).join("")}</tr>`);
  for (const [name, map] of Array.from(players.entries()).sort((a,b)=>a[0].localeCompare(b[0], "et"))){
    rows.push(`<tr><th>${escapeHtml(name)}</th>${questions.map(q=>`<td>${escapeHtml(map.get(Number(q.id))?.answer_text || "")}</td>`).join("")}</tr>`);
  }
  tbody.innerHTML = rows.join("");
}
async function loadPlayers(){
  const tbody = $("pTable").querySelector("tbody");
  tbody.innerHTML = "";
  if (!(me && me.is_admin)) return;
  try{
    const r = await call("admin/players",{method:"GET"});
    for (const pl of r.players){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input data-player-username="${pl.id}" value="${escapeHtml(pl.username)}"></td>
        <td><input data-player-name="${pl.id}" value="${escapeHtml(pl.display_name || pl.username)}"></td>
        <td><select data-player-admin="${pl.id}"><option value="false" ${pl.is_admin ? "" : "selected"}>ei</option><option value="true" ${pl.is_admin ? "selected" : ""}>jah</option></select></td>
        <td class="right">
          <button data-save-player="${pl.id}">Salvesta</button>
          <button data-reset="${pl.id}">Uus parool</button>
          <button data-del="${pl.id}">Kustuta</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll("button[data-save-player]").forEach(b=>{
      b.addEventListener("click", async ()=>{
        const id = b.getAttribute("data-save-player");
        try{
          await call(`admin/players/${id}`,{method:"PUT", body: JSON.stringify({
            username: document.querySelector(`[data-player-username="${id}"]`).value.trim(),
            display_name: document.querySelector(`[data-player-name="${id}"]`).value.trim(),
            is_admin: document.querySelector(`[data-player-admin="${id}"]`).value === "true"
          })});
          setMsg($("adminMsg"), true, "Mängija salvestatud.");
          await loadPlayers();
        }catch(e){
          setMsg($("adminMsg"), false, e.message);
        }
      });
    });
    tbody.querySelectorAll("button[data-reset]").forEach(b=>{
      b.addEventListener("click", async ()=>{
        const id = b.getAttribute("data-reset");
        const np = prompt("Uus parool (min 6):");
        if (!np) return;
        try{
          await call(`admin/players/${id}`,{method:"PUT", body: JSON.stringify({password: np})});
          setMsg($("adminMsg"), true, "Parool muudetud.");
        }catch(e){
          setMsg($("adminMsg"), false, e.message);
        }
      });
    });
    tbody.querySelectorAll("button[data-del]").forEach(b=>{
      b.addEventListener("click", async ()=>{
        const id = b.getAttribute("data-del");
        if (!confirm("Kustutan mängija?")) return;
        try{
          await call(`admin/players/${id}`,{method:"DELETE"});
          setMsg($("adminMsg"), true, "Kustutatud.");
          await loadPlayers();
          await loadLeaderboard();
        }catch(e){
          setMsg($("adminMsg"), false, e.message);
        }
      });
    });
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
}

// Events
$("btnHealth").onclick = async ()=>{
  try{ const r = await call("health",{method:"GET"}); setMsg($("adminMsg"), true, r.time); }
  catch(e){ setMsg($("adminMsg"), false, e.message); }
};

$("btnSeed").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const r = await call("admin/seed/matches",{method:"POST"});
    setMsg($("adminMsg"), true, `Mängud lisatud või uuendatud: ${r.inserted_or_updated}`);
    await loadMatchesAndPreds();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnLogin").onclick = async ()=>{
  try{
    const r = await call("login",{method:"POST", body: JSON.stringify({username:$("u").value.trim(), password:$("p").value})});
    token = r.token;
    localStorage.setItem("token", token);
    setMsg($("loginMsg"), true, `Sisse logitud: ${r.user.display_name}`);
    await loadAll();
  }catch(e){
    setMsg($("loginMsg"), false, e.message);
  }
};


$("btnRegister").onclick = async ()=>{
  try{
    const body = { username: $("ru").value.trim(), password: $("rp").value, password_confirm: $("rp2").value };
    const r = await call("register",{method:"POST", body: JSON.stringify(body)});
    token = r.token;
    localStorage.setItem("token", token);
    setMsg($("loginMsg"), true, `Konto loodud ja sisse logitud: ${r.user.display_name}`);
    $("u").value = r.user.username;
    $("p").value = "";
    $("ru").value = "";
    $("rp").value = "";
    $("rp2").value = "";
    await loadAll();
  }catch(e){
    setMsg($("loginMsg"), false, e.message);
  }
};

async function doLogout(){
  token=""; me=null;
  localStorage.removeItem("token");
  if ($("loginMsg")) setMsg($("loginMsg"), true, "Välja logitud.");
  await loadAll();
}

if ($("btnLogout")) $("btnLogout").onclick = doLogout;
if ($("btnLogoutTop")) $("btnLogoutTop").onclick = doLogout;

$("btnPass").onclick = async ()=>{
  if (!token) return setMsg($("accountMsg"), false, "Logi sisse.");
  try{
    await call("password",{method:"POST", body: JSON.stringify({old_password:$("oldp").value, new_password:$("newp").value})});
    setMsg($("accountMsg"), true, "Parool muudetud.");
    $("oldp").value=""; $("newp").value="";
  }catch(e){
    setMsg($("accountMsg"), false, e.message);
  }
};

$("btnAddPlayer").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const username = $("pu2").value.trim();
    const body = { username, display_name: username, password:$("pp2").value, is_admin: $("pa2").value==="true" };
    await call("admin/players",{method:"POST", body: JSON.stringify(body)});
    setMsg($("adminMsg"), true, "Mängija lisatud.");
    $("pu2").value=""; $("pp2").value="";
    await loadPlayers();
    await loadLeaderboard();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};




$("btnSyncResults").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const r = await call("admin/sync/results",{method:"POST"});
    setMsg($("adminMsg"), true, `Tulemused sünkroniseeritud. Uuendatud mänge: ${r.updated}`);
    await loadMatchesAndPreds();
    await loadLeaderboard();
    await loadAdminScreenshotBoard();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnSync").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const r = await call("admin/sync/schedule",{method:"POST"});
    setMsg($("adminMsg"), true, `Valmis. Uuendatud: ${r.updated}. Leitud alagrupis: ${r.group_parsed}, play off: ${r.knockout_parsed}`);
    await loadMatchesAndPreds();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnImport").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const raw = $("imp").value.trim();
    if (!raw) return setMsg($("adminMsg"), false, "Kleebi read siia.");
    const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const items = [];
    for (const ln of lines){
      const parts = ln.split(",").map(x=>x.trim());
      if (parts.length < 3) continue;
      const match_no = Number(parts[0]);
      const date = parts[1];
      const time = parts[2];
      if (!match_no || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) continue;
      items.push({ match_no, date_et: date, time_et: time });
    }
    if (!items.length) return setMsg($("adminMsg"), false, "Ei leidnud ühtegi korrektset rida.");
    const r = await call("admin/import/kickoffs",{method:"POST", body: JSON.stringify({ items })});
    setMsg($("adminMsg"), true, `Aegu uuendatud: ${r.updated}`);
    await loadMatchesAndPreds();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};



$("btnSetKickoff").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const matchNo = Number($("timeNo").value);
    const d = $("timeDate").value.trim();
    const t = $("timeClock").value.trim();

    if (!matchNo) return setMsg($("adminMsg"), false, "Sisesta mängu #.");
    const utc = parseEeDateTime(d, t);

    await call(`admin/matches/by-no/${matchNo}`,{method:"PUT", body: JSON.stringify({kickoff_utc: utc.toISOString()})});
    setMsg($("adminMsg"), true, "Mänguaeg salvestatud Eesti aja järgi.");
    await loadMatchesAndPreds();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};





if ($("btnRefreshMatchDropdown")) $("btnRefreshMatchDropdown").onclick = async ()=>{
  try{
    const m = await call("matches",{method:"GET"});
    populateAdminMatchSelects(m.matches || []);
    setMsg($("adminMsg"), true, "Mängude nimekiri uuendatud.");
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnDeleteMatch").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const id = $("delMatchSelect").value;
    const label = $("delMatchSelect").selectedOptions[0]?.textContent || "valitud mäng";
    if (!id) return setMsg($("adminMsg"), false, "Vali kustutatav mäng.");

    if (!confirm(`Kas kustutan mängu: ${label}?\nSee kustutab ka selle mängu ennustused.`)) return;

    await call(`admin/matches/${id}`, { method:"DELETE" });
    setMsg($("adminMsg"), true, "Mäng kustutatud.");
    await loadMatchesAndPreds();
    await loadLeaderboard();
    await loadOthersView();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnAddMatch").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const match_no = Number($("amNo").value);
    const home = $("amHome").value.trim();
    const away = $("amAway").value.trim();
    const location = $("amLocation").value.trim();
    const d = $("amDate").value.trim();
    const t = $("amTime").value.trim();

    if (!match_no || !home || !away) {
      return setMsg($("adminMsg"), false, "Sisesta mängu # ja meeskonnad.");
    }

    const utc = parseEeDateTime(d, t);

    await call("admin/matches", {
      method:"POST",
      body: JSON.stringify({
        match_no,
        stage: "Lisatud mäng",
        home,
        away,
        location,
        kickoff_utc: utc.toISOString(),
        is_finished: false
      })
    });

    setMsg($("adminMsg"), true, "Mäng lisatud.");
    $("amNo").value="";
    $("amHome").value="";
    $("amAway").value="";
    $("amDate").value="";
    $("amTime").value="";
    $("amLocation").value="";
    await loadMatchesAndPreds();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnSetFinal").onclick = async ()=>{
  if (!(me && me.is_admin)) return setMsg($("adminMsg"), false, "Ainult admin.");
  try{
    const matchNo = Number($("mid").value);
    const fh = Number($("fh").value);
    const fa = Number($("fa").value);
    if (!matchNo || !Number.isFinite(fh) || !Number.isFinite(fa)) return setMsg($("adminMsg"), false, "Sisesta mängu # ja numbrid.");
    const status = $("resultStatus")?.value || "FT";
    await call(`admin/matches/by-no/${matchNo}`,{method:"PUT", body: JSON.stringify({final_home: fh, final_away: fa, is_finished: true, status_short: status, went_extra: status === "AET" || status === "PEN", advancing_team: $("advancingTeam")?.value.trim() || null})});
    setMsg($("adminMsg"), true, "Tulemus salvestatud.");
    await loadMatchesAndPreds();
    await loadLeaderboard();
    await loadAdminScreenshotBoard();
  }catch(e){
    setMsg($("adminMsg"), false, e.message);
  }
};

$("btnReload").onclick = loadAll;
if ($("toggleFinishedMatches")) $("toggleFinishedMatches").onclick = async ()=>{ showFinishedMatchesMobile = !showFinishedMatchesMobile; await loadMatchesAndPreds(); };

document.querySelectorAll(".tab").forEach(t=>{
  t.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const name = t.getAttribute("data-tab");
    ["pred","lb","bonus","others","rules","account","admin"].forEach(id=>{ const el=$(id); if (el) el.classList.add("hide"); });
    const target = $(name); if (target) target.classList.remove("hide");
    updateImportTimesVisibility(name);
  });
});


if ($("screenshotMatchSelect")) $("screenshotMatchSelect").addEventListener("change", renderScreenshotBoard);
if ($("screenshotMode")) $("screenshotMode").addEventListener("change", renderScreenshotBoard);
if ($("screenshotCount")) $("screenshotCount").addEventListener("input", renderScreenshotBoard);
if ($("btnRefreshScreenshotBoard")) $("btnRefreshScreenshotBoard").onclick = loadAdminScreenshotBoard;
if ($("btnRefreshBonusScreenshot")) $("btnRefreshBonusScreenshot").onclick = async ()=>{ await loadAdminBonus(); renderBonusScreenshot(); };
if ($("btnSaveRules")) $("btnSaveRules").onclick = async ()=>{
  try{
    await call("admin/rules", { method:"PUT", body:JSON.stringify({ rules_text:$("adminRulesText").value }) });
    setMsg($("adminRulesMsg"), true, "Reeglid salvestatud.");
    await loadRules();
  }catch(e){ setMsg($("adminRulesMsg"), false, e.message); }
};
if ($("btnAddBonusQuestion")) $("btnAddBonusQuestion").onclick = async ()=>{
  try{
    const type = $("newBonusType").value;
    await call("admin/bonus/questions", { method:"POST", body:JSON.stringify({ question_text:$("newBonusText").value, answer_type:type, options_source:sourceForType(type), points:1 }) });
    $("newBonusText").value = "";
    setMsg($("adminBonusMsg"), true, "Lisaküsimus lisatud.");
    await loadAdminBonus(); await loadBonus();
  }catch(e){ setMsg($("adminBonusMsg"), false, e.message); }
};
if ($("btnRecalcBonus")) $("btnRecalcBonus").onclick = async ()=>{
  try{ const r = await call("admin/bonus/recalculate", { method:"POST" }); setMsg($("adminBonusMsg"), true, `Lisaküsimused arvutatud valitud õigete vastuste järgi: ${r.updated} vastust.`); await loadAdminBonus(); await loadLeaderboard(); }
  catch(e){ setMsg($("adminBonusMsg"), false, e.message); }
};

loadAll();
