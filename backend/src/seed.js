import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { q, pool } from './db.js';

dotenv.config();
const schema = fs.readFileSync(new URL('../sql/schema.sql', import.meta.url), 'utf8');
await q(schema);

const players = ['Admin','H. Laas','M. Vingissar','S. Kase','E. Ohno','M. Reitel','J. Võsa','R. Tikas','T. Laurits','S. Maasalu','R. Peips','T. Tiirmaa','R. Kaljula','R. Haugas'];
for (const name of players) {
  const role = name === 'Admin' ? 'admin' : 'player';
  const password = name === 'Admin' ? 'admin' : '1234';
  const hash = await bcrypt.hash(password, 12);
  await q('insert into players(name,password_hash,role) values($1,$2,$3) on conflict(name) do nothing', [name, hash, role]);
}

const matches = JSON.parse(fs.readFileSync(new URL('./matches.json', import.meta.url), 'utf8'));
for (const m of matches) {
  await q('insert into matches(id,match_date,match_time,round,group_name,home,away,venue,home_score,away_score) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict(id) do update set match_date=$2, match_time=$3, round=$4, group_name=$5, home=$6, away=$7, venue=$8', [m.id, m.date, m.time, m.round, m.group || null, m.home, m.away, m.venue, m.homeScore, m.awayScore]);
}
console.log('Andmebaas on valmis. Admin parool: admin, mängijate esialgne parool: 1234');
await pool.end();
