import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SEED_MATCHES = [{"stage": "Group A", "match_no": 1, "kickoff_utc": "2026-06-11T19:00:00Z", "home": "Mexico", "away": "South Africa"}, {"stage": "Group A", "match_no": 2, "kickoff_utc": "2026-06-12T02:00:00Z", "home": "South Korea", "away": "UEFA D"}, {"stage": "Group B", "match_no": 3, "kickoff_utc": "2026-06-12T19:00:00Z", "home": "Canada", "away": "UEFA A"}, {"stage": "Group D", "match_no": 4, "kickoff_utc": "2026-06-13T01:00:00Z", "home": "United States", "away": "Paraguay"}, {"stage": "Group C", "match_no": 5, "kickoff_utc": "2026-06-14T01:00:00Z", "home": "Haiti", "away": "Scotland"}, {"stage": "Group D", "match_no": 6, "kickoff_utc": "2026-06-14T03:59:00Z", "home": "Australia", "away": "UEFA C"}, {"stage": "Group C", "match_no": 7, "kickoff_utc": "2026-06-13T22:00:00Z", "home": "Brazil", "away": "Morocco"}, {"stage": "Group B", "match_no": 8, "kickoff_utc": "2026-06-13T19:00:00Z", "home": "Qatar", "away": "Switzerland"}, {"stage": "Group E", "match_no": 9, "kickoff_utc": "2026-06-14T23:00:00Z", "home": "Ivory Coast", "away": "Ecuador"}, {"stage": "Group E", "match_no": 10, "kickoff_utc": "2026-06-14T17:00:00Z", "home": "Germany", "away": "Curacao"}, {"stage": "Group F", "match_no": 11, "kickoff_utc": "2026-06-14T20:00:00Z", "home": "Netherlands", "away": "Japan"}, {"stage": "Group F", "match_no": 12, "kickoff_utc": "2026-06-15T02:00:00Z", "home": "UEFA B", "away": "Tunisia"}, {"stage": "Group H", "match_no": 13, "kickoff_utc": "2026-06-15T22:00:00Z", "home": "Saudi Arabia", "away": "Uruguay"}, {"stage": "Group H", "match_no": 14, "kickoff_utc": "2026-06-15T16:00:00Z", "home": "Spain", "away": "Cape Verde"}, {"stage": "Group G", "match_no": 15, "kickoff_utc": "2026-06-16T01:00:00Z", "home": "Iran", "away": "New Zealand"}, {"stage": "Group G", "match_no": 16, "kickoff_utc": "2026-06-15T19:00:00Z", "home": "Belgium", "away": "Egypt"}, {"stage": "Group I", "match_no": 17, "kickoff_utc": "2026-06-16T19:00:00Z", "home": "France", "away": "Senegal"}, {"stage": "Group I", "match_no": 18, "kickoff_utc": "2026-06-16T22:00:00Z", "home": "FIFA 2", "away": "Norway"}, {"stage": "Group J", "match_no": 19, "kickoff_utc": "2026-06-17T01:00:00Z", "home": "Argentina", "away": "Algeria"}, {"stage": "Group J", "match_no": 20, "kickoff_utc": "2026-06-17T03:59:00Z", "home": "Austria", "away": "Jordan"}, {"stage": "Group L", "match_no": 21, "kickoff_utc": "2026-06-17T20:00:00Z", "home": "England", "away": "Croatia"}, {"stage": "Group L", "match_no": 22, "kickoff_utc": "2026-06-17T23:00:00Z", "home": "Ghana", "away": "Panama"}, {"stage": "Group K", "match_no": 23, "kickoff_utc": "2026-06-17T17:00:00Z", "home": "Portugal", "away": "FIFA 1"}, {"stage": "Group K", "match_no": 24, "kickoff_utc": "2026-06-18T02:00:00Z", "home": "Uzbekistan", "away": "Colombia"}, {"stage": "Group A", "match_no": 25, "kickoff_utc": "2026-06-18T16:00:00Z", "home": "UEFA D", "away": "South Africa"}, {"stage": "Group B", "match_no": 26, "kickoff_utc": "2026-06-18T19:00:00Z", "home": "Switzerland", "away": "UEFA A"}, {"stage": "Group B", "match_no": 27, "kickoff_utc": "2026-06-18T22:00:00Z", "home": "Canada", "away": "Qatar"}, {"stage": "Group A", "match_no": 28, "kickoff_utc": "2026-06-19T01:00:00Z", "home": "Mexico", "away": "South Korea"}, {"stage": "Group C", "match_no": 29, "kickoff_utc": "2026-06-20T01:00:00Z", "home": "Brazil", "away": "Haiti"}, {"stage": "Group C", "match_no": 30, "kickoff_utc": "2026-06-19T22:00:00Z", "home": "Scotland", "away": "Morocco"}, {"stage": "Group D", "match_no": 31, "kickoff_utc": "2026-06-20T03:59:00Z", "home": "UEFA C", "away": "Paraguay"}, {"stage": "Group D", "match_no": 32, "kickoff_utc": "2026-06-19T19:00:00Z", "home": "United States", "away": "Australia"}, {"stage": "Group E", "match_no": 33, "kickoff_utc": "2026-06-20T20:00:00Z", "home": "Germany", "away": "Ivory Coast"}, {"stage": "Group E", "match_no": 34, "kickoff_utc": "2026-06-21T00:00:00Z", "home": "Ecuador", "away": "Curacao"}, {"stage": "Group F", "match_no": 35, "kickoff_utc": "2026-06-20T17:00:00Z", "home": "Netherlands", "away": "UEFA B"}, {"stage": "Group F", "match_no": 36, "kickoff_utc": "2026-06-21T03:59:00Z", "home": "Tunisia", "away": "Japan"}, {"stage": "Group H", "match_no": 37, "kickoff_utc": "2026-06-21T22:00:00Z", "home": "Uruguay", "away": "Cape Verde"}, {"stage": "Group H", "match_no": 38, "kickoff_utc": "2026-06-21T16:00:00Z", "home": "Spain", "away": "Saudi Arabia"}, {"stage": "Group G", "match_no": 39, "kickoff_utc": "2026-06-21T19:00:00Z", "home": "Belgium", "away": "Iran"}, {"stage": "Group G", "match_no": 40, "kickoff_utc": "2026-06-22T01:00:00Z", "home": "New Zealand", "away": "Egypt"}, {"stage": "Group I", "match_no": 41, "kickoff_utc": "2026-06-23T00:00:00Z", "home": "Norway", "away": "Senegal"}, {"stage": "Group I", "match_no": 42, "kickoff_utc": "2026-06-22T21:00:00Z", "home": "France", "away": "FIFA 2"}, {"stage": "Group J", "match_no": 43, "kickoff_utc": "2026-06-22T17:00:00Z", "home": "Argentina", "away": "Austria"}, {"stage": "Group J", "match_no": 44, "kickoff_utc": "2026-06-23T03:00:00Z", "home": "Jordan", "away": "Algeria"}, {"stage": "Group L", "match_no": 45, "kickoff_utc": "2026-06-23T20:00:00Z", "home": "England", "away": "Ghana"}, {"stage": "Group L", "match_no": 46, "kickoff_utc": "2026-06-23T23:00:00Z", "home": "Panama", "away": "Croatia"}, {"stage": "Group K", "match_no": 47, "kickoff_utc": "2026-06-23T17:00:00Z", "home": "Portugal", "away": "Uzbekistan"}, {"stage": "Group K", "match_no": 48, "kickoff_utc": "2026-06-24T02:00:00Z", "home": "Colombia", "away": "FIFA 1"}, {"stage": "Group C", "match_no": 49, "kickoff_utc": "2026-06-24T22:00:00Z", "home": "Scotland", "away": "Brazil"}, {"stage": "Group C", "match_no": 50, "kickoff_utc": "2026-06-24T22:00:00Z", "home": "Morocco", "away": "Haiti"}, {"stage": "Group B", "match_no": 51, "kickoff_utc": "2026-06-24T19:00:00Z", "home": "Switzerland", "away": "Canada"}, {"stage": "Group B", "match_no": 52, "kickoff_utc": "2026-06-24T19:00:00Z", "home": "UEFA A", "away": "Qatar"}, {"stage": "Group A", "match_no": 53, "kickoff_utc": "2026-06-25T01:00:00Z", "home": "UEFA D", "away": "Mexico"}, {"stage": "Group A", "match_no": 54, "kickoff_utc": "2026-06-25T01:00:00Z", "home": "South Africa", "away": "South Korea"}, {"stage": "Group E", "match_no": 55, "kickoff_utc": "2026-06-25T20:00:00Z", "home": "Curacao", "away": "Ivory Coast"}, {"stage": "Group E", "match_no": 56, "kickoff_utc": "2026-06-25T20:00:00Z", "home": "Ecuador", "away": "Germany"}, {"stage": "Group F", "match_no": 57, "kickoff_utc": "2026-06-25T23:00:00Z", "home": "Japan", "away": "UEFA B"}, {"stage": "Group F", "match_no": 58, "kickoff_utc": "2026-06-25T23:00:00Z", "home": "Tunisia", "away": "Netherlands"}, {"stage": "Group D", "match_no": 59, "kickoff_utc": "2026-06-26T02:00:00Z", "home": "UEFA C", "away": "United States"}, {"stage": "Group D", "match_no": 60, "kickoff_utc": "2026-06-26T02:00:00Z", "home": "Paraguay", "away": "Australia"}, {"stage": "Group I", "match_no": 61, "kickoff_utc": "2026-06-26T19:00:00Z", "home": "Norway", "away": "France"}, {"stage": "Group I", "match_no": 62, "kickoff_utc": "2026-06-26T19:00:00Z", "home": "Senegal", "away": "FIFA 2"}, {"stage": "Group G", "match_no": 63, "kickoff_utc": "2026-06-27T03:00:00Z", "home": "Egypt", "away": "Iran"}, {"stage": "Group G", "match_no": 64, "kickoff_utc": "2026-06-27T03:00:00Z", "home": "New Zealand", "away": "Belgium"}, {"stage": "Group H", "match_no": 65, "kickoff_utc": "2026-06-27T00:00:00Z", "home": "Cape Verde", "away": "Saudi Arabia"}, {"stage": "Group H", "match_no": 66, "kickoff_utc": "2026-06-27T00:00:00Z", "home": "Uruguay", "away": "Spain"}, {"stage": "Group L", "match_no": 67, "kickoff_utc": "2026-06-27T21:00:00Z", "home": "Panama", "away": "England"}, {"stage": "Group L", "match_no": 68, "kickoff_utc": "2026-06-27T21:00:00Z", "home": "Croatia", "away": "Ghana"}, {"stage": "Group J", "match_no": 69, "kickoff_utc": "2026-06-28T02:00:00Z", "home": "Algeria", "away": "Austria"}, {"stage": "Group J", "match_no": 70, "kickoff_utc": "2026-06-28T02:00:00Z", "home": "Jordan", "away": "Argentina"}, {"stage": "Group K", "match_no": 71, "kickoff_utc": "2026-06-27T23:30:00Z", "home": "Colombia", "away": "Portugal"}, {"stage": "Group K", "match_no": 72, "kickoff_utc": "2026-06-27T23:30:00Z", "home": "FIFA 1", "away": "Uzbekistan"}, {"stage": "Round of 32", "match_no": 73, "kickoff_utc": "2026-06-28T19:00:00Z", "home": "2A", "away": "2B"}, {"stage": "Round of 32", "match_no": 74, "kickoff_utc": "2026-06-29T20:30:00Z", "home": "1E", "away": "3ABCDF"}, {"stage": "Round of 32", "match_no": 75, "kickoff_utc": "2026-06-30T01:00:00Z", "home": "1F", "away": "2C"}, {"stage": "Round of 32", "match_no": 76, "kickoff_utc": "2026-06-29T17:00:00Z", "home": "1C", "away": "2F"}, {"stage": "Round of 32", "match_no": 77, "kickoff_utc": "2026-06-30T21:00:00Z", "home": "1I", "away": "3CDFGH"}, {"stage": "Round of 32", "match_no": 78, "kickoff_utc": "2026-06-30T18:00:00Z", "home": "2E", "away": "2I"}, {"stage": "Round of 32", "match_no": 79, "kickoff_utc": "2026-07-01T01:00:00Z", "home": "1A", "away": "3CEFHI"}, {"stage": "Round of 32", "match_no": 80, "kickoff_utc": "2026-07-01T16:00:00Z", "home": "1L", "away": "3EHIJK"}, {"stage": "Round of 32", "match_no": 81, "kickoff_utc": "2026-07-02T00:00:00Z", "home": "1D", "away": "3BEFIJ"}, {"stage": "Round of 32", "match_no": 82, "kickoff_utc": "2026-07-01T20:00:00Z", "home": "1G", "away": "3AEHIJ"}, {"stage": "Round of 32", "match_no": 83, "kickoff_utc": "2026-07-02T23:00:00Z", "home": "2K", "away": "2L"}, {"stage": "Round of 32", "match_no": 84, "kickoff_utc": "2026-07-02T19:00:00Z", "home": "1H", "away": "2J"}, {"stage": "Round of 32", "match_no": 85, "kickoff_utc": "2026-07-03T03:00:00Z", "home": "2B", "away": "3EFGIJ"}, {"stage": "Round of 32", "match_no": 86, "kickoff_utc": "2026-07-03T22:00:00Z", "home": "1J", "away": "2H"}, {"stage": "Round of 32", "match_no": 87, "kickoff_utc": "2026-07-04T01:30:00Z", "home": "1K", "away": "3DEIJL"}, {"stage": "Round of 32", "match_no": 88, "kickoff_utc": "2026-07-03T18:00:00Z", "home": "2D", "away": "2G"}, {"stage": "Round of 16", "match_no": 89, "kickoff_utc": "2026-07-04T21:00:00Z", "home": "W74", "away": "W77"}, {"stage": "Round of 16", "match_no": 90, "kickoff_utc": "2026-07-04T17:00:00Z", "home": "W73", "away": "W75"}, {"stage": "Round of 16", "match_no": 91, "kickoff_utc": "2026-07-05T20:00:00Z", "home": "W76", "away": "W78"}, {"stage": "Round of 16", "match_no": 92, "kickoff_utc": "2026-07-06T00:00:00Z", "home": "W79", "away": "W80"}, {"stage": "Round of 16", "match_no": 93, "kickoff_utc": "2026-07-06T19:00:00Z", "home": "W83", "away": "W84"}, {"stage": "Round of 16", "match_no": 94, "kickoff_utc": "2026-07-07T00:00:00Z", "home": "W81", "away": "W82"}, {"stage": "Round of 16", "match_no": 95, "kickoff_utc": "2026-07-07T16:00:00Z", "home": "W86", "away": "W88"}, {"stage": "Round of 16", "match_no": 96, "kickoff_utc": "2026-07-07T20:00:00Z", "home": "W85", "away": "W87"}, {"stage": "Quarterfinals", "match_no": 97, "kickoff_utc": "2026-07-09T20:00:00Z", "home": "W89", "away": "W90"}, {"stage": "Quarterfinals", "match_no": 98, "kickoff_utc": "2026-07-10T19:00:00Z", "home": "W93", "away": "W94"}, {"stage": "Quarterfinals", "match_no": 99, "kickoff_utc": "2026-07-11T21:00:00Z", "home": "W91", "away": "W92"}, {"stage": "Quarterfinals", "match_no": 100, "kickoff_utc": "2026-07-12T01:00:00Z", "home": "W95", "away": "W96"}, {"stage": "Semifinals", "match_no": 101, "kickoff_utc": "2026-07-14T19:00:00Z", "home": "W97", "away": "W98"}, {"stage": "Semifinals", "match_no": 102, "kickoff_utc": "2026-07-15T19:00:00Z", "home": "W99", "away": "W100"}, {"stage": "Third Place", "match_no": 103, "kickoff_utc": "2026-07-18T21:00:00Z", "home": "L101", "away": "L102"}, {"stage": "Final", "match_no": 104, "kickoff_utc": "2026-07-19T19:00:00Z", "home": "W191", "away": "W102"}];

function json(statusCode, obj, headers = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      ...headers
    },
    body: JSON.stringify(obj)
  };
}

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sbAdmin() {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseRoute(event) {
  const p = event.path || "";
  const m = p.match(/\/api\/(.*)$/) || p.match(/\/\.netlify\/functions\/api\/(.*)$/);
  return m ? (m[1] || "") : "";
}

function tokenFrom(event) {
  const h = event.headers || {};
  const a = h.authorization || h.Authorization || "";
  const m = a.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function userFrom(event) {
  const t = tokenFrom(event);
  if (!t) return null;
  try { return jwt.verify(t, getEnv("JWT_SECRET")); } catch { return null; }
}

function outcome(h,a){ return h>a?1:h<a?-1:0; }
function calcPoints(ph,pa,fh,fa){
  if (fh===null || fa===null || fh===undefined || fa===undefined) return 0;

  // 4p = täpne skoor
  if (ph===fh && pa===fa) return 4;

  const predictedOutcome = outcome(ph,pa);
  const finalOutcome = outcome(fh,fa);

  // 3p = õige tulemus + õiged kodumeeskonna väravad
  if (predictedOutcome === finalOutcome && ph === fh) return 3;

  // 2p = õige tulemus (õige võitja või viik)
  if (predictedOutcome === finalOutcome) return 2;

  // 1p = õiged võõrsilväravad
  if (pa === fa) return 1;

  return 0;
}


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

function makeEvent(req) {
  return {
    httpMethod: req.method,
    path: req.path,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? null : JSON.stringify(req.body || {}),
    queryStringParameters: req.query || {}
  };
}

async function netlifyHandler(event) {

  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

    const route = parseRoute(event);

    if (event.httpMethod === "GET" && route === "health") {
      return json(200, { ok: true, time: new Date().toISOString() });
    }

    const sb = sbAdmin();

    // Setup admin once
    if (event.httpMethod === "POST" && route === "setup/admin") {
      const body = JSON.parse(event.body || "{}");
      const username = (body.username || "admin").toString().trim();
      const password = (body.password || "").toString();
      const display_name = (body.display_name || "Admin").toString();
      if (password.length < 6) return json(400, { error: "Parool peab olema vähemalt 6 tähemärki." });

      const existing = await sb.from("players").select("id").eq("is_admin", true).limit(1);
      if (existing.error) return json(500, { error: existing.error.message });
      if ((existing.data || []).length > 0) return json(409, { error: "Admin on juba olemas." });

      const password_hash = await bcrypt.hash(password, 10);
      const ins = await sb.from("players").insert({ username, display_name, password_hash, is_admin: true })
        .select("id,username,display_name,is_admin").single();
      if (ins.error) return json(500, { error: ins.error.message });
      return json(200, { ok: true, admin: ins.data });
    }

    // Login
    if (event.httpMethod === "POST" && route === "login") {
      const body = JSON.parse(event.body || "{}");
      const username = (body.username || "").toString().trim();
      const password = (body.password || "").toString();
      if (!username || !password) return json(400, { error: "Puudub username või password." });

      const q = await sb.from("players").select("id,username,display_name,password_hash,is_admin").eq("username", username).limit(1);
      if (q.error) return json(500, { error: q.error.message });
      const u = (q.data || [])[0];
      if (!u) return json(401, { error: "Vale kasutaja või parool." });

      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return json(401, { error: "Vale kasutaja või parool." });

      const token = jwt.sign(
        { sub: u.id, username: u.username, display_name: u.display_name, is_admin: u.is_admin },
        getEnv("JWT_SECRET"),
        { expiresIn: "30d" }
      );
      return json(200, { ok: true, token, user: { id: u.id, username: u.username, display_name: u.display_name, is_admin: u.is_admin }});
    }



// Public registration: POST /api/register { username, password, password_confirm }
if (event.httpMethod === "POST" && route === "register") {
  const body = JSON.parse(event.body || "{}");
  const username = (body.username || "").toString().trim();
  const password = (body.password || "").toString();
  const password_confirm = (body.password_confirm || "").toString();

  if (!username || password.length < 6) {
    return json(400, { error: "Sisesta kasutajanimi ja parool vähemalt 6 tähemärki." });
  }
  if (password !== password_confirm) {
    return json(400, { error: "Paroolid ei kattu." });
  }
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return json(400, { error: "Kasutajanimi peab olema 3-32 märki ja võib sisaldada tähti, numbreid, punkti, sidekriipsu või alakriipsu." });
  }

  const exists = await sb.from("players").select("id").eq("username", username).limit(1);
  if (exists.error) return json(500, { error: exists.error.message });
  if ((exists.data || []).length > 0) return json(409, { error: "See kasutajanimi on juba võetud." });

  const password_hash = await bcrypt.hash(password, 10);
  const ins = await sb.from("players")
    .insert({ username, display_name: username, password_hash, is_admin: false })
    .select("id,username,display_name,is_admin")
    .single();

  if (ins.error) return json(500, { error: ins.error.message });

  const token = jwt.sign(
    { sub: ins.data.id, username: ins.data.username, display_name: ins.data.display_name, is_admin: ins.data.is_admin },
    getEnv("JWT_SECRET"),
    { expiresIn: "30d" }
  );

  return json(200, { ok: true, token, user: ins.data });
}

if (event.httpMethod === "GET" && route === "me") {

      const u = userFrom(event);
      if (!u) return json(401, { error: "Pole sisse logitud." });
      return json(200, { ok: true, user: u });
    }

    // Change password (self)
    if (event.httpMethod === "POST" && route === "password") {
      const u = userFrom(event);
      if (!u) return json(401, { error: "Pole sisse logitud." });
      const body = JSON.parse(event.body || "{}");
      const oldp = (body.old_password || "").toString();
      const newp = (body.new_password || "").toString();
      if (newp.length < 6) return json(400, { error: "Uus parool peab olema vähemalt 6 tähemärki." });

      const q = await sb.from("players").select("password_hash").eq("id", u.sub).single();
      if (q.error) return json(500, { error: q.error.message });
      const ok = await bcrypt.compare(oldp, q.data.password_hash);
      if (!ok) return json(401, { error: "Vana parool vale." });

      const password_hash = await bcrypt.hash(newp, 10);
      const upd = await sb.from("players").update({ password_hash }).eq("id", u.sub);
      if (upd.error) return json(500, { error: upd.error.message });
      return json(200, { ok: true });
    }

    // Matches list
    if (event.httpMethod === "GET" && route === "matches") {
      const m = await sb.from("matches").select("*").order("match_no", { ascending: true });
      if (m.error) return json(500, { error: m.error.message });
      return json(200, { ok: true, matches: m.data });
    }

    // Admin seed matches (idempotent upsert by match_no)
    if (event.httpMethod === "POST" && route === "admin/seed/matches") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });

      const existing = await sb.from("matches").select("id").limit(1);
      if (existing.error) return json(500, { error: existing.error.message });

      const payload = SEED_MATCHES.map(x => ({...x}));
      // Upsert needs unique constraint on match_no
      const up = await sb.from("matches").upsert(payload, { onConflict: "match_no" }).select("id");
      if (up.error) return json(500, { error: up.error.message });

      return json(200, { ok: true, inserted_or_updated: up.data.length });
    }


// Admin import kickoff times (ET) -> stores kickoff_utc
// POST /api/admin/import/kickoffs  { items: [{match_no, date_et:'YYYY-MM-DD', time_et:'HH:MM'}] }
if (event.httpMethod === "POST" && route === "admin/import/kickoffs") {
  const u = userFrom(event);
  if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });

  const body = JSON.parse(event.body || "{}");
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json(400, { error: "Puudub items." });

  const updates = [];
  for (const it of items) {
    const match_no = Number(it.match_no);
    const date_et = String(it.date_et || "");
    const time_et = String(it.time_et || "");
    if (!match_no) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date_et)) continue;
    if (!/^\d{1,2}:\d{2}$/.test(time_et)) continue;

    const [Y,M,D] = date_et.split("-").map(Number);
    let [hh,mm] = time_et.split(":").map(Number);

    // ET in June/July is typically EDT (UTC-4): UTC = ET + 4h
    hh = hh + 4;
    const dt = new Date(Date.UTC(Y, M-1, D, 0, 0, 0));
    dt.setUTCHours(hh, mm, 0, 0);

    updates.push({ match_no, kickoff_utc: dt.toISOString() });
  }

  if (!updates.length) return json(400, { error: "Ühtegi korrektset rida ei olnud." });

  let updated = 0;
  for (const urow of updates) {
    const r = await sb.from("matches").update({ kickoff_utc: urow.kickoff_utc }).eq("match_no", urow.match_no);
    if (!r.error) updated += 1;
  }

  return json(200, { ok: true, updated });
}


// Admin: sünkroniseeri ametlik ajakava NBC Sports artiklist (ajad ET)
// POST /api/admin/sync/schedule
if (event.httpMethod === "POST" && route === "admin/sync/schedule") {
  const u = userFrom(event);
  if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });

  const url = "https://www.nbcsports.com/soccer/news/2026-world-cup-schedule-confirmed-dates-times-stadiums-full-details";
  const resp = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!resp.ok) return json(502, { error: "Ei saanud ajakava kätte." });
  const html = await resp.text();

  // Näited:
  // June 11: Mexico vs South Africa - Estadio Azteca, Mexico City - 3pm ET
  // June 13: Australia vs Turkiye - BC Place, Vancouver - Midnight ET
  // June 27: Colombia vs Portugal - Hard Rock Stadium, Miami - 7:30pm ET
  // June 28: Match 73 - Runner up Group A vs Runner up Group B - SoFi Stadium, Los Angeles - 3pm ET
  const monthMap = { January:1, February:2, March:3, April:4, May:5, June:6, July:7, August:8, September:9, October:10, November:11, December:12 };

  function parseTimeET(raw) {
    const s = raw.trim().toLowerCase();
    if (s.includes("midnight")) return { h:0, m:0 };
    if (s.includes("noon")) return { h:12, m:0 };
    const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
    if (!m) return null;
    let h = Number(m[1]);
    let min = m[2] ? Number(m[2]) : 0;
    const ap = m[3];
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return { h, m:min };
  }

  function toUTCISOString(year, month, day, timeET) {
    // Juuni ja juuli: EDT (UTC-4) -> UTC = ET + 4h
    const dt = new Date(Date.UTC(year, month-1, day, 0, 0, 0));
    dt.setUTCHours(timeET.h + 4, timeET.m, 0, 0);
    return dt.toISOString();
  }

  // 1) Knockout: sisaldab Match N
  const ko = [];
  const reKO = /(June|July)\s+(\d{1,2}):\s*Match\s+(\d{1,3})\s*-\s*([^<\n]+?)\s*-\s*([0-9:apmMidnightNoon\s]+)\s*ET/gi;
  let m;
  while ((m = reKO.exec(html)) !== null) {
    const mon = monthMap[m[1]];
    const day = Number(m[2]);
    const matchNo = Number(m[3]);
    const time = parseTimeET(m[5]);
    if (!mon || !day || !matchNo || !time) continue;
    ko.push({ match_no: matchNo, kickoff_utc: toUTCISOString(2026, mon, day, time) });
  }

  // 2) Group matches: ilma Match numbrita, parseeri kõik read "Month day: X vs Y ... time ET"
  const gm = [];
  const reGM = /(June|July)\s+(\d{1,2}):\s*([A-Za-z \.'-]+?)\s+vs\s+([A-Za-z \.'-]+?)\s*-\s*[^<\n]+?\s*-\s*([0-9:apmMidnightNoon\s]+)\s*ET/gi;
  while ((m = reGM.exec(html)) !== null) {
    const mon = monthMap[m[1]];
    const day = Number(m[2]);
    const home = m[3].trim();
    const away = m[4].trim();
    const time = parseTimeET(m[5]);
    if (!mon || !day || !home || !away || !time) continue;
    // Ignore lines that are actually knockout (they include "Match", already handled)
    if (/^Match\s+\d+/i.test(home)) continue;
    gm.push({ home, away, kickoff_utc: toUTCISOString(2026, mon, day, time) });
  }

  // Sorteeri kronoloogiliselt ja seo match_no 1..72
  gm.sort((a,b)=>a.kickoff_utc.localeCompare(b.kickoff_utc));

  const existing = await sb.from("matches").select("id,match_no").order("match_no", { ascending: true });
  if (existing.error) return json(500, { error: existing.error.message });

  // Update group stage match numbers 1..72 by order
  let updated = 0;
  for (let i=0; i<gm.length && i<72; i++) {
    const matchNo = i+1;
    const r = await sb.from("matches").update({ kickoff_utc: gm[i].kickoff_utc }).eq("match_no", matchNo);
    if (!r.error) updated += 1;
  }

  // Update knockout by match_no
  for (const k of ko) {
    const r = await sb.from("matches").update({ kickoff_utc: k.kickoff_utc }).eq("match_no", k.match_no);
    if (!r.error) updated += 1;
  }

  return json(200, { ok: true, updated, group_parsed: gm.length, knockout_parsed: ko.length, source: url });
}


// Admin: update match by match_no (used by manual result/time fields)
if (event.httpMethod === "PUT" && route.startsWith("admin/matches/by-no/")) {
  const u = userFrom(event);
  if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });

  const matchNo = Number(route.split("/").pop());
  if (!matchNo) return json(400, { error: "Mängu number puudub." });

  const body = JSON.parse(event.body || "{}");
  const patch = {};
  if (body.home !== undefined) patch.home = String(body.home);
  if (body.away !== undefined) patch.away = String(body.away);
  if (body.stage !== undefined) patch.stage = String(body.stage);
  if (body.kickoff_utc !== undefined) patch.kickoff_utc = body.kickoff_utc || null;
  if (body.final_home !== undefined) patch.final_home = body.final_home === null ? null : Number(body.final_home);
  if (body.final_away !== undefined) patch.final_away = body.final_away === null ? null : Number(body.final_away);
  if (body.is_finished !== undefined) patch.is_finished = !!body.is_finished;

  const upd = await sb.from("matches").update(patch).eq("match_no", matchNo).select("*").single();
  if (upd.error) return json(500, { error: upd.error.message });

  const fh = upd.data.final_home;
  const fa = upd.data.final_away;
  if (fh !== null && fa !== null && fh !== undefined && fa !== undefined) {
    const preds = await sb.from("predictions").select("id,pred_home,pred_away").eq("match_id", upd.data.id);
    if (!preds.error) {
      for (const p of preds.data || []) {
        const pts = calcPoints(p.pred_home, p.pred_away, fh, fa);
        await sb.from("predictions").update({ points: pts }).eq("id", p.id);
      }
    }
  }

  return json(200, { ok: true, match: upd.data });
}

    // Admin matches create/update/delete
    if (event.httpMethod === "POST" && route === "admin/matches") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const body = JSON.parse(event.body || "{}");
      const ins = await sb.from("matches").insert(body).select("*").single();
      if (ins.error) return json(500, { error: ins.error.message });
      return json(200, { ok: true, match: ins.data });
    }

    const mu = route.match(/^admin\/matches\/(\d+)$/);
    if (mu && event.httpMethod === "PUT") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const id = Number(mu[1]);
      const body = JSON.parse(event.body || "{}");
      const upd = await sb.from("matches").update(body).eq("id", id).select("*").single();
      if (upd.error) return json(500, { error: upd.error.message });

      const fh = upd.data.final_home;
      const fa = upd.data.final_away;
      if (fh !== null && fa !== null && fh !== undefined && fa !== undefined) {
        const preds = await sb.from("predictions").select("id,pred_home,pred_away").eq("match_id", id);
        if (!preds.error) {
          for (const p of preds.data || []) {
            const pts = calcPoints(p.pred_home, p.pred_away, fh, fa);
            await sb.from("predictions").update({ points: pts }).eq("id", p.id);
          }
        }
      }

      return json(200, { ok: true, match: upd.data });
    }

    if (mu && event.httpMethod === "DELETE") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const id = Number(mu[1]);
      const del = await sb.from("matches").delete().eq("id", id);
      if (del.error) return json(500, { error: del.error.message });
      return json(200, { ok: true });
    }

    // Predictions (my)
    if (event.httpMethod === "GET" && route === "predictions") {
      const u = userFrom(event);
      if (!u) return json(401, { error: "Pole sisse logitud." });
      const q = await sb.from("predictions").select("match_id,pred_home,pred_away,points").eq("player_id", u.sub);
      if (q.error) return json(500, { error: q.error.message });
      return json(200, { ok: true, predictions: q.data });
    }

    if (event.httpMethod === "POST" && route === "predictions") {
  const u = userFrom(event);
  if (!u) return json(401, { error: "Pole sisse logitud." });
  const body = JSON.parse(event.body || "{}");
  const match_id = Number(body.match_id);
  const pred_home = Number(body.pred_home);
  const pred_away = Number(body.pred_away);

  // Lukustus: 1 tund enne mängu algust ei saa enam muuta (admin võib alati muuta)
  const m = await sb.from("matches")
    .select("final_home,final_away,kickoff_utc")
    .eq("id", match_id)
    .single();

  if (m.error) return json(500, { error: m.error.message });

  if (!u.is_admin && m.data.kickoff_utc) {
    const kickoff = new Date(m.data.kickoff_utc).getTime();
    const lockAt = kickoff - 60 * 60 * 1000;
    const now = Date.now();
    if (Number.isFinite(kickoff) && now >= lockAt) {
      return json(403, { error: "Ennustus on lukus (lukustub 1 tund enne mängu algust)." });
    }
  }

  const points = calcPoints(pred_home, pred_away, m.data.final_home, m.data.final_away);

  const up = await sb.from("predictions").upsert({
    player_id: u.sub, match_id, pred_home, pred_away, points
  }, { onConflict: "player_id,match_id" }).select("match_id,pred_home,pred_away,points").single();

  if (up.error) return json(500, { error: up.error.message });
  return json(200, { ok: true, prediction: up.data });
}

    // Leaderboard
    if (event.httpMethod === "GET" && route === "leaderboard") {
      const res = await sb.rpc("leaderboard");
      if (!res.error) return json(200, { ok: true, leaderboard: res.data });

      const preds = await sb.from("predictions").select("player_id,points");
      const players = await sb.from("players").select("id,display_name");
      if (preds.error || players.error) return json(500, { error: (preds.error||players.error).message });

      const map = new Map();
      for (const p of players.data) map.set(p.id, { player_id: p.id, display_name: p.display_name, points: 0 });
      for (const pr of preds.data) {
        const row = map.get(pr.player_id);
        if (row) row.points += (pr.points || 0);
      }
      const lb = Array.from(map.values()).sort((a,b)=>b.points-a.points);
      return json(200, { ok: true, leaderboard: lb });
    }

    // Admin players CRUD
    if (event.httpMethod === "GET" && route === "admin/players") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const q = await sb.from("players").select("id,username,display_name,is_admin,created_at").order("created_at", { ascending: true });
      if (q.error) return json(500, { error: q.error.message });
      return json(200, { ok: true, players: q.data });
    }

    if (event.httpMethod === "POST" && route === "admin/players") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const body = JSON.parse(event.body || "{}");
      const username = (body.username || "").toString().trim();
      const display_name = (body.display_name || "").toString().trim();
      const password = (body.password || "").toString();
      const is_admin = !!body.is_admin;
      if (!username || !display_name || password.length < 6) return json(400, { error: "Puudub username, display_name või parool (min 6)." });
      const password_hash = await bcrypt.hash(password, 10);
      const ins = await sb.from("players").insert({ username, display_name, password_hash, is_admin }).select("id,username,display_name,is_admin").single();
      if (ins.error) return json(500, { error: ins.error.message });
      return json(200, { ok: true, player: ins.data });
    }

    const pu = route.match(/^admin\/players\/([0-9a-fA-F-]+)$/);
    if (pu && event.httpMethod === "PUT") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const id = pu[1];
      const body = JSON.parse(event.body || "{}");
      const patch = {};
      if (body.username !== undefined) patch.username = String(body.username).trim();
      if (body.display_name !== undefined) patch.display_name = String(body.display_name).trim();
      if (body.is_admin !== undefined) patch.is_admin = !!body.is_admin;
      if (body.password) {
        if (String(body.password).length < 6) return json(400, { error: "Parool peab olema vähemalt 6." });
        patch.password_hash = await bcrypt.hash(String(body.password), 10);
      }
      const upd = await sb.from("players").update(patch).eq("id", id).select("id,username,display_name,is_admin").single();
      if (upd.error) return json(500, { error: upd.error.message });
      return json(200, { ok: true, player: upd.data });
    }

    if (pu && event.httpMethod === "DELETE") {
      const u = userFrom(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });
      const id = pu[1];
      const del = await sb.from("players").delete().eq("id", id);
      if (del.error) return json(500, { error: del.error.message });
      return json(200, { ok: true });
    }

    return json(404, { error: "Not found", route, method: event.httpMethod });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }

}

async function apiAdapter(req, res) {
  try {
    const result = await netlifyHandler(makeEvent(req));
    const statusCode = result && result.statusCode ? result.statusCode : 200;
    const headers = (result && result.headers) || {};
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined) res.setHeader(k, v);
    }
    const body = result && result.body !== undefined ? result.body : "";
    res.status(statusCode).send(body);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
}

app.all("/api", apiAdapter);
app.all("/api/*", apiAdapter);
app.all("/.netlify/functions/api", apiAdapter);
app.all("/.netlify/functions/api/*", apiAdapter);

app.use(express.static(path.join(__dirname, "frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Samsung JalkaMM 2026 server töötab pordil ${PORT}`);
});
