// ============================================================
// DATA
// ============================================================
const CHARACTERS = [
  { id:'cat',    emoji:'🐱', name:'Gatito Ninja',   price:0,    desc:'Tu compañero inicial', starter:true },
  { id:'fox',    emoji:'🦊', name:'Zorro Veloz',    price:80,   desc:'Ágil como el viento' },
  { id:'dragon', emoji:'🐉', name:'Dragón Sabio',   price:150,  desc:'Domina las tablas' },
  { id:'wolf',   emoji:'🐺', name:'Lobo Guerrero',  price:200,  desc:'Nunca se rinde' },
  { id:'lion',   emoji:'🦁', name:'León Rey',       price:300,  desc:'El más poderoso' },
  { id:'robot',  emoji:'🤖', name:'Robot Matemático', price:400, desc:'Calculadora viviente' },
  { id:'wizard', emoji:'🧙', name:'Mago de Números', price:500, desc:'Maestro del álgebra' },
  { id:'dino',   emoji:'🦕', name:'Dino Genial',    price:350,  desc:'Antiguo y sabio' },
];

const SKINS = [
  { id:'default', name:'Normal', emoji:'✨', price:0, charId:'any', desc:'Predeterminado' },
  { id:'fire',    name:'Fuego',  emoji:'🔥', price:60,  charId:'any', desc:'¡Ardiente!' },
  { id:'ice',     name:'Hielo',  emoji:'❄️', price:60,  charId:'any', desc:'Frío y genial' },
  { id:'gold',    name:'Dorado', emoji:'⭐', price:100, charId:'any', desc:'Brilla con todo' },
  { id:'rainbow', name:'Arcoíris',emoji:'🌈',price:120, charId:'any', desc:'Colorido y único' },
  { id:'dark',    name:'Oscuro', emoji:'🌑', price:80,  charId:'any', desc:'Misterioso' },
  { id:'magic',   name:'Mágico', emoji:'💫', price:150, charId:'any', desc:'Brilla con magia' },
  { id:'cosmic',  name:'Cósmico',emoji:'🌌', price:200, charId:'any', desc:'Del espacio exterior' },
];

const ITEMS = [
  { id:'xp2',     name:'XP x2',       emoji:'📚', price:80,  desc:'Doble XP por 3 partidas', effect:'xp' },
  { id:'coins2',  name:'Monedas x2',  emoji:'💰', price:100, desc:'Doble monedas por 3 partidas', effect:'coins' },
  { id:'life',    name:'Vida Extra',  emoji:'❤️', price:50,  desc:'1 vida extra en la próxima supervivencia', effect:'life' },
  { id:'hint',    name:'Pista x3',    emoji:'💡', price:60,  desc:'3 pistas para respuestas difíciles', effect:'hint' },
  { id:'shield',  name:'Escudo',      emoji:'🛡️', price:70,  desc:'Protege tu racha una vez', effect:'shield' },
  { id:'magnet',  name:'Imán',        emoji:'🧲', price:90,  desc:'+25% monedas en la próxima partida', effect:'magnet' },
];

// Premios coleccionables en pixel art. Cada grid es una matriz de caracteres
// que se mapean a colores; '.' es transparente.
const PIXEL_REWARDS = [
  { id:'trophy', name:'Copa Dorada', desc:'Para campeones de las tablas', price:120,
    colors:{ G:'#FFD700', W:'#FFF6B0', D:'#B8860B' },
    grid:[
      '............',
      '.G........G.',
      '.GGGGGGGGGG.',
      '.G.GWWGGG.G.',
      '.G.GWGGGG.G.',
      '.GG.GGGG.GG.',
      '....GGGG....',
      '.....GG.....',
      '.....GG.....',
      '....GGGG....',
      '..DDDDDDDD..',
      '............',
    ]},
  { id:'gem', name:'Gema Púrpura', desc:'Brilla con sabiduría', price:100,
    colors:{ L:'#A855F7', P:'#7C3AED', W:'#E9D5FF' },
    grid:[
      '............',
      '...LLLLLL...',
      '..LWLLLLPL..',
      '.LWWLLLLLPP.',
      '.LLLLLLLLPP.',
      '.LLLLLLLLPP.',
      '..LLLLLLPP..',
      '...LLLLPP...',
      '....LLPP....',
      '.....LP.....',
      '............',
      '............',
    ]},
  { id:'crown', name:'Corona Real', desc:'Del rey de las multiplicaciones', price:200,
    colors:{ G:'#FFD700', R:'#EF4444', B:'#3B82F6' },
    grid:[
      '............',
      '............',
      '.G...GG...G.',
      '.GG..GG..GG.',
      '.GGG.GG.GGG.',
      '.GGGGGGGGGG.',
      '.GGGGGGGGGG.',
      '.GRGGBBGGRG.',
      '.GGGGGGGGGG.',
      '............',
      '............',
      '............',
    ]},
  { id:'star', name:'Estrella Fugaz', desc:'Pide un deseo matemático', price:80,
    colors:{ Y:'#FDE047', O:'#F97316' },
    grid:[
      '............',
      '.....YY.....',
      '.....YY.....',
      '....YYYY....',
      '.YYYYYYYYYY.',
      '..YYYYYYYY..',
      '...YYYYYY...',
      '...YYYYYY...',
      '..YYY..YYY..',
      '..YO....OY..',
      '.O........O.',
      '............',
    ]},
  { id:'medal', name:'Medalla Campeón', desc:'Primer lugar asegurado', price:90,
    colors:{ R:'#EF4444', G:'#FFD700', W:'#FFF6B0' },
    grid:[
      '............',
      '..RR....RR..',
      '..RRR..RRR..',
      '...RRRRRR...',
      '....RRRR....',
      '....GGGG....',
      '...GGGGGG...',
      '..GGGWGGGG..',
      '..GGWGGGGG..',
      '...GGGGGG...',
      '....GGGG....',
      '............',
    ]},
  { id:'chest', name:'Cofre del Tesoro', desc:'Lleno de conocimiento', price:150,
    colors:{ B:'#A0622D', D:'#6B3E1A', G:'#FFD700' },
    grid:[
      '............',
      '............',
      '..BBBBBBBB..',
      '.BDDDDDDDDB.',
      '.BBBBBBBBBB.',
      '.DDDDGGDDDD.',
      '.BBBBGGBBBB.',
      '.BBBBBBBBBB.',
      '.BDDDDDDDDB.',
      '.BBBBBBBBBB.',
      '............',
      '............',
    ]},
  { id:'rocket', name:'Cohete Espacial', desc:'A la velocidad del cálculo', price:180,
    colors:{ R:'#EF4444', S:'#CBD5E1', W:'#3B82F6', F:'#F97316', Y:'#FDE047' },
    grid:[
      '............',
      '.....RR.....',
      '....RRRR....',
      '....SSSS....',
      '....SWWS....',
      '....SWWS....',
      '....SSSS....',
      '...RSSSSR...',
      '..RRSSSSRR..',
      '..R.FFFF.R..',
      '.....FF.....',
      '.....YY.....',
    ]},
  { id:'heart', name:'Corazón Mágico', desc:'Amor por los números', price:70,
    colors:{ R:'#EF4444', P:'#FCA5A5' },
    grid:[
      '............',
      '..RR....RR..',
      '.RPRR..RRRR.',
      '.RPPRRRRRRR.',
      '.RPRRRRRRRR.',
      '.RRRRRRRRRR.',
      '..RRRRRRRR..',
      '...RRRRRR...',
      '....RRRR....',
      '.....RR.....',
      '............',
      '............',
    ]},
];

function pixelSVG(reward, size=56) {
  const rows = reward.grid;
  const h = rows.length, w = rows[0].length;
  let rects = '';
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = reward.colors[ch];
      if (c) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`;
    });
  });
  return `<span class="pixel-art"><svg viewBox="0 0 ${w} ${h}" width="${size}" height="${size}" shape-rendering="crispEdges">${rects}</svg></span>`;
}

const WORLDS = [
  { id:'w1', title:'Tierra del 2 y el 3', icon:'🌱', tables:[2,3], minLevel:1, difficulty:'inicial' },
  { id:'w2', title:'Valle del 4 y el 5',  icon:'🌊', tables:[4,5], minLevel:2, difficulty:'básica' },
  { id:'w3', title:'Bosque del 6 y el 7', icon:'🌲', tables:[6,7], minLevel:3, difficulty:'intermedia' },
  { id:'w4', title:'Montaña del 8 y el 9',icon:'⛰️', tables:[8,9], minLevel:5, difficulty:'avanzada' },
  { id:'w5', title:'Mundo del 10, 11 y 12',icon:'🌟',tables:[10,11,12], minLevel:7, difficulty:'maestra' },
];

const GAME_MODES = {
  classic:   { questionCount:10, factorStart:1, factorEnd:10, baseCoins:10, timedSeconds:0 },
  speed:     { questionCount:10, factorStart:1, factorEnd:10, baseCoins:15, timedSeconds:15 },
  survival:  { questionCount:10, factorStart:1, factorEnd:10, baseCoins:20, timedSeconds:0, startingLives:3 },
  challenge: { questionCount:20, factorStart:3, factorEnd:12, baseCoins:25, timedSeconds:0 },
  typing:    { questionCount:10, factorStart:1, factorEnd:10, baseCoins:20, timedSeconds:0, typedAnswer:true },
};

function getWorldConfig(worldId) {
  return WORLDS.find(world => world.id === worldId);
}

function getModeConfig(modeId) {
  return GAME_MODES[modeId];
}

function validateGameContent() {
  const worldIds = new Set();
  WORLDS.forEach(world => {
    if (!world.id || worldIds.has(world.id)) throw new Error(`Mundo inválido o duplicado: ${world.id}`);
    if (!world.title || !world.icon || !Array.isArray(world.tables) || world.tables.length === 0) {
      throw new Error(`Configuración incompleta para el mundo ${world.id}`);
    }
    if (!world.tables.every(table => Number.isInteger(table) && table >= 1 && table <= 20)) {
      throw new Error(`El mundo ${world.id} contiene tablas inválidas`);
    }
    worldIds.add(world.id);
  });

  Object.entries(GAME_MODES).forEach(([id, mode]) => {
    if (!Number.isInteger(mode.questionCount) || mode.questionCount <= 0) {
      throw new Error(`Cantidad de preguntas inválida para el modo ${id}`);
    }
    if (mode.factorStart > mode.factorEnd) throw new Error(`Rango de factores inválido para el modo ${id}`);
  });
}
