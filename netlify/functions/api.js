import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

function getSupabaseAdmin() {
  const url = getEnv("SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function parsePath(event) {
  // Netlify passes path like "/.netlify/functions/api/health" or via redirect "/api/health"
  const p = event.path || "";
  const m = p.match(/\/api\/(.*)$/) || p.match(/\/\.netlify\/functions\/api\/(.*)$/);
  return m ? (m[1] || "") : "";
}

function getToken(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function verifyJwt(event) {
  const token = getToken(event);
  if (!token) return null;
  try {
    return jwt.verify(token, getEnv("JWT_SECRET"));
  } catch {
    return null;
  }
}

function outcome(h, a) {
  if (h > a) return 1;
  if (h < a) return -1;
  return 0;
}

function calcPoints(ph, pa, fh, fa) {
  // lihtne loogika: täpne skoor 4p, õige tulemus 2p
  if (fh === null || fa === null || fh === undefined || fa === undefined) return 0;
  if (ph === fh && pa === fa) return 4;
  return outcome(ph, pa) === outcome(fh, fa) ? 2 : 0;
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

    const route = parsePath(event);

    if (event.httpMethod === "GET" && route === "health") {
      return json(200, { ok: true, time: new Date().toISOString() });
    }

    // Setup: create first admin if none exists
    // POST /api/setup/admin  { "username":"admin", "password":"...", "display_name":"Admin" }
    if (event.httpMethod === "POST" && route === "setup/admin") {
      const sb = getSupabaseAdmin();
      const body = JSON.parse(event.body || "{}");
      const username = (body.username || "admin").toString().trim();
      const password = (body.password || "").toString();
      const displayName = (body.display_name || "Admin").toString();

      if (password.length < 6) return json(400, { error: "Parool peab olema vähemalt 6 tähemärki." });

      const existing = await sb.from("players").select("id").eq("is_admin", true).limit(1);
      if (existing.error) return json(500, { error: existing.error.message });
      if ((existing.data || []).length > 0) return json(409, { error: "Admin on juba olemas." });

      const password_hash = await bcrypt.hash(password, 10);
      const ins = await sb.from("players").insert({
        username,
        display_name: displayName,
        password_hash,
        is_admin: true
      }).select("id,username,display_name,is_admin").single();

      if (ins.error) return json(500, { error: ins.error.message });
      return json(200, { ok: true, admin: ins.data });
    }

    // Auth: POST /api/login { username, password }
    if (event.httpMethod === "POST" && route === "login") {
      const sb = getSupabaseAdmin();
      const body = JSON.parse(event.body || "{}");
      const username = (body.username || "").toString().trim();
      const password = (body.password || "").toString();
      if (!username || !password) return json(400, { error: "Puudub username või password." });

      const q = await sb.from("players").select("id,username,display_name,password_hash,is_admin").eq("username", username).limit(1);
      if (q.error) return json(500, { error: q.error.message });
      const user = (q.data || [])[0];
      if (!user) return json(401, { error: "Vale kasutaja või parool." });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return json(401, { error: "Vale kasutaja või parool." });

      const token = jwt.sign(
        { sub: user.id, username: user.username, display_name: user.display_name, is_admin: user.is_admin },
        getEnv("JWT_SECRET"),
        { expiresIn: "30d" }
      );

      return json(200, {
        ok: true,
        token,
        user: { id: user.id, username: user.username, display_name: user.display_name, is_admin: user.is_admin }
      });
    }

    // GET /api/me
    if (event.httpMethod === "GET" && route === "me") {
      const u = verifyJwt(event);
      if (!u) return json(401, { error: "Pole sisse logitud." });
      return json(200, { ok: true, user: u });
    }

    // Password change: POST /api/password { old_password, new_password }
    if (event.httpMethod === "POST" && route === "password") {
      const sb = getSupabaseAdmin();
      const u = verifyJwt(event);
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

    // Matches: GET /api/matches
    if (event.httpMethod === "GET" && route === "matches") {
      const sb = getSupabaseAdmin();
      const m = await sb.from("matches").select("*").order("match_no", { ascending: true });
      if (m.error) return json(500, { error: m.error.message });
      return json(200, { ok: true, matches: m.data });
    }

    // Admin: POST /api/matches (create)
    if (event.httpMethod === "POST" && route === "matches") {
      const sb = getSupabaseAdmin();
      const u = verifyJwt(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });

      const body = JSON.parse(event.body || "{}");
      const ins = await sb.from("matches").insert(body).select("*").single();
      if (ins.error) return json(500, { error: ins.error.message });
      return json(200, { ok: true, match: ins.data });
    }

    // Admin: PUT /api/matches/:id (update + recalc points)
    const matchUpdate = route.match(/^matches\/(\d+)$/);
    if (matchUpdate && event.httpMethod === "PUT") {
      const sb = getSupabaseAdmin();
      const u = verifyJwt(event);
      if (!u || !u.is_admin) return json(403, { error: "Admini õigused puuduvad." });

      const id = Number(matchUpdate[1]);
      const body = JSON.parse(event.body || "{}");
      const upd = await sb.from("matches").update(body).eq("id", id).select("*").single();
      if (upd.error) return json(500, { error: upd.error.message });

      // If final score updated, recalc prediction points for this match
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

    // Predictions: GET /api/predictions (for me)
    if (event.httpMethod === "GET" && route === "predictions") {
      const sb = getSupabaseAdmin();
      const u = verifyJwt(event);
      if (!u) return json(401, { error: "Pole sisse logitud." });

      const q = await sb.from("predictions").select("match_id,pred_home,pred_away,points").eq("player_id", u.sub);
      if (q.error) return json(500, { error: q.error.message });
      return json(200, { ok: true, predictions: q.data });
    }

    // Predictions: POST /api/predictions { match_id, pred_home, pred_away }
    if (event.httpMethod === "POST" && route === "predictions") {
      const sb = getSupabaseAdmin();
      const u = verifyJwt(event);
      if (!u) return json(401, { error: "Pole sisse logitud." });

      const body = JSON.parse(event.body || "{}");
      const match_id = Number(body.match_id);
      const pred_home = Number(body.pred_home);
      const pred_away = Number(body.pred_away);

      // Fetch match final score (if already set) for immediate points
      const m = await sb.from("matches").select("final_home,final_away").eq("id", match_id).single();
      if (m.error) return json(500, { error: m.error.message });
      const points = calcPoints(pred_home, pred_away, m.data.final_home, m.data.final_away);

      const up = await sb.from("predictions").upsert({
        player_id: u.sub,
        match_id,
        pred_home,
        pred_away,
        points
      }, { onConflict: "player_id,match_id" }).select("match_id,pred_home,pred_away,points").single();

      if (up.error) return json(500, { error: up.error.message });
      return json(200, { ok: true, prediction: up.data });
    }

    // Leaderboard: GET /api/leaderboard
    if (event.httpMethod === "GET" && route === "leaderboard") {
      const sb = getSupabaseAdmin();
      // Sum points by player
      const res = await sb.rpc("leaderboard");
      if (res.error) {
        // fallback if rpc not created
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
      return json(200, { ok: true, leaderboard: res.data });
    }

    return json(404, { error: "Not found", route, method: event.httpMethod });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
}
