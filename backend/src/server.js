import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { q } from './db.js';
import { makeToken, requireAdmin, requireAuth } from './auth.js';
import { points } from './scoring.js';
import { updateScoresFromApi } from './scores.js';

dotenv.config();
const app = express();
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(x => x.trim()).filter(Boolean) : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ ok: true, name: 'Jalka MM 2026 API' }));
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/api/public/players', async (req, res) => {
  const rows = (await q('select id, name, role from players where active=true order by role desc, name')).rows;
  res.json(rows);
});

app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  const row = (await q('select * from players where name=$1 and active=true', [name])).rows[0];
  if (!row || !(await bcrypt.compare(password || '', row.password_hash))) return res.status(401).json({ error: 'Vale kasutaja või parool' });
  res.json({ token: makeToken(row), user: { id: row.id, name: row.name, role: row.role } });
});

app.get('/api/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/players', requireAuth, async (req, res) => {
  const rows = (await q('select id, name, role, active from players order by role desc, name')).rows;
  res.json(rows);
});

app.post('/api/players', requireAuth, requireAdmin, async (req, res) => {
  const { name, password, role = 'player' } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Nimi ja parool on kohustuslikud' });
  const hash = await bcrypt.hash(password, 12);
  const row = (await q('insert into players(name,password_hash,role) values($1,$2,$3) returning id,name,role,active', [name, hash, role])).rows[0];
  res.json(row);
});

app.put('/api/players/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, password, active, role } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    await q('update players set password_hash=$1 where id=$2', [hash, req.params.id]);
  }
  const row = (await q('update players set name=coalesce($1,name), active=coalesce($2,active), role=coalesce($3,role) where id=$4 returning id,name,role,active', [name || null, active, role || null, req.params.id])).rows[0];
  res.json(row);
});

app.delete('/api/players/:id', requireAuth, requireAdmin, async (req, res) => {
  await q('delete from players where id=$1', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Uus parool peab olema vähemalt 4 märki' });
  const row = (await q('select * from players where id=$1', [req.user.id])).rows[0];
  if (!(await bcrypt.compare(oldPassword || '', row.password_hash))) return res.status(400).json({ error: 'Praegune parool on vale' });
  const hash = await bcrypt.hash(newPassword, 12);
  await q('update players set password_hash=$1 where id=$2', [hash, req.user.id]);
  res.json({ ok: true });
});

app.get('/api/matches', requireAuth, async (req, res) => {
  const rows = (await q('select id, match_date as date, match_time as time, round, group_name as "group", home, away, venue, home_score as "homeScore", away_score as "awayScore", status, locked from matches order by id')).rows;
  res.json(rows);
});

app.post('/api/matches', requireAuth, requireAdmin, async (req, res) => {
  const m = req.body;
  const id = m.id || (await q('select coalesce(max(id),0)+1 as id from matches')).rows[0].id;
  const row = (await q('insert into matches(id,match_date,match_time,round,group_name,home,away,venue) values($1,$2,$3,$4,$5,$6,$7,$8) returning *', [id, m.date, m.time, m.round, m.group || null, m.home, m.away, m.venue])).rows[0];
  res.json(row);
});

app.put('/api/matches/:id', requireAuth, requireAdmin, async (req, res) => {
  const m = req.body;
  const row = (await q('update matches set match_date=$1, match_time=$2, round=$3, group_name=$4, home=$5, away=$6, venue=$7, home_score=$8, away_score=$9, locked=coalesce($10,locked), updated_at=now() where id=$11 returning id, match_date as date, match_time as time, round, group_name as "group", home, away, venue, home_score as "homeScore", away_score as "awayScore", locked', [m.date, m.time, m.round, m.group || null, m.home, m.away, m.venue, m.homeScore ?? null, m.awayScore ?? null, m.locked, req.params.id])).rows[0];
  res.json(row);
});

app.delete('/api/matches/:id', requireAuth, requireAdmin, async (req, res) => {
  await q('delete from matches where id=$1', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/predictions/me', requireAuth, async (req, res) => {
  const rows = (await q('select match_id as "matchId", home_score as "homeScore", away_score as "awayScore" from predictions where player_id=$1', [req.user.id])).rows;
  res.json(rows);
});

app.post('/api/predictions', requireAuth, async (req, res) => {
  const items = req.body.predictions || [];
  for (const p of items) {
    const locked = (await q('select locked from matches where id=$1', [p.matchId])).rows[0]?.locked;
    if (locked) continue;
    await q('insert into predictions(player_id,match_id,home_score,away_score) values($1,$2,$3,$4) on conflict(player_id,match_id) do update set home_score=$3, away_score=$4, updated_at=now()', [req.user.id, p.matchId, p.homeScore, p.awayScore]);
  }
  res.json({ ok: true });
});

app.get('/api/leaderboard', requireAuth, async (req, res) => {
  const players = (await q('select id, name from players where active=true order by name')).rows;
  const matches = (await q('select id, home_score, away_score from matches')).rows;
  const predictions = (await q('select player_id, match_id, home_score, away_score from predictions')).rows;
  const table = players.map(player => {
    const mine = predictions.filter(p => p.player_id === player.id);
    let total = 0;
    for (const p of mine) {
      const m = matches.find(x => x.id === p.match_id);
      const pts = m ? points(m, p) : null;
      if (pts !== null) total += pts;
    }
    return { id: player.id, name: player.name, points: total, predictions: mine.length };
  }).sort((a, b) => b.points - a.points || b.predictions - a.predictions || a.name.localeCompare(b.name));
  res.json(table);
});

app.post('/api/admin/sync-scores', requireAuth, requireAdmin, async (req, res) => {
  const result = await updateScoresFromApi();
  res.json(result);
});

cron.schedule('*/15 * * * *', async () => {
  try { await updateScoresFromApi(); } catch (e) { console.error('score sync failed', e.message); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Jalka API töötab pordil ${port}`));
