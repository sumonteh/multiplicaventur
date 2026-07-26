// ============================================================
// GAME STATE
// ============================================================
const DEFAULT_STATE = {
  version: 2,
  name: '',
  coins: 0,
  xp: 0,
  level: 1,
  totalCorrect: 0,
  bestStreak: 0,
  ownedChars: ['cat'],
  equippedChar: 'cat',
  ownedSkins: ['default'],
  equippedSkin: 'default',
  ownedItems: {},
  ownedRewards: [],
  worldStars: {},
  lastDaily: null,
  dailyStreak: 0,
  totalGames: 0,
  tableProgress: {},
  flashcardProgress: {},
};

let gs = JSON.parse(JSON.stringify(DEFAULT_STATE));

function saveGs() { localStorage.setItem('multiadv_gs', JSON.stringify(gs)); }

function migrateState(saved) {
  const previousVersion = Number(saved.version || 1);
  const migrated = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved);
  migrated.ownedItems = saved.ownedItems && typeof saved.ownedItems === 'object' ? saved.ownedItems : {};

  if (previousVersion < 2) {
    ['xp2', 'coins2'].forEach(id => {
      if (migrated.ownedItems[id] > 0) migrated.ownedItems[id] *= 3;
    });
  }

  migrated.tableProgress = saved.tableProgress && typeof saved.tableProgress === 'object' ? saved.tableProgress : {};
  migrated.flashcardProgress = saved.flashcardProgress && typeof saved.flashcardProgress === 'object'
    ? saved.flashcardProgress
    : {};
  migrated.ownedChars = Array.isArray(saved.ownedChars) ? saved.ownedChars : ['cat'];
  migrated.ownedSkins = Array.isArray(saved.ownedSkins) ? saved.ownedSkins : ['default'];
  migrated.ownedRewards = Array.isArray(saved.ownedRewards) ? saved.ownedRewards : [];
  migrated.version = DEFAULT_STATE.version;
  return migrated;
}

function loadGs() {
  const s = localStorage.getItem('multiadv_gs');
  if (!s) {
    gs = JSON.parse(JSON.stringify(DEFAULT_STATE));
    return;
  }
  try {
    gs = migrateState(JSON.parse(s));
  } catch (error) {
    console.warn('No se pudo leer el progreso guardado; se restauró un estado seguro.', error);
    gs = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

// ============================================================
// CURRENT GAME SESSION
// ============================================================
let session = {
  mode: 'classic',
  tables: [2,3],
  worldId: 'w1',
  questions: [],
  current: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  maxStreak: 0,
  lives: 3,
  maxLives: 3,
  timerInterval: null,
  nextTimeout: null,
  timeLeft: 15,
  answered: false,
  typed: '',
  inProgress: false,
  finished: false,
  results: [],
  shieldAvailable: false,
  magnetActive: false,
};

function xpForLevel(lvl) { return lvl * 100; }

function addCoins(n) {
  if (gs.ownedItems['coins2'] > 0) n *= 2;
  gs.coins += n;
  updateHud();
  saveGs();
  return n;
}

function addXP(n) {
  if (gs.ownedItems['xp2'] > 0) n *= 2;
  gs.xp += n;
  while (gs.xp >= xpForLevel(gs.level)) {
    gs.xp -= xpForLevel(gs.level);
    gs.level++;
    showNotification(`🎉 ¡Subiste al nivel ${gs.level}!`, 3000);
  }
  updateHud();
  saveGs();
}

function consumeItem(id, amount=1) {
  gs.ownedItems[id] = Math.max(0, (gs.ownedItems[id] || 0) - amount);
}

function finishBoosterUse() {
  if (gs.ownedItems.coins2 > 0) consumeItem('coins2');
  if (gs.ownedItems.xp2 > 0) consumeItem('xp2');
  if (session.magnetActive) consumeItem('magnet');
}
