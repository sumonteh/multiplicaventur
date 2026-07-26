// ============================================================
// GEOMETRY ADVENTURE — SVG VIEW AND ACTIVITY CONTROLLER
// ============================================================
const GEO_VIEW = { size:480, min:-8, max:8, cell:30 };
const geometrySession = {
  mode:'learn', index:0, attempts:0, selected:[], animation:null,
  keyboardCursor:{x:0,y:0}, keyboardActive:false,
  lab:{ figure:'triangle', center:{x:0,y:0}, offset:{x:2,y:1}, angle:90,
    direction:'clockwise', grid:true, ghost:true, radii:true, paths:true, drag:null },
};

function modelToScreen(point) {
  return {x:GEO_VIEW.size / 2 + point.x * GEO_VIEW.cell, y:GEO_VIEW.size / 2 - point.y * GEO_VIEW.cell};
}

function screenToModel(svg, event) {
  const rect = svg.getBoundingClientRect();
  const x = (event.clientX - rect.left) * GEO_VIEW.size / rect.width;
  const y = (event.clientY - rect.top) * GEO_VIEW.size / rect.height;
  return {
    x:Math.max(GEO_VIEW.min, Math.min(GEO_VIEW.max, Math.round((x - GEO_VIEW.size / 2) / GEO_VIEW.cell))),
    y:Math.max(GEO_VIEW.min, Math.min(GEO_VIEW.max, Math.round((GEO_VIEW.size / 2 - y) / GEO_VIEW.cell))),
  };
}

function pointsAttr(points) {
  return points.map(point => {
    const screen = modelToScreen(point);
    return `${screen.x},${screen.y}`;
  }).join(' ');
}

function svgGrid(show=true) {
  if (!show) return '';
  let lines = '';
  for (let n=GEO_VIEW.min; n<=GEO_VIEW.max; n++) {
    const p = GEO_VIEW.size / 2 + n * GEO_VIEW.cell;
    const major = n === 0 ? ' geo-axis' : '';
    lines += `<line class="geo-grid${major}" x1="${p}" y1="0" x2="${p}" y2="480"/>`;
    lines += `<line class="geo-grid${major}" x1="0" y1="${p}" x2="480" y2="${p}"/>`;
  }
  return lines;
}

function svgPoint(point, label, className='geo-vertex') {
  const p = modelToScreen(point);
  return `<circle class="${className}" cx="${p.x}" cy="${p.y}" r="7"/>
    <text class="geo-label" x="${p.x + 9}" y="${p.y - 9}">${label}</text>`;
}

function rotationBoard({vertices, center, transformed=null, userPoints=[], ghost=true,
  radii=false, paths=false, grid=true, interactive=false, keyboardCursor=null,
  ariaLabel='Plano de rotación'}) {
  const finalPoints = transformed || [];
  const centerScreen = modelToScreen(center);
  const pathMarkup = paths && finalPoints.length ? vertices.map((point, index) => {
    const path = rotationPath(point, center, geometrySession.currentAngle || 90,
      geometrySession.currentDirection || 'clockwise', 24);
    return `<polyline class="geo-path" points="${pointsAttr(path)}"/>`;
  }).join('') : '';
  const radiusMarkup = radii ? vertices.map((point, index) => {
    const a = modelToScreen(point);
    const b = finalPoints[index] ? modelToScreen(finalPoints[index]) : centerScreen;
    return `<line class="geo-radius" x1="${centerScreen.x}" y1="${centerScreen.y}" x2="${a.x}" y2="${a.y}"/>
      ${finalPoints[index] ? `<line class="geo-radius final" x1="${centerScreen.x}" y1="${centerScreen.y}" x2="${b.x}" y2="${b.y}"/>` : ''}`;
  }).join('') : '';
  return `<svg class="geometry-board${interactive ? ' interactive' : ''}" viewBox="0 0 480 480"
      role="${interactive ? 'application' : 'img'}" aria-label="${ariaLabel}"
      ${interactive ? 'data-geometry-interactive="true" tabindex="0"' : ''}>
    <rect class="geo-bg" width="480" height="480"/>${svgGrid(grid)}${pathMarkup}${radiusMarkup}
    ${ghost ? `<polygon class="geo-shape ghost" points="${pointsAttr(vertices)}"/>` : ''}
    <polygon class="geo-shape initial" points="${pointsAttr(vertices)}"/>
    ${finalPoints.length ? `<polygon class="geo-shape final" points="${pointsAttr(finalPoints)}"/>` : ''}
    ${userPoints.length > 1 ? `<polyline class="geo-shape user" points="${pointsAttr(userPoints)}"/>` : ''}
    ${vertices.map((p,i) => svgPoint(p, String.fromCharCode(65+i))).join('')}
    ${finalPoints.map((p,i) => svgPoint(p, `${String.fromCharCode(65+i)}′`, 'geo-vertex final')).join('')}
    ${userPoints.map((p,i) => svgPoint(p, `${i+1}`, 'geo-vertex user')).join('')}
    ${keyboardCursor ? svgPoint(keyboardCursor, 'Cursor', 'geo-keyboard-cursor') : ''}
    <circle class="geo-center-ring" cx="${centerScreen.x}" cy="${centerScreen.y}" r="11"/>
    <line class="geo-center" x1="${centerScreen.x-13}" y1="${centerScreen.y}" x2="${centerScreen.x+13}" y2="${centerScreen.y}"/>
    <line class="geo-center" x1="${centerScreen.x}" y1="${centerScreen.y-13}" x2="${centerScreen.x}" y2="${centerScreen.y+13}"/>
    <text class="geo-label center" x="${centerScreen.x+14}" y="${centerScreen.y-14}">O</text>
  </svg>`;
}

function openGeometryWorld() {
  stopGeometryActivity();
  renderGeometryModes();
  showScreen('geometry-modes');
}

function renderGeometryModes() {
  const progress = gs.geometryProgress;
  document.getElementById('geometry-stars').textContent = '⭐'.repeat(progress.stars) + '☆'.repeat(3-progress.stars);
  const completed = progress.completed;
  document.getElementById('geometry-mode-grid').innerHTML = Object.entries(GEOMETRY_MODES).map(([modeId,mode]) => {
    const total = modeId === 'learn' ? 3 : modeId === 'choose' ? 6 : modeId === 'build' ? 4 : 0;
    const count = completed[modeId]?.length || 0;
    const color = {learn:'purple',choose:'orange',build:'cyan',lab:'green'}[modeId];
    return `<button class="geometry-mode-card ${color}" onclick="startGeometryMode('${modeId}')">
      <span class="geometry-mode-icon">${mode.icon}</span>
      <span class="geometry-mode-title">${mode.title}</span>
      <span class="geometry-mode-description">${mode.description}</span>
      <span class="geometry-mode-progress">${total ? `${count}/${total} completadas` : 'Exploración libre'}</span>
    </button>`;
  }).join('');
}

function startGeometryMode(mode) {
  geometrySession.mode = mode;
  geometrySession.index = 0;
  geometrySession.attempts = 0;
  geometrySession.selected = [];
  geometrySession.keyboardCursor = {x:0,y:0};
  geometrySession.keyboardActive = false;
  gs.geometryProgress.currentMode = mode;
  saveGs();
  showScreen('geometry-activity');
  renderGeometryActivity();
}

function geometryActivities() {
  if (geometrySession.mode === 'learn') return ROTATION_DEMOS;
  if (geometrySession.mode === 'choose') return ROTATION_CHOICE_EXERCISES;
  if (geometrySession.mode === 'build') return ROTATION_BUILD_EXERCISES;
  return [];
}

function setGeometryFeedback(message='', type='') {
  const element = document.getElementById('geometry-feedback');
  element.className = `geometry-feedback ${type}`;
  element.textContent = message;
}

function selectMarkup(label, id, values, selected, handler='updateGeometryControl()') {
  return `<label>${label}<select id="${id}" onchange="${handler}">
    ${values.map(value => `<option value="${value.value}" ${String(value.value) === String(selected) ? 'selected' : ''}>${value.label}</option>`).join('')}
  </select></label>`;
}

function renderGeometryActivity() {
  stopGeometryActivity();
  const mode = GEOMETRY_MODES[geometrySession.mode];
  document.getElementById('geometry-mode-kicker').textContent = `Geometría Aventura · ${mode.title}`;
  document.getElementById('geometry-activity-title').textContent = `${mode.icon} ${mode.title}`;
  document.getElementById('geometry-options').innerHTML = '';
  setGeometryFeedback();
  if (geometrySession.mode === 'lab') {
    renderGeometryLab();
    return;
  }
  const activities = geometryActivities();
  const exercise = activities[geometrySession.index];
  geometrySession.currentAngle = exercise.angle;
  geometrySession.currentDirection = exercise.direction;
  document.getElementById('geometry-step').textContent = `${geometrySession.index+1}/${activities.length}`;
  document.getElementById('geometry-instruction').textContent =
    geometrySession.mode === 'learn' ? exercise.message :
    `Gira la figura ${exercise.angle}° en sentido ${exercise.direction === 'clockwise' ? 'horario' : 'antihorario'} alrededor de O.`;
  document.getElementById('geometry-controls').innerHTML = `<span class="geometry-rule">Centro O: (${exercise.center.x}, ${exercise.center.y})</span>
    <span class="geometry-rule">Ángulo: ${exercise.angle}°</span>
    <span class="geometry-rule">Sentido: ${exercise.direction === 'clockwise' ? '↻ horario' : '↺ antihorario'}</span>`;
  if (geometrySession.mode === 'learn') {
    document.getElementById('geometry-controls').innerHTML =
      `<span class="geometry-rule">Centro O: (${exercise.center.x}, ${exercise.center.y})</span>` +
      selectMarkup('Ángulo','geo-learn-angle',[90,180,270,360].map(n=>({value:n,label:`${n}°`})),exercise.angle,'updateLearnControls()') +
      selectMarkup('Sentido','geo-learn-direction',
        [{value:'clockwise',label:'↻ Horario'},{value:'counterclockwise',label:'↺ Antihorario'}],exercise.direction,'updateLearnControls()');
    renderLearn(exercise);
  }
  if (geometrySession.mode === 'choose') renderChoose(exercise);
  if (geometrySession.mode === 'build') renderBuild(exercise);
}

function renderLearn(exercise, transformed=null) {
  document.getElementById('geometry-board-wrap').innerHTML = rotationBoard({
    vertices:exercise.vertices, center:exercise.center, transformed,
    ghost:true, radii:true, paths:Boolean(transformed),
  });
  document.getElementById('geometry-actions').innerHTML =
    `<button class="btn-secondary" onclick="renderGeometryActivity()">↺ Reiniciar</button>
     <button class="btn-primary" onclick="animateGeometryExercise()">▶ Ver giro</button>
     <button class="btn-secondary" onclick="nextGeometryActivity()">Siguiente →</button>`;
}

function updateLearnControls() {
  geometrySession.currentAngle = Number(document.getElementById('geo-learn-angle').value);
  geometrySession.currentDirection = document.getElementById('geo-learn-direction').value;
  document.getElementById('geometry-instruction').textContent =
    learnRotationMessage(geometrySession.currentAngle, geometrySession.currentDirection);
  renderLearn(ROTATION_DEMOS[geometrySession.index]);
  setGeometryFeedback('Puedes probar cada giro en ambos sentidos.', '');
}

function learnRotationMessage(angle, direction) {
  const turnName = {90:'Un cuarto de giro',180:'Un medio giro',270:'Tres cuartos de giro',360:'Un giro completo'}[angle];
  const directionText = direction === 'clockwise'
    ? 'horario, como las manecillas del reloj'
    : 'antihorario, hacia el lado contrario';
  return `${turnName} son ${angle}°. Observa el movimiento en sentido ${directionText}.`;
}

function animateGeometryExercise() {
  const exercise = geometryActivities()[geometrySession.index];
  const angle = Number(document.getElementById('geo-learn-angle')?.value || geometrySession.currentAngle || exercise.angle);
  const direction = document.getElementById('geo-learn-direction')?.value || geometrySession.currentDirection || exercise.direction;
  const start = performance.now();
  geometrySession.currentAngle = angle;
  geometrySession.currentDirection = direction;
  const tick = now => {
    const progress = Math.min(1, (now-start)/900);
    const transformed = rotateShape(exercise.vertices, exercise.center, angle*progress, direction);
    renderLearn(exercise, transformed);
    if (progress < 1) geometrySession.animation = requestAnimationFrame(tick);
    else {
      recordGeometryCompletion('learn', exercise.id, 0);
      setGeometryFeedback('Observa: cada vértice conserva su distancia al centro O.', 'success');
      geometrySession.animation = null;
    }
  };
  geometrySession.animation = requestAnimationFrame(tick);
}

function renderChoose(exercise) {
  document.getElementById('geometry-board-wrap').innerHTML = rotationBoard({
    vertices:exercise.vertices, center:exercise.center, ghost:true,
  });
  const options = generateRotationAlternatives(exercise);
  document.getElementById('geometry-options').innerHTML = options.map((option, index) =>
    `<button class="geometry-option" data-correct="${option.correct}" data-feedback="${option.feedback.replaceAll('"','&quot;')}"
      onclick="checkGeometryChoice(this, '${option.id}')">
      <span>Opción ${index+1}</span>
      ${rotationBoard({vertices:exercise.vertices,center:exercise.center,transformed:option.points,ghost:false,grid:true,ariaLabel:`Opción ${index+1}`})}
    </button>`).join('');
  document.getElementById('geometry-actions').innerHTML = '';
}

function checkGeometryChoice(button) {
  geometrySession.attempts++;
  const correct = button.dataset.correct === 'true';
  button.classList.add(correct ? 'correct' : 'wrong');
  if (!correct) {
    setGeometryFeedback(button.dataset.feedback, 'error');
    return;
  }
  document.querySelectorAll('.geometry-option').forEach(option => option.disabled = true);
  const exercise = ROTATION_CHOICE_EXERCISES[geometrySession.index];
  recordGeometryCompletion('choose', exercise.id, exercise.reward);
  setGeometryFeedback(button.dataset.feedback, 'success');
  document.getElementById('geometry-actions').innerHTML =
    `<button class="btn-primary" onclick="nextGeometryActivity()">Siguiente →</button>`;
}

function renderBuild(exercise) {
  document.getElementById('geometry-board-wrap').innerHTML = rotationBoard({
    vertices:exercise.vertices, center:exercise.center, userPoints:geometrySession.selected,
    ghost:true, radii:exercise.helps.radii, interactive:true,
    keyboardCursor:geometrySession.keyboardActive ? geometrySession.keyboardCursor : null,
    ariaLabel:'Plano interactivo. Toca la cuadrícula o usa las flechas y Enter para ubicar los vértices.',
  });
  const svg = document.querySelector('[data-geometry-interactive]');
  const addSelectedPoint = point => {
    if (geometrySession.selected.length >= exercise.vertices.length) return;
    geometrySession.selected.push(point);
    renderBuild(exercise);
  };
  svg.addEventListener('pointerdown', event => {
    addSelectedPoint(screenToModel(svg, event));
  });
  svg.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
      ArrowUp:{x:0,y:1}, ArrowDown:{x:0,y:-1},
    }[event.key];
    if (movement) {
      event.preventDefault();
      geometrySession.keyboardActive = true;
      geometrySession.keyboardCursor = {
        x:Math.max(GEO_VIEW.min,Math.min(GEO_VIEW.max,geometrySession.keyboardCursor.x+movement.x)),
        y:Math.max(GEO_VIEW.min,Math.min(GEO_VIEW.max,geometrySession.keyboardCursor.y+movement.y)),
      };
      renderBuild(exercise);
      document.querySelector('[data-geometry-interactive]').focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      addSelectedPoint({...geometrySession.keyboardCursor});
      document.querySelector('[data-geometry-interactive]').focus();
    }
  });
  document.getElementById('geometry-instruction').textContent =
    `Marca ${exercise.vertices.length} vértices en orden. Puedes tocar la cuadrícula o usar las flechas y Enter. Giro: ${exercise.angle}° ${exercise.direction === 'clockwise' ? 'horario' : 'antihorario'}.`;
  document.getElementById('geometry-actions').innerHTML =
    `<button class="btn-secondary" onclick="undoGeometryPoint()">↶ Deshacer</button>
     <button class="btn-primary" onclick="checkGeometryBuild()">✓ Comprobar</button>`;
}

function undoGeometryPoint() {
  geometrySession.selected.pop();
  renderBuild(ROTATION_BUILD_EXERCISES[geometrySession.index]);
}

function checkGeometryBuild() {
  const exercise = ROTATION_BUILD_EXERCISES[geometrySession.index];
  const correctPoints = rotateShape(exercise.vertices, exercise.center, exercise.angle, exercise.direction);
  if (geometrySession.selected.length !== correctPoints.length) {
    setGeometryFeedback(`Faltan ${correctPoints.length-geometrySession.selected.length} vértices. Márcalos siguiendo el orden A, B, C…`, 'error');
    return;
  }
  geometrySession.attempts++;
  const correct = sameShape(geometrySession.selected, correctPoints);
  document.getElementById('geometry-board-wrap').innerHTML = rotationBoard({
    vertices:exercise.vertices, center:exercise.center, transformed:correctPoints,
    userPoints:geometrySession.selected, ghost:true, radii:true, paths:true,
  });
  if (correct) {
    recordGeometryCompletion('build', exercise.id, exercise.reward);
    setGeometryFeedback('¡Construcción correcta! Las distancias al centro O se conservaron.', 'success');
    document.getElementById('geometry-actions').innerHTML =
      `<button class="btn-primary" onclick="nextGeometryActivity()">Siguiente →</button>`;
  } else {
    gs.geometryProgress.helpsUsed++;
    saveGs();
    setGeometryFeedback('Compara tus puntos numerados con A′, B′, C′. El centro y el ángulo determinan cada posición.', 'error');
    document.getElementById('geometry-actions').innerHTML =
      `<button class="btn-secondary" onclick="retryGeometryBuild()">Intentar de nuevo</button>
       <button class="btn-primary" onclick="nextGeometryActivity()">Continuar →</button>`;
  }
}

function retryGeometryBuild() {
  geometrySession.selected = [];
  renderBuild(ROTATION_BUILD_EXERCISES[geometrySession.index]);
  setGeometryFeedback();
}

function nextGeometryActivity() {
  const activities = geometryActivities();
  if (geometrySession.index >= activities.length-1) {
    openGeometryWorld();
    showNotification('🎉 ¡Modalidad completada!', 2500);
    return;
  }
  geometrySession.index++;
  geometrySession.attempts = 0;
  geometrySession.selected = [];
  renderGeometryActivity();
}

function labVertices() {
  const lab = geometrySession.lab;
  return translateShape(ROTATION_FIGURES[lab.figure].points, lab.offset.x, lab.offset.y);
}

function renderGeometryLab(transformed=null) {
  const lab = geometrySession.lab;
  geometrySession.currentAngle = lab.angle;
  geometrySession.currentDirection = lab.direction;
  document.getElementById('geometry-step').textContent = 'Libre';
  document.getElementById('geometry-instruction').textContent =
    'Arrastra la figura o el centro O. Cambia el giro y experimenta sin perder monedas.';
  document.getElementById('geometry-controls').innerHTML =
    selectMarkup('Figura','geo-lab-figure',Object.values(ROTATION_FIGURES).map(f=>({value:f.id,label:f.name})),lab.figure) +
    selectMarkup('Ángulo','geo-lab-angle',[90,180,270,360].map(n=>({value:n,label:`${n}°`})),lab.angle) +
    selectMarkup('Sentido','geo-lab-direction',[{value:'clockwise',label:'↻ Horario'},{value:'counterclockwise',label:'↺ Antihorario'}],lab.direction) +
    `<label><input type="checkbox" id="geo-lab-grid" ${lab.grid?'checked':''} onchange="updateGeometryControl()"> Cuadrícula</label>
     <label><input type="checkbox" id="geo-lab-radii" ${lab.radii?'checked':''} onchange="updateGeometryControl()"> Radios</label>
     <label><input type="checkbox" id="geo-lab-paths" ${lab.paths?'checked':''} onchange="updateGeometryControl()"> Trayectorias</label>
     <label><input type="checkbox" id="geo-lab-ghost" ${lab.ghost?'checked':''} onchange="updateGeometryControl()"> Figura inicial</label>`;
  const vertices = labVertices();
  document.getElementById('geometry-board-wrap').innerHTML = rotationBoard({
    vertices, center:lab.center, transformed, ghost:lab.ghost, radii:lab.radii,
    paths:lab.paths && Boolean(transformed), grid:lab.grid, interactive:true,
    ariaLabel:'Laboratorio interactivo de rotaciones',
  });
  bindLabDrag();
  document.getElementById('geometry-options').innerHTML = '';
  document.getElementById('geometry-actions').innerHTML =
    `<button class="btn-secondary" onclick="resetGeometryLab()">↺ Reiniciar</button>
     <button class="btn-primary" onclick="playGeometryLab()">▶ Girar</button>`;
}

function updateGeometryControl() {
  const lab = geometrySession.lab;
  lab.figure = document.getElementById('geo-lab-figure').value;
  lab.angle = Number(document.getElementById('geo-lab-angle').value);
  lab.direction = document.getElementById('geo-lab-direction').value;
  lab.grid = document.getElementById('geo-lab-grid').checked;
  lab.radii = document.getElementById('geo-lab-radii').checked;
  lab.paths = document.getElementById('geo-lab-paths').checked;
  lab.ghost = document.getElementById('geo-lab-ghost').checked;
  renderGeometryLab();
}

function bindLabDrag() {
  const svg = document.querySelector('[data-geometry-interactive]');
  svg.addEventListener('pointerdown', event => {
    const point = screenToModel(svg,event);
    geometrySession.lab.drag = pointDistance(point, geometrySession.lab.center) < 1.5 ? 'center' : 'shape';
    const move = moveEvent => {
      if (!geometrySession.lab.drag) return;
      const activeSvg = document.querySelector('[data-geometry-interactive]');
      const nextPoint = screenToModel(activeSvg,moveEvent);
      if (geometrySession.lab.drag === 'center') geometrySession.lab.center = nextPoint;
      else geometrySession.lab.offset = nextPoint;
      renderGeometryLab();
    };
    const finish = () => {
      geometrySession.lab.drag = null;
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',finish);
      window.removeEventListener('pointercancel',finish);
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',finish);
    window.addEventListener('pointercancel',finish);
  });
}

function playGeometryLab() {
  const lab = geometrySession.lab;
  const transformed = rotateShape(labVertices(), lab.center, lab.angle, lab.direction);
  renderGeometryLab(transformed);
  setGeometryFeedback('La figura cambió de orientación, pero conservó forma, tamaño y distancia al centro.', 'success');
}

function resetGeometryLab() {
  geometrySession.lab = {figure:'triangle',center:{x:0,y:0},offset:{x:2,y:1},angle:90,
    direction:'clockwise',grid:true,ghost:true,radii:true,paths:true,drag:null};
  renderGeometryLab();
  setGeometryFeedback();
}

function recordGeometryCompletion(mode, id, reward=0) {
  const completed = gs.geometryProgress.completed[mode];
  if (!completed.includes(id)) {
    completed.push(id);
    gs.geometryProgress.totalCompleted++;
    if (reward) {
      addCoins(reward);
      addXP(reward * 2);
      showNotification(`🪙 +${reward} · ✨ +${reward*2} XP`, 2200);
    }
  }
  if (mode === 'choose' || mode === 'build') {
    gs.geometryProgress.bestScores[mode] = Math.max(gs.geometryProgress.bestScores[mode], completed.length);
  }
  const evaluated = gs.geometryProgress.completed.choose.length + gs.geometryProgress.completed.build.length;
  gs.geometryProgress.stars = evaluated >= 10 ? 3 : evaluated >= 6 ? 2 : evaluated >= 3 ? 1 : 0;
  saveGs();
}

function stopGeometryActivity() {
  if (geometrySession.animation) cancelAnimationFrame(geometrySession.animation);
  geometrySession.animation = null;
  geometrySession.lab.drag = null;
}
