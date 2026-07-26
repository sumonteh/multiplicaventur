const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(root, 'docs', 'screenshots');
const checks = [];
const failures = [];
const pageErrors = [];

function check(name, condition, details = '') {
  const result = { name, ok: Boolean(condition), details };
  checks.push(result);
  if (!result.ok) failures.push(`${name}${details ? `: ${details}` : ''}`);
}

function contentType(file) {
  return {
    '.html':'text/html; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.js':'text/javascript; charset=utf-8',
    '.png':'image/png',
  }[path.extname(file)] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type':contentType(file) });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, url:`http://127.0.0.1:${server.address().port}` });
    });
  });
}

async function run() {
  fs.mkdirSync(screenshots, { recursive:true });
  const { server, url } = await startServer();
  const launchOptions = { headless:true };
  if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport:{ width:1280, height:800 } });
  page.on('pageerror', error => pageErrors.push(String(error)));

  try {
    await page.goto(url, { waitUntil:'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil:'networkidle' });

    check('Pantalla inicial', await page.locator('#screen-welcome').evaluate(el => el.classList.contains('active')));
    await page.getByRole('button', { name:/Comenzar/ }).click();
    await page.locator('#player-name-input').fill('Javi');
    await page.getByRole('button', { name:/Listo/ }).click();
    await page.getByRole('button', { name:/Reclamar/ }).click();
    check('Creación de jugador', await page.locator('#screen-map').evaluate(el => el.classList.contains('active')));
    await page.screenshot({ path:path.join(screenshots, 'desktop.png'), fullPage:true });

    const uniqueData = await page.evaluate(() => {
      const questions = generateQuestions([2,3], 20, 'challenge');
      return {
        count:questions.length,
        unique:new Set(questions.map(q => `${q.t}x${q.n}`)).size,
        minFactor:Math.min(...questions.map(q => q.n)),
      };
    });
    check(
      'Desafío sin preguntas duplicadas',
      uniqueData.count === 20 && uniqueData.unique === 20 && uniqueData.minFactor >= 3,
      JSON.stringify(uniqueData),
    );

    const architectureData = await page.evaluate(() => {
      validateGameContent();
      return WORLDS.flatMap(world => Object.keys(GAME_MODES).map(modeId => {
        const mode = getModeConfig(modeId);
        const questions = generateQuestions(world.tables, mode.questionCount, modeId);
        return {
          mode:modeId,
          count:questions.length,
          unique:new Set(questions.map(q => `${q.t}x${q.n}`)).size,
        };
      }));
    });
    check(
      'Todos los mundos son compatibles con todas las modalidades',
      architectureData.length === 25 && architectureData.every(item =>
        item.count === item.unique && item.count === (item.mode === 'challenge' ? 20 : 10)),
    );

    const migration = await page.evaluate(() => {
      const migrated = migrateState({ name:'Anterior', ownedItems:{xp2:1, coins2:2} });
      return {
        version:migrated.version,
        xp2:migrated.ownedItems.xp2,
        coins2:migrated.ownedItems.coins2,
        hasProgress:Boolean(migrated.tableProgress && migrated.flashcardProgress),
      };
    });
    check(
      'Partidas anteriores migran a la nueva estructura',
      migration.version === 2 && migration.xp2 === 3 && migration.coins2 === 6 && migration.hasProgress,
      JSON.stringify(migration),
    );

    await page.evaluate(() => {
      session.tables = [2,3];
      session.worldId = 'w1';
      startGame('speed');
    });
    const beforeTime = await page.evaluate(() => session.timeLeft);
    await page.evaluate(() => showScreen('map'));
    await page.waitForTimeout(500);
    const afterLeave = await page.evaluate(() => ({
      active:session.inProgress,
      time:session.timeLeft,
      current:session.current,
    }));
    check(
      'Salida detiene partida rápida',
      !afterLeave.active && afterLeave.time === beforeTime && afterLeave.current === 0,
      JSON.stringify(afterLeave),
    );

    await page.evaluate(() => {
      gs.coins = 1000;
      gs.ownedItems = {};
      handleShopClick('items', ITEMS.find(item => item.id === 'coins2'), false, false);
    });
    check('Compra Monedas x2 entrega 3 partidas', await page.evaluate(() => gs.ownedItems.coins2 === 3));

    await page.evaluate(() => {
      gs.ownedItems.hint = 1;
      session.tables = [2,3];
      startGame('classic');
      useHint();
    });
    const hint = await page.evaluate(() => ({
      remaining:gs.ownedItems.hint,
      hidden:[...document.querySelectorAll('.answer-btn')]
        .filter(button => button.style.visibility === 'hidden').length,
    }));
    check(
      'Pista consume una carga y elimina dos opciones',
      hint.remaining === 0 && hint.hidden === 2,
      JSON.stringify(hint),
    );

    await page.evaluate(() => {
      showScreen('map');
      gs.ownedItems.shield = 1;
      session.tables = [2,3];
      startGame('classic');
      session.streak = 3;
      const question = session.questions[0];
      [...document.querySelectorAll('.answer-btn')]
        .find(button => Number(button.textContent) !== question.ans)
        .click();
    });
    await page.waitForTimeout(100);
    const shield = await page.evaluate(() => ({
      remaining:gs.ownedItems.shield || 0,
      streak:session.streak,
    }));
    check(
      'Escudo protege la racha una vez',
      shield.remaining === 0 && shield.streak === 3,
      JSON.stringify(shield),
    );

    await page.evaluate(() => showScreen('map'));
    await page.evaluate(() => {
      gs.ownedItems = { coins2:3, xp2:3, magnet:1 };
      gs.coins = 0;
      gs.xp = 0;
      session.tables = [2,3];
      startGame('classic');
      session.correct = 1;
      session.results = [{ table:2, factor:1, correct:true }];
      endGame();
    });
    const boosters = await page.evaluate(() => ({
      coins2:gs.ownedItems.coins2,
      xp2:gs.ownedItems.xp2,
      magnet:gs.ownedItems.magnet,
      coins:gs.coins,
      progress:gs.tableProgress[2][1],
    }));
    check(
      'Potenciadores se consumen por partida',
      boosters.coins2 === 2 && boosters.xp2 === 2 && boosters.magnet === 0 && boosters.coins > 0,
      JSON.stringify(boosters),
    );
    check(
      'Resultado actualiza progreso por multiplicación',
      boosters.progress.attempts === 1 && boosters.progress.correct === 1,
    );

    await page.evaluate(() => {
      showScreen('map');
      gs.ownedItems.life = 1;
      session.tables = [2,3];
      startGame('survival');
    });
    const life = await page.evaluate(() => ({
      lives:session.lives,
      remaining:gs.ownedItems.life || 0,
    }));
    check('Vida extra se activa en supervivencia', life.lives === 4 && life.remaining === 0, JSON.stringify(life));

    await page.evaluate(() => {
      showScreen('flashcards');
      initFlashcards(2);
      fcMark(true);
    });
    await page.waitForTimeout(450);
    check('Tarjeta guarda la marca', await page.evaluate(() => gs.flashcardProgress[2][1] === 'known'));
    await page.reload({ waitUntil:'networkidle' });
    await page.evaluate(() => {
      showScreen('flashcards');
      initFlashcards(2);
    });
    check('Tarjeta persiste tras recargar', await page.evaluate(() => fcState.known.has(1)));

    const daily = await page.evaluate(() => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 3);
      gs.lastDaily = localDateKey(oldDate);
      gs.dailyStreak = 5;
      checkDaily();
      return {
        streak:gs.dailyStreak,
        reward:document.getElementById('daily-reward-text').textContent,
      };
    });
    check(
      'Racha diaria se reinicia tras faltar días',
      daily.streak === 0 && daily.reward.includes('+20'),
      JSON.stringify(daily),
    );

    await page.setViewportSize({ width:375, height:667 });
    await page.evaluate(() => {
      gs.level = 10;
      session.tables = [2,3];
      startGame('typing');
    });
    const mobile = await page.evaluate(() => {
      const ok = document.querySelector('.pad-btn.ok').getBoundingClientRect();
      return {
        okBottom:ok.bottom,
        navVisible:document.getElementById('nav-bar').classList.contains('visible'),
        width:document.documentElement.scrollWidth,
      };
    });
    check(
      'Teclado móvil no queda oculto',
      mobile.okBottom <= 667 && !mobile.navVisible && mobile.width <= 375,
      JSON.stringify(mobile),
    );
    await page.screenshot({ path:path.join(screenshots, 'mobile.png'), fullPage:true });

    check('Sin errores de ejecución', pageErrors.length === 0, pageErrors.join('\n'));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const report = { total:checks.length, passed:checks.filter(item => item.ok).length, checks, failures };
  console.log(JSON.stringify(report, null, 2));
  if (checks.length !== 17) {
    console.error(`Se esperaban 17 comprobaciones y se ejecutaron ${checks.length}.`);
    process.exitCode = 1;
  }
  if (failures.length) process.exitCode = 1;
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
