import { q } from './db.js';

function normalizeName(name = '') {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function updateScoresFromApi() {
  if (!process.env.FOOTBALL_API_KEY) {
    return { updated: 0, message: 'FOOTBALL_API_KEY puudub. Sisesta skoorid admini vaates käsitsi või lisa API võti.' };
  }

  const provider = process.env.FOOTBALL_API_PROVIDER || 'football-data';
  if (provider !== 'football-data') {
    return { updated: 0, message: 'Praegu on valmis football-data adapter. Teise API jaoks lisa uus adapter src/scores.js failis.' };
  }

  const url = 'https://api.football-data.org/v4/competitions/WC/matches';
  const r = await fetch(url, { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY } });
  if (!r.ok) return { updated: 0, message: `API vastus ${r.status}` };
  const data = await r.json();
  let updated = 0;
  const local = (await q('select id, match_date, home, away from matches')).rows;

  for (const item of data.matches || []) {
    const d = item.utcDate ? item.utcDate.slice(0, 10) : null;
    const home = normalizeName(item.homeTeam?.name || item.homeTeam?.shortName);
    const away = normalizeName(item.awayTeam?.name || item.awayTeam?.shortName);
    const found = local.find(m => String(m.match_date).slice(0, 10) === d && normalizeName(m.home) === home && normalizeName(m.away) === away);
    const full = item.score?.fullTime;
    if (!found || full?.home === null || full?.away === null || full?.home === undefined || full?.away === undefined) continue;
    await q('update matches set home_score=$1, away_score=$2, status=$3, updated_at=now() where id=$4', [full.home, full.away, item.status || 'finished', found.id]);
    updated++;
  }
  return { updated, message: `Uuendatud mänge: ${updated}` };
}
