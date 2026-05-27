export function points(match, prediction) {
  if (match.home_score === null || match.away_score === null) return null;
  const ah = Number(match.home_score);
  const aa = Number(match.away_score);
  const ph = Number(prediction.home_score);
  const pa = Number(prediction.away_score);
  if (ph === ah && pa === aa) return 4;
  const actualResult = Math.sign(ah - aa);
  const predictedResult = Math.sign(ph - pa);
  let score = actualResult === predictedResult ? 2 : 0;
  if (ph === ah) score += 1;
  if (pa === aa) score += 1;
  return score;
}
