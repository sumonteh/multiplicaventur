// ============================================================
// QUESTION ENGINE
// ============================================================
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateQuestion(t, n, mode='classic') {
  const ans = t * n;
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const distance = mode === 'challenge' ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 8) + 1;
    const w = ans + distance * (Math.random() > 0.5 ? 1 : -1);
    if (w !== ans && w > 0) wrongs.add(w);
  }
  const opts = shuffle([ans, ...wrongs]);
  return { t, n, ans, opts, table: t };
}

function generateQuestions(tables, count, mode) {
  const config = getModeConfig(mode);
  if (!config) throw new Error(`Modo desconocido: ${mode}`);
  const factors = Array.from(
    { length: config.factorEnd - config.factorStart + 1 },
    (_, index) => config.factorStart + index,
  );
  const pool = [];
  tables.forEach(t => factors.forEach(n => pool.push({t, n})));
  if (count > pool.length) {
    throw new Error(`No hay suficientes combinaciones únicas para ${count} preguntas`);
  }
  return shuffle(pool).slice(0, count).map(({t, n}) => generateQuestion(t, n, mode));
}
