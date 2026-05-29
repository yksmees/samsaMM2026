import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ================== ENV ==================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase env puudub");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ================== APP ==================

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== HELPERS ==================

function auth(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function outcome(h, a) {
  return h > a ? 1 : h < a ? -1 : 0;
}

function calcPoints(ph, pa, fh, fa) {
  if (fh == null || fa == null) return 0;

  if (ph === fh && pa === fa) return 4;

  const po = outcome(ph, pa);
  const fo = outcome(fh, fa);

  if (po === fo && ph === fh) return 3;
  if (po === fo) return 2;
  if (pa === fa) return 1;

  return 0;
}

// ================== ROUTES ==================

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date() });
});

// ===== REGISTER =====
app.post("/api/register", async (req, res) => {
  const { username, password, password_confirm } = req.body;

  if (!username || password.length < 6)
    return res.status(400).json({ error: "Vale sisend" });

  if (password !== password_confirm)
    return res.status(400).json({ error: "Paroolid ei kattu" });

  const { data: exists } = await supabase
    .from("players")
    .select("id")
    .eq("username", username);

  if (exists?.length)
    return res.status(400).json({ error: "Kasutaja olemas" });

  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("players")
    .insert({
      username,
      display_name: username,
      password_hash: hash,
      is_admin: false
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = jwt.sign(data, JWT_SECRET);

  res.json({ token, user: data });
});

// ===== LOGIN =====
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data)
    return res.status(400).json({ error: "Vale kasutaja" });

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok)
    return res.status(400).json({ error: "Vale parool" });

  const token = jwt.sign(data, JWT_SECRET);

  res.json({ token, user: data });
});

// ===== MATCHES =====
app.get("/api/matches", async (req, res) => {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_no", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ===== SAVE PREDICTION =====
app.post("/api/predictions", async (req, res) => {
  const user = auth(req);
  if (!user) return res.status(401).json({ error: "Pole loginud" });

  const { match_id, pred_home, pred_away } = req.body;

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", match_id)
    .single();

  // 1h LOCK
  if (!user.is_admin && match.kickoff_utc) {
    const lockTime =
      new Date(match.kickoff_utc).getTime() - 3600000;
    if (Date.now() >= lockTime)
      return res.status(403).json({ error: "Ennustus lukus" });
  }

  const points = calcPoints(
    pred_home,
    pred_away,
    match.final_home,
    match.final_away
  );

  const { error } = await supabase
    .from("predictions")
    .upsert({
      player_id: user.id,
      match_id,
      pred_home,
      pred_away,
      points
    });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ ok: true });
});

// ===== ADMIN: SET RESULT =====
app.post("/api/admin/result", async (req, res) => {
  const user = auth(req);
  if (!user || !user.is_admin)
    return res.status(403).json({ error: "Admin only" });

  const { match_id, home, away } = req.body;

  const { error } = await supabase
    .from("matches")
    .update({ final_home: home, final_away: away })
    .eq("id", match_id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ ok: true });
});

// ===== STATIC FRONTEND =====
app.use(express.static(path.join(__dirname, "frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ===== START =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server töötab pordil", PORT);
});