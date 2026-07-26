// ============================================================
// HUD
// ============================================================
function updateHud() {
  document.getElementById('hud-coins').textContent = gs.coins;
  document.getElementById('hud-level').textContent = gs.level;
  const needed = xpForLevel(gs.level);
  const pct = Math.min(100, Math.round(gs.xp / needed * 100));
  document.getElementById('xp-fill').style.width = pct + '%';
  document.getElementById('xp-text').textContent = `${gs.xp}/${needed} XP`;
}

function showHud(v, navVisible=v) {
  document.getElementById('hud').classList.toggle('visible', v);
  document.getElementById('nav-bar').classList.toggle('visible', navVisible);
}

// ============================================================
// SCREENS
// ============================================================
function showScreen(id, updateNav=true) {
  const leavingQuiz = session.inProgress &&
    document.getElementById('screen-quiz').classList.contains('active') &&
    !['quiz', 'results'].includes(id);
  if (leavingQuiz) {
    clearInterval(session.timerInterval);
    clearTimeout(session.nextTimeout);
    session.timerInterval = null;
    session.nextTimeout = null;
    session.inProgress = false;
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  const hudScreens = ['map','mode','quiz','results','shop','profile','flashcards'];
  const navScreens = ['map','mode','results','shop','profile','flashcards'];
  showHud(hudScreens.includes(id), navScreens.includes(id));
  if (updateNav) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navMap = {map:'nav-map', shop:'nav-shop', profile:'nav-profile', flashcards:'nav-flashcards'};
    if (navMap[id]) document.getElementById(navMap[id]).classList.add('active');
  }
  if (id === 'map') renderMap();
  if (id === 'shop') renderShop('characters');
  if (id === 'profile') renderProfile();
  if (id === 'flashcards') { renderFcTableSelector(); initFlashcards(fcState.table); }
  window.scrollTo(0,0);
}

// ============================================================
// WELCOME / INIT
// ============================================================
function startApp() {
  loadGs();
  if (!gs.name) {
    showScreen('name', false);
    document.getElementById('hud').classList.remove('visible');
    document.getElementById('nav-bar').classList.remove('visible');
  } else {
    checkDaily();
  }
}

function continueGame() {
  loadGs();
  if (!gs.name) { startApp(); return; }
  checkDaily();
}

function saveName() {
  const n = document.getElementById('player-name-input').value.trim();
  if (!n) return;
  gs.name = n;
  saveGs();
  checkDaily();
}

// ============================================================
// DAILY BONUS
// ============================================================
const DAILY_REWARDS = [20, 25, 30, 40, 50, 60, 100];

function localDateKey(date=new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizedSavedDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : localDateKey(parsed);
}

function daysBetweenDateKeys(from, to) {
  if (!from || !to) return Infinity;
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm-1, td) - Date.UTC(fy, fm-1, fd)) / 86400000);
}

function effectiveDailyStreak(today=localDateKey()) {
  const last = normalizedSavedDate(gs.lastDaily);
  if (!last) return 0;
  const gap = daysBetweenDateKeys(last, today);
  return gap <= 1 ? Math.min(gs.dailyStreak, 6) : 0;
}

function checkDaily() {
  const today = localDateKey();
  const last = normalizedSavedDate(gs.lastDaily);
  if (last === today) {
    showScreen('map');
    return;
  }
  if (daysBetweenDateKeys(last, today) > 1) gs.dailyStreak = 0;
  renderDailyScreen();
  showScreen('daily', false);
  document.getElementById('hud').classList.remove('visible');
  document.getElementById('nav-bar').classList.remove('visible');
}

function renderDailyScreen() {
  const streak = effectiveDailyStreak();
  const grid = document.getElementById('daily-grid');
  grid.innerHTML = '';
  DAILY_REWARDS.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'daily-day' + (i < streak ? ' claimed' : '') + (i === streak ? ' today' : '');
    div.innerHTML = `<div class="daily-coin">🪙</div><div class="daily-amount">+${r}</div><div style="font-size:11px;color:var(--text2);margin-top:2px;">Día ${i+1}</div>`;
    grid.appendChild(div);
  });
  document.getElementById('daily-reward-text').textContent = `+${DAILY_REWARDS[streak]} monedas 🎉`;
}

function claimDaily() {
  const today = localDateKey();
  const last = normalizedSavedDate(gs.lastDaily);
  if (last === today) {
    showScreen('map');
    return;
  }
  const streak = effectiveDailyStreak(today);
  const reward = DAILY_REWARDS[streak];
  gs.lastDaily = today;
  gs.dailyStreak = (gs.dailyStreak + 1) % 7;
  gs.coins += reward;
  updateHud();
  saveGs();
  showScreen('map');
  showNotification(`🪙 +${reward} monedas de bonificación diaria!`, 3000);
}

// ============================================================
// MAP
// ============================================================
function renderMap() {
  const container = document.getElementById('world-map');
  container.innerHTML = '';
  WORLDS.forEach(w => {
    const unlocked = gs.level >= w.minLevel;
    const stars = gs.worldStars[w.id] || 0;
    const div = document.createElement('div');
    div.className = 'world-node' + (!unlocked ? ' locked' : '') + (stars > 0 ? ' completed' : '');
    div.innerHTML = `
      <span class="node-icon">${w.icon}</span>
      <div class="node-info">
        <div class="node-title">${w.title}</div>
        <div class="node-desc">Tablas del ${w.tables.join(' y del ')} · Nivel ${w.minLevel}+</div>
      </div>
      <div>${unlocked ? (stars > 0 ? '⭐'.repeat(stars) + '☆'.repeat(3-stars) : '▶') : '🔒'}</div>
    `;
    if (unlocked) {
      div.onclick = () => {
        session.worldId = w.id;
        session.tables = w.tables;
        document.getElementById('mode-world-title').textContent = w.title;
        showScreen('mode');
      };
    } else {
      div.onclick = () => showNotification(`🔒 Necesitas nivel ${w.minLevel} para desbloquear`, 2500);
    }
    container.appendChild(div);
  });
}

// ============================================================
// QUIZ
// ============================================================
function startGame(mode) {
  clearInterval(session.timerInterval);
  clearTimeout(session.nextTimeout);
  const modeConfig = getModeConfig(mode);
  if (!modeConfig) {
    showNotification('❌ Este modo de juego no está disponible', 2500);
    return;
  }
  session.mode = mode;
  session.correct = 0;
  session.wrong = 0;
  session.streak = 0;
  session.maxStreak = 0;
  session.answered = false;
  session.current = 0;
  session.finished = false;
  session.inProgress = true;
  session.results = [];
  session.shieldAvailable = (gs.ownedItems.shield || 0) > 0;
  session.magnetActive = (gs.ownedItems.magnet || 0) > 0;
  if (mode === 'survival') {
    session.maxLives = modeConfig.startingLives;
    if ((gs.ownedItems.life || 0) > 0) {
      session.maxLives++;
      consumeItem('life');
      saveGs();
      showNotification('❤️ Vida extra activada', 2200);
    }
    session.lives = session.maxLives;
  }
  const count = modeConfig.questionCount;
  session.questions = generateQuestions(session.tables, count, mode);
  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = session.questions[session.current];
  const total = session.questions.length;
  document.getElementById('question-counter').textContent = `${session.current+1}/${total}`;
  document.getElementById('q-progress').style.width = `${session.current/total*100}%`;
  document.getElementById('q-table-label').textContent = `Tabla del ${q.table}`;
  document.getElementById('question-text').textContent = `${q.t} × ${q.n} = ?`;
  document.getElementById('streak-display').textContent = `🔥 ${session.streak}`;
  document.getElementById('hint-count').textContent = gs.ownedItems.hint || 0;
  document.getElementById('hint-button').disabled = (gs.ownedItems.hint || 0) <= 0;

  // Lives
  const livesEl = document.getElementById('lives-display');
  if (session.mode === 'survival') {
    livesEl.textContent = '❤️'.repeat(session.lives) + '🖤'.repeat(Math.max(0, session.maxLives-session.lives));
  } else { livesEl.textContent = ''; }

  // Answers: opciones múltiples o teclado numérico según el modo
  const grid = document.getElementById('answers-grid');
  const typedWrap = document.getElementById('typed-answer-wrap');
  grid.innerHTML = '';
  if (session.mode === 'typing') {
    grid.style.display = 'none';
    typedWrap.style.display = 'flex';
    session.typed = '';
    const disp = document.getElementById('typed-display');
    disp.classList.remove('correct','wrong');
    document.getElementById('typed-hint').textContent = '';
    document.querySelectorAll('.pad-btn').forEach(b => b.disabled = false);
    renderTyped();
  } else {
    grid.style.display = 'grid';
    typedWrap.style.display = 'none';
    q.opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.onclick = () => answer(btn, opt, q.ans);
      grid.appendChild(btn);
    });
  }

  session.answered = false;

  // Timer for speed mode
  const timerBar = document.getElementById('timer-bar-wrap');
  const timerFill = document.getElementById('timer-fill');
  clearInterval(session.timerInterval);
  const modeConfig = getModeConfig(session.mode);
  if (modeConfig.timedSeconds > 0) {
    timerBar.style.display = 'block';
    session.timeLeft = modeConfig.timedSeconds;
    timerFill.style.width = '100%';
    timerFill.style.background = 'var(--green)';
    session.timerInterval = setInterval(() => {
      session.timeLeft -= 0.1;
      const pct = session.timeLeft / modeConfig.timedSeconds * 100;
      timerFill.style.width = pct + '%';
      timerFill.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--orange)' : 'var(--red)';
      if (session.timeLeft <= 0) {
        clearInterval(session.timerInterval);
        timeOut();
      }
    }, 100);
  } else {
    timerBar.style.display = 'none';
  }
}

function timeOut() {
  if (session.answered) return;
  session.answered = true;
  session.wrong++;
  recordAnswer(false);
  breakStreakOrUseShield();
  // Highlight correct
  document.querySelectorAll('.answer-btn').forEach(btn => {
    if (parseInt(btn.textContent) === session.questions[session.current].ans) {
      btn.classList.add('correct');
    }
    btn.disabled = true;
  });
  if (session.mode === 'survival') {
    session.lives--;
    if (session.lives <= 0) { session.nextTimeout = setTimeout(endGame, 800); return; }
  }
  session.nextTimeout = setTimeout(nextQuestion, 1000);
}

function answer(btn, chosen, correct) {
  if (session.answered) return;
  session.answered = true;
  clearInterval(session.timerInterval);

  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add('correct');
    session.correct++;
    session.streak++;
    if (session.streak > session.maxStreak) session.maxStreak = session.streak;
    document.getElementById('streak-display').textContent = `🔥 ${session.streak}`;
    spawnCoinAnim(btn, session.streak > 2 ? session.streak : 1);
    recordAnswer(true);
  } else {
    btn.classList.add('wrong');
    session.wrong++;
    recordAnswer(false);
    breakStreakOrUseShield();
    document.querySelectorAll('.answer-btn').forEach(b => {
      if (parseInt(b.textContent) === correct) b.classList.add('correct');
    });
    if (session.mode === 'survival') {
      session.lives--;
      document.getElementById('lives-display').textContent = '❤️'.repeat(session.lives) + '🖤'.repeat(Math.max(0,session.maxLives-session.lives));
      if (session.lives <= 0) { session.nextTimeout = setTimeout(endGame, 900); return; }
    }
  }
  session.nextTimeout = setTimeout(nextQuestion, chosen === correct ? 600 : 1200);
}

function recordAnswer(correct) {
  const q = session.questions[session.current];
  session.results.push({ table:q.t, factor:q.n, correct });
}

function breakStreakOrUseShield() {
  if (session.shieldAvailable && session.streak > 0) {
    session.shieldAvailable = false;
    consumeItem('shield');
    saveGs();
    showNotification('🛡️ El escudo protegió tu racha', 2200);
  } else {
    session.streak = 0;
  }
  document.getElementById('streak-display').textContent = `🔥 ${session.streak}`;
}

function useHint() {
  if (!session.inProgress || session.answered || (gs.ownedItems.hint || 0) <= 0) return;
  const q = session.questions[session.current];
  consumeItem('hint');
  if (session.mode === 'typing') {
    const low = Math.floor(q.ans / 10) * 10;
    const high = low + 9;
    document.getElementById('typed-hint').textContent = q.ans < 10
      ? '💡 El resultado es menor que 10'
      : `💡 El resultado está entre ${low} y ${high}`;
  } else {
    const wrongButtons = shuffle([...document.querySelectorAll('.answer-btn')]
      .filter(btn => Number(btn.textContent) !== q.ans));
    wrongButtons.slice(0, 2).forEach(btn => {
      btn.disabled = true;
      btn.style.visibility = 'hidden';
    });
  }
  document.getElementById('hint-count').textContent = gs.ownedItems.hint || 0;
  document.getElementById('hint-button').disabled = (gs.ownedItems.hint || 0) <= 0;
  saveGs();
}

// ---- Modo Escribir: teclado numérico ----
function renderTyped() {
  const disp = document.getElementById('typed-display');
  disp.textContent = session.typed || '?';
  disp.classList.toggle('empty', !session.typed);
}

function padPress(d) {
  if (session.answered || session.mode !== 'typing') return;
  if (session.typed.length >= 3) return;
  session.typed += d;
  renderTyped();
}

function padDel() {
  if (session.answered || session.mode !== 'typing') return;
  session.typed = session.typed.slice(0, -1);
  renderTyped();
}

function padOk() {
  if (session.answered || session.mode !== 'typing' || !session.typed) return;
  session.answered = true;
  const q = session.questions[session.current];
  const val = parseInt(session.typed, 10);
  const disp = document.getElementById('typed-display');
  const hint = document.getElementById('typed-hint');
  document.querySelectorAll('.pad-btn').forEach(b => b.disabled = true);

  if (val === q.ans) {
    disp.classList.add('correct');
    hint.textContent = '✅ ¡Correcto!';
    session.correct++;
    session.streak++;
    if (session.streak > session.maxStreak) session.maxStreak = session.streak;
    document.getElementById('streak-display').textContent = `🔥 ${session.streak}`;
    spawnCoinAnim(disp, session.streak > 2 ? session.streak : 1);
    recordAnswer(true);
  } else {
    disp.classList.add('wrong');
    hint.textContent = `❌ La respuesta era ${q.ans}`;
    session.wrong++;
    recordAnswer(false);
    breakStreakOrUseShield();
  }
  session.nextTimeout = setTimeout(nextQuestion, val === q.ans ? 700 : 1500);
}

// Teclado físico para el modo Escribir
document.addEventListener('keydown', e => {
  if (!document.getElementById('screen-quiz').classList.contains('active')) return;
  if (session.mode !== 'typing') return;
  if (e.key >= '0' && e.key <= '9') { e.preventDefault(); padPress(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); padDel(); }
  else if (e.key === 'Enter') { e.preventDefault(); padOk(); }
});

function nextQuestion() {
  if (!session.inProgress) return;
  session.current++;
  if (session.current >= session.questions.length) {
    endGame();
  } else {
    renderQuestion();
  }
}

function endGame() {
  if (session.finished) return;
  session.finished = true;
  session.inProgress = false;
  clearInterval(session.timerInterval);
  clearTimeout(session.nextTimeout);
  const total = session.questions.length;
  const pct = session.correct / total;

  // Calculate coins
  const modeConfig = getModeConfig(session.mode);
  const multiplier = pct >= 0.9 ? 1.5 : pct >= 0.7 ? 1.2 : 1;
  const streakBonus = session.maxStreak >= 5 ? 10 : session.maxStreak >= 3 ? 5 : 0;
  let earned = Math.round((modeConfig.baseCoins + session.correct * 2 + streakBonus) * multiplier);
  if (session.magnetActive) earned = Math.round(earned * 1.25);
  earned = addCoins(earned);
  addXP(session.correct * 10 + streakBonus * 5);
  finishBoosterUse();

  // Update stats
  gs.totalCorrect += session.correct;
  if (session.maxStreak > gs.bestStreak) gs.bestStreak = session.maxStreak;
  gs.totalGames++;
  session.results.forEach(result => {
    const table = gs.tableProgress[result.table] || {};
    const factor = table[result.factor] || { attempts:0, correct:0 };
    factor.attempts++;
    if (result.correct) factor.correct++;
    table[result.factor] = factor;
    gs.tableProgress[result.table] = table;
  });

  // Stars
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
  const prev = gs.worldStars[session.worldId] || 0;
  if (stars > prev) gs.worldStars[session.worldId] = stars;

  // Partida perfecta: regala un premio pixel art que aún no tenga
  let wonReward = null;
  if (session.correct === total) {
    const pool = PIXEL_REWARDS.filter(r => !gs.ownedRewards.includes(r.id));
    if (pool.length > 0) {
      wonReward = pool[Math.floor(Math.random() * pool.length)];
      gs.ownedRewards.push(wonReward.id);
    }
  }
  saveGs();

  const rewardBox = document.getElementById('new-reward-box');
  if (wonReward) {
    rewardBox.style.display = 'block';
    rewardBox.innerHTML = `
      <div class="new-reward-title">✨ ¡Premio nuevo desbloqueado! ✨</div>
      ${pixelSVG(wonReward, 72)}
      <div class="new-reward-name">${wonReward.name}</div>
      <div style="font-size:13px; color:var(--text2);">${wonReward.desc}</div>
    `;
  } else {
    rewardBox.style.display = 'none';
  }

  // Result screen
  const icons = pct >= 0.9 ? '🏆' : pct >= 0.6 ? '⭐' : pct >= 0.3 ? '😊' : '💪';
  const titles = pct >= 0.9 ? '¡Eres un genio!' : pct >= 0.6 ? '¡Muy bien!' : pct >= 0.3 ? '¡Buen intento!' : '¡Sigue practicando!';
  document.getElementById('result-icon').textContent = icons;
  document.getElementById('result-title').textContent = titles;
  document.getElementById('result-subtitle').textContent = `${session.correct}/${total} respuestas correctas`;
  document.getElementById('coins-earned-display').textContent = `+${earned}`;
  document.getElementById('res-correct').textContent = session.correct;
  document.getElementById('res-wrong').textContent = session.wrong;
  document.getElementById('res-streak').textContent = session.maxStreak;
  showScreen('results');
}

function playAgain() { startGame(session.mode); }

// ============================================================
// COIN ANIMATION
// ============================================================
function spawnCoinAnim(el, n) {
  const rect = el.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'coin-popup';
  pop.textContent = `+${n}🪙`;
  pop.style.left = (rect.left + rect.width/2 - 20) + 'px';
  pop.style.top = (rect.top + window.scrollY - 10) + 'px';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1200);
}

// ============================================================
// SHOP
// ============================================================
let currentTab = 'characters';
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  renderShop(tab);
}

function getCharEmoji() {
  const c = CHARACTERS.find(c => c.id === gs.equippedChar);
  return c ? c.emoji : '❓';
}

function getSkinEmoji() {
  const s = SKINS.find(s => s.id === gs.equippedSkin);
  return (s && s.id !== 'default') ? s.emoji : '';
}

function renderShopHeader() {
  const c = CHARACTERS.find(c => c.id === gs.equippedChar);
  const s = SKINS.find(s => s.id === gs.equippedSkin);
  const skinEmoji = getSkinEmoji();
  // Build char+skin display
  const charEl = document.getElementById('shop-equipped-char');
  if (skinEmoji) {
    charEl.innerHTML = `<div class="char-with-skin"><span style="font-size:80px;">${getCharEmoji()}</span><span class="char-skin-badge">${skinEmoji}</span></div>`;
  } else {
    charEl.innerHTML = `<span style="font-size:80px;">${getCharEmoji()}</span>`;
  }
  document.getElementById('shop-char-name').textContent = c ? c.name : 'Sin personaje';
  document.getElementById('shop-char-skin').textContent = `Skin: ${s ? s.name : 'Predeterminado'}`;
}

function renderShop(tab) {
  renderShopHeader();
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';
  const items = tab === 'characters' ? CHARACTERS : tab === 'skins' ? SKINS : tab === 'rewards' ? PIXEL_REWARDS : ITEMS;

  items.forEach(item => {
    const owned = tab === 'characters' ? gs.ownedChars.includes(item.id) :
                  tab === 'skins' ? gs.ownedSkins.includes(item.id) :
                  tab === 'rewards' ? gs.ownedRewards.includes(item.id) :
                  (gs.ownedItems[item.id] || 0) > 0;
    const equipped = tab === 'characters' ? gs.equippedChar === item.id :
                     tab === 'skins' ? gs.equippedSkin === item.id : false;
    const canBuy = gs.coins >= item.price;

    const div = document.createElement('div');
    div.className = 'shop-item' + (equipped ? ' equipped' : owned ? ' owned' : (!canBuy && !item.starter ? ' locked' : ''));

    let badge = '';
    if (equipped) badge = '<div class="item-badge equipped-badge">Equipado</div>';
    else if (owned && tab !== 'items') badge = '<div class="item-badge">✓ Tienes</div>';
    else if (!canBuy && !item.starter) badge = '<div class="item-badge locked-badge">🔒</div>';

    const priceHTML = item.price === 0 ? `<span class="item-price">Gratis</span>` :
                      `<span class="item-price">🪙 ${item.price}</span>`;
    const remainingLabel = ['xp2','coins2'].includes(item.id)
      ? `${gs.ownedItems[item.id]||0} partidas`
      : `x${gs.ownedItems[item.id]||0}`;
    const actionHTML = equipped ? `<div style="font-size:12px;color:var(--purple-light);margin-top:6px;">Equipado</div>` :
                       owned && tab !== 'items' ? `<div style="font-size:12px;color:var(--green);margin-top:6px;cursor:pointer;">Equipar</div>` :
                       tab === 'items' ? `<div style="font-size:12px;color:var(--text2);margin-top:6px;">${remainingLabel}</div>` : '';

    const iconHTML = tab === 'rewards' ? pixelSVG(item, 52) : `<span class="item-emoji">${item.emoji}</span>`;
    div.innerHTML = `
      ${badge}
      ${iconHTML}
      <div class="item-name">${item.name}</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:6px;">${item.desc}</div>
      ${priceHTML}
      ${actionHTML}
    `;

    div.onclick = () => handleShopClick(tab, item, owned, equipped);
    grid.appendChild(div);
  });
}

function handleShopClick(tab, item, owned, equipped) {
  if (equipped) return;
  if (tab === 'rewards') {
    if (owned) { showNotification(`🏅 Ya tienes ${item.name}`, 2000); return; }
    if (gs.coins < item.price) { showNotification(`❌ ¡Necesitas ${item.price} monedas!`, 2000); return; }
    gs.coins -= item.price;
    gs.ownedRewards.push(item.id);
    updateHud();
    saveGs();
    renderShop(tab);
    showNotification(`🎉 ¡Ganaste el premio ${item.name}!`, 2500);
    return;
  }
  if (owned && tab !== 'items') {
    if (tab === 'characters') { gs.equippedChar = item.id; gs.equippedSkin = 'default'; }
    if (tab === 'skins') gs.equippedSkin = item.id;
    saveGs();
    renderShop(tab);
    showNotification(`✨ ${item.name} equipado!`, 2000);
    return;
  }
  if (!owned || tab === 'items') {
    if (item.price === 0 || item.starter) {
      if (tab === 'characters') { gs.ownedChars.push(item.id); gs.equippedChar = item.id; }
      if (tab === 'skins') { gs.ownedSkins.push(item.id); gs.equippedSkin = item.id; }
      saveGs();
      renderShop(tab);
      return;
    }
    if (gs.coins < item.price) { showNotification(`❌ ¡Necesitas ${item.price} monedas!`, 2000); return; }
    gs.coins -= item.price;
    if (tab === 'characters') { gs.ownedChars.push(item.id); gs.equippedChar = item.id; gs.equippedSkin = 'default'; }
    else if (tab === 'skins') { gs.ownedSkins.push(item.id); gs.equippedSkin = item.id; }
    else {
      const units = ['xp2','coins2','hint'].includes(item.id) ? 3 : 1;
      gs.ownedItems[item.id] = (gs.ownedItems[item.id] || 0) + units;
    }
    updateHud();
    saveGs();
    renderShop(tab);
    showNotification(`🎉 ¡Compraste ${item.name}!`, 2500);
  }
}

// ============================================================
// PROFILE
// ============================================================
function renderProfile() {
  const c = CHARACTERS.find(c => c.id === gs.equippedChar);
  const skinEmoji = getSkinEmoji();
  const profChar = document.getElementById('profile-char');
  if (skinEmoji) {
    profChar.innerHTML = `<div class="char-with-skin"><span style="font-size:80px;">${getCharEmoji()}</span><span class="char-skin-badge">${skinEmoji}</span></div>`;
  } else {
    profChar.innerHTML = `<span style="font-size:80px;">${getCharEmoji()}</span>`;
  }
  document.getElementById('profile-name').textContent = gs.name || 'Jugador';
  document.getElementById('profile-char-name').textContent = c ? c.name : 'Sin personaje';
  document.getElementById('prof-level').textContent = gs.level;
  document.getElementById('prof-coins').textContent = gs.coins;
  document.getElementById('prof-correct').textContent = gs.totalCorrect;
  document.getElementById('prof-best-streak').textContent = gs.bestStreak;

  const tablesEl = document.getElementById('tables-progress');
  tablesEl.innerHTML = '';
  [2,3,4,5,6,7,8,9,10,11,12].forEach(t => {
    const span = document.createElement('span');
    const mastery = tableMastery(t);
    const learned = mastery >= 80;
    span.style.cssText = `background:${learned ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'};
      border:1px solid ${learned ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'};
      border-radius:8px; padding:6px 12px; font-weight:700; font-size:16px;
      color:${learned ? 'var(--green)' : 'var(--text2)'};`;
    span.textContent = `×${t} · ${mastery}%`;
    span.title = `Dominio estimado de la tabla del ${t}: ${mastery}%`;
    tablesEl.appendChild(span);
  });

  document.getElementById('rewards-count').textContent = gs.ownedRewards.length;
  document.getElementById('rewards-total').textContent = PIXEL_REWARDS.length;
  const rewardsEl = document.getElementById('rewards-collection');
  rewardsEl.innerHTML = '';
  PIXEL_REWARDS.forEach(r => {
    const owned = gs.ownedRewards.includes(r.id);
    const cell = document.createElement('div');
    cell.className = 'reward-cell' + (owned ? '' : ' locked-reward');
    cell.innerHTML = `${pixelSVG(r, 44)}<div class="reward-name">${owned ? r.name : '🔒 ???'}</div>`;
    rewardsEl.appendChild(cell);
  });
}

function tableMastery(table) {
  const progress = gs.tableProgress[table] || {};
  const scores = Array.from({length:10}, (_,i) => {
    const result = progress[i+1];
    if (!result || result.attempts === 0) return 0;
    return result.correct / result.attempts;
  });
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 100);
}

function resetGame() {
  if (!confirm('¿Seguro que quieres reiniciar todo? Se perderá tu progreso.')) return;
  localStorage.removeItem('multiadv_gs');
  gs = JSON.parse(JSON.stringify(DEFAULT_STATE));
  showScreen('welcome', false);
  showHud(false);
}

// ============================================================
// NOTIFICATION
// ============================================================
let notifTimeout;
function showNotification(msg, dur=2000) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => el.classList.remove('show'), dur);
}

// ============================================================
// FLASHCARDS
// ============================================================
let fcState = {
  table: 2,
  cards: [],
  current: 0,
  flipped: false,
  known: new Set(),
  unknown: new Set(),
};

function buildFcCards(t) {
  return Array.from({length:10}, (_,i) => ({ n: i+1, ans: t*(i+1), table: t }));
}

function initFlashcards(t) {
  fcState.table = t;
  fcState.cards = buildFcCards(t);
  fcState.current = 0;
  fcState.flipped = false;
  const saved = gs.flashcardProgress[t] || {};
  fcState.known = new Set(Object.keys(saved).filter(n => saved[n] === 'known').map(Number));
  fcState.unknown = new Set(Object.keys(saved).filter(n => saved[n] === 'unknown').map(Number));
  const wrap = document.getElementById('flashcard-wrap');
  if (wrap) wrap.classList.remove('flipped');
  renderFcCard();
  renderFcDots();
  renderFcStats();
}

function renderFcCard() {
  const c = fcState.cards[fcState.current];
  if (!c) return;
  document.getElementById('fc-question').textContent = `${c.table} × ${c.n}`;
  document.getElementById('fc-answer').textContent = c.ans;
  document.getElementById('fc-label').textContent = `${c.table} × ${c.n} = ${c.ans}`;
  document.getElementById('fc-counter').textContent = `${fcState.current+1} / ${fcState.cards.length}`;
  fcState.flipped = false;
  document.getElementById('flashcard-wrap').classList.remove('flipped');
}

function renderFcDots() {
  const container = document.getElementById('fc-dots');
  if (!container) return;
  container.innerHTML = '';
  fcState.cards.forEach((c, i) => {
    const dot = document.createElement('div');
    dot.className = 'fc-dot' + (fcState.known.has(c.n) ? ' known' : '') + (i === fcState.current ? ' active' : '');
    dot.onclick = (e) => { e.stopPropagation(); fcState.current = i; renderFcCard(); renderFcDots(); };
    container.appendChild(dot);
  });
}

function renderFcStats() {
  const kEl = document.getElementById('fc-known-count');
  const uEl = document.getElementById('fc-unknown-count');
  const pEl = document.getElementById('fc-pending-count');
  if (!kEl) return;
  kEl.textContent = fcState.known.size;
  uEl.textContent = fcState.unknown.size;
  pEl.textContent = fcState.cards.length - fcState.known.size - fcState.unknown.size;
}

function flipCard() {
  fcState.flipped = !fcState.flipped;
  document.getElementById('flashcard-wrap').classList.toggle('flipped', fcState.flipped);
}

function fcNext() {
  fcState.current = (fcState.current + 1) % fcState.cards.length;
  renderFcCard();
  renderFcDots();
}

function fcPrev() {
  fcState.current = (fcState.current - 1 + fcState.cards.length) % fcState.cards.length;
  renderFcCard();
  renderFcDots();
}

function fcMark(know) {
  const factor = fcState.cards[fcState.current].n;
  if (know) { fcState.known.add(factor); fcState.unknown.delete(factor); }
  else { fcState.unknown.add(factor); fcState.known.delete(factor); }
  saveFlashcardProgress();
  renderFcDots();
  renderFcStats();
  if (know && fcState.known.size === fcState.cards.length) {
    showNotification(`🎉 ¡Dominaste la tabla del ${fcState.table}!`, 3000);
  }
  setTimeout(fcNext, 300);
}

function fcShuffle() {
  fcState.cards = shuffle(fcState.cards);
  fcState.current = 0;
  renderFcCard();
  renderFcDots();
  renderFcStats();
}

function fcReset() {
  fcState.known = new Set();
  fcState.unknown = new Set();
  delete gs.flashcardProgress[fcState.table];
  saveGs();
  renderFcDots();
  renderFcStats();
}

function saveFlashcardProgress() {
  const saved = {};
  fcState.known.forEach(n => saved[n] = 'known');
  fcState.unknown.forEach(n => saved[n] = 'unknown');
  gs.flashcardProgress[fcState.table] = saved;
  saveGs();
}

function renderFcTableSelector() {
  const container = document.getElementById('fc-table-selector');
  if (!container) return;
  container.innerHTML = '';
  [2,3,4,5,6,7,8,9,10,11,12].forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'fc-table-btn' + (t === fcState.table ? ' selected' : '');
    btn.textContent = `×${t}`;
    btn.onclick = () => {
      document.querySelectorAll('.fc-table-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      initFlashcards(t);
    };
    container.appendChild(btn);
  });
}

// ============================================================
// BOOT
// ============================================================
validateGameContent();
loadGs();
updateHud();

// Give starter character if not present
if (!gs.ownedChars.includes('cat')) gs.ownedChars.push('cat');
if (!gs.equippedChar) gs.equippedChar = 'cat';
saveGs();
