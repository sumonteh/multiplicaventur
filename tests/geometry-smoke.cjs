const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(root, 'docs', 'screenshots');
const checks = [];
const failures = [];
const pageErrors = [];
const check = (name, condition, details='') => {
  const result = {name, ok:Boolean(condition), details};
  checks.push(result);
  if (!result.ok) failures.push(`${name}${details ? `: ${details}` : ''}`);
};

function startServer() {
  const server = http.createServer((request,response) => {
    const relative = decodeURIComponent((request.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root,relative);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file)) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
    response.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve,reject) => {
    server.once('error',reject);
    server.listen(0,'127.0.0.1',() => resolve({server,url:`http://127.0.0.1:${server.address().port}`}));
  });
}

async function run() {
  fs.mkdirSync(screenshots,{recursive:true});
  const {server,url} = await startServer();
  const launchOptions = {headless:true};
  if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({viewport:{width:1280,height:850}});
  page.setDefaultTimeout(5000);
  page.on('pageerror',error => pageErrors.push(String(error)));
  try {
    await page.goto(url,{waitUntil:'networkidle'});
    const math = await page.evaluate(() => {
      validateGeometryContent();
      const center = {x:2,y:-1};
      const original = [{x:3,y:-1},{x:3,y:1},{x:1,y:1}];
      const r90cw = rotatePoint({x:3,y:-1},center,90,'clockwise');
      const r90ccw = rotatePoint({x:3,y:-1},center,90,'counterclockwise');
      const r180 = rotatePoint({x:3,y:-1},center,180,'clockwise');
      const r270 = rotatePoint({x:3,y:-1},center,270,'clockwise');
      const r360 = rotatePoint({x:3,y:-1},center,360,'clockwise');
      const rotated = rotateShape(original,center,270,'counterclockwise');
      return {
        world:getLearningWorld('geometry-rotations'),
        counts:[ROTATION_DEMOS.length,ROTATION_CHOICE_EXERCISES.length,ROTATION_BUILD_EXERCISES.length],
        unique:new Set(GEOMETRY_EXERCISES.map(item=>item.id)).size,
        r90cw,r90ccw,r180,r270,r360,
        distance:preservesRotationDistances(original,rotated,center),
        shapeLength:rotated.length,
        alternatives:generateRotationAlternatives(ROTATION_CHOICE_EXERCISES[0]),
      };
    });
    check('Mundo de Geometría registrado', math.world?.type === 'geometry');
    check('Catálogo completo 3/6/4', JSON.stringify(math.counts) === '[3,6,4]', JSON.stringify(math.counts));
    check('Identificadores únicos', math.unique === 13, String(math.unique));
    check('Rotación 90° horaria', math.r90cw.x === 2 && math.r90cw.y === -2, JSON.stringify(math.r90cw));
    check('Rotación 90° antihoraria', math.r90ccw.x === 2 && math.r90ccw.y === 0, JSON.stringify(math.r90ccw));
    check('Rotación 180°', math.r180.x === 1 && math.r180.y === -1, JSON.stringify(math.r180));
    check('Rotación 270°', math.r270.x === 2 && math.r270.y === 0, JSON.stringify(math.r270));
    check('Rotación 360°', math.r360.x === 3 && math.r360.y === -1, JSON.stringify(math.r360));
    check('Conservación de distancias', math.distance);
    check('Rotación de figura completa', math.shapeLength === 3);
    check('Alternativas incluyen una solución', math.alternatives.length === 3 && math.alternatives.filter(a=>a.correct).length === 1);

    await page.evaluate(() => {
      localStorage.clear();
      gs = migrateState({version:2,name:'Javi',coins:12,tableProgress:{2:{attempts:4,correct:3}}});
      saveGs();
      showScreen('map');
    });
    const migration = await page.evaluate(() => ({
      version:gs.version, coins:gs.coins, old:gs.tableProgress[2].correct,
      geometry:Boolean(gs.geometryProgress?.completed?.choose),
    }));
    check('Migración conserva partidas', migration.version === 3 && migration.coins === 12 && migration.old === 3 && migration.geometry, JSON.stringify(migration));

    const geometryNode = page.locator('.world-node',{hasText:'Geometría Aventura'});
    check('Entrada visible en el mapa', await geometryNode.count() === 1);
    await geometryNode.click();
    check('Selector ofrece cuatro modalidades', await page.locator('.geometry-mode-card').count() === 4);
    await page.locator('.geometry-mode-card',{hasText:'Aprende'}).click();
    check('Aprende muestra SVG y controles', await page.locator('#screen-geometry-activity.active .geometry-board').count() === 1);
    await page.getByRole('button',{name:/Ver giro/}).click();
    await page.waitForTimeout(1050);
    const learned = await page.evaluate(() => gs.geometryProgress.completed.learn.includes('learn-90-clockwise'));
    check('Aprende persiste la demostración', learned);
    await page.screenshot({path:path.join(screenshots,'geometry-desktop.png'),fullPage:true});

    await page.setViewportSize({width:375,height:667});
    await page.evaluate(() => { openGeometryWorld(); startGeometryMode('build'); });
    const mobile = await page.evaluate(() => ({
      width:document.documentElement.scrollWidth,
      svgWidth:document.querySelector('.geometry-board').getBoundingClientRect().width,
      active:document.getElementById('screen-geometry-activity').classList.contains('active'),
    }));
    check('Construye funciona en vista móvil', mobile.active && mobile.width <= 375 && mobile.svgWidth <= 351, JSON.stringify(mobile));
    await page.screenshot({path:path.join(screenshots,'geometry-mobile.png'),fullPage:true});
    check('Sin errores de consola', pageErrors.length === 0, pageErrors.join('\n'));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const report = {total:checks.length,passed:checks.filter(item=>item.ok).length,checks,failures};
  console.log(JSON.stringify(report,null,2));
  if (failures.length) process.exitCode = 1;
}
run().catch(error => { console.error(error); process.exitCode = 1; });
