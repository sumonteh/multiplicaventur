// ============================================================
// GEOMETRY ADVENTURE — ROTATION ENGINE AND ACTIVITY DATA
// ============================================================

const ROTATION_FIGURES = {
  triangle: {
    id:'triangle',
    name:'Triángulo',
    points:[{x:-2,y:-1},{x:0,y:-1},{x:-1,y:1}],
  },
  square: {
    id:'square',
    name:'Cuadrado',
    points:[{x:-1,y:-1},{x:1,y:-1},{x:1,y:1},{x:-1,y:1}],
  },
  rectangle: {
    id:'rectangle',
    name:'Rectángulo',
    points:[{x:-2,y:-1},{x:1,y:-1},{x:1,y:1},{x:-2,y:1}],
  },
  irregular: {
    id:'irregular',
    name:'Figura irregular',
    points:[{x:-2,y:-1},{x:0,y:-2},{x:2,y:0},{x:0,y:2},{x:-2,y:1}],
  },
};

const ROTATION_DEMOS = [
  {
    id:'learn-90-clockwise',
    mode:'learn',
    difficulty:1,
    figure:'triangle',
    vertices:[{x:1,y:1},{x:3,y:1},{x:2,y:3}],
    center:{x:0,y:0},
    angle:90,
    direction:'clockwise',
    helps:{ ghost:true, radii:true, paths:true },
    reward:0,
    message:'Un cuarto de giro horario mueve cada vértice 90° alrededor del centro.',
  },
  {
    id:'learn-180-vertex',
    mode:'learn',
    difficulty:2,
    figure:'rectangle',
    vertices:[{x:-2,y:-1},{x:1,y:-1},{x:1,y:1},{x:-2,y:1}],
    center:{x:-2,y:-1},
    angle:180,
    direction:'clockwise',
    helps:{ ghost:true, radii:true, paths:true },
    reward:0,
    message:'En un medio giro, el vértice que coincide con el centro permanece fijo.',
  },
  {
    id:'learn-270-outside',
    mode:'learn',
    difficulty:3,
    figure:'irregular',
    vertices:[{x:-3,y:-1},{x:-2,y:-2},{x:0,y:-1},{x:-1,y:1},{x:-3,y:1}],
    center:{x:1,y:0},
    angle:270,
    direction:'counterclockwise',
    helps:{ ghost:true, radii:true, paths:true },
    reward:0,
    message:'Aunque el centro esté fuera, todos los vértices conservan su distancia al punto de giro.',
  },
];

const ROTATION_CHOICE_EXERCISES = [
  { id:'choose-1', mode:'choose', difficulty:1, figure:'triangle', vertices:[{x:1,y:1},{x:3,y:1},{x:2,y:3}], center:{x:0,y:0}, angle:90, direction:'clockwise', helps:{ghost:true}, attempts:2, reward:5 },
  { id:'choose-2', mode:'choose', difficulty:1, figure:'square', vertices:[{x:-1,y:1},{x:1,y:1},{x:1,y:3},{x:-1,y:3}], center:{x:0,y:0}, angle:90, direction:'counterclockwise', helps:{ghost:true}, attempts:2, reward:5 },
  { id:'choose-3', mode:'choose', difficulty:2, figure:'rectangle', vertices:[{x:-3,y:-1},{x:0,y:-1},{x:0,y:1},{x:-3,y:1}], center:{x:1,y:0}, angle:180, direction:'clockwise', helps:{ghost:false}, attempts:2, reward:6 },
  { id:'choose-4', mode:'choose', difficulty:2, figure:'triangle', vertices:[{x:-2,y:0},{x:0,y:0},{x:-1,y:2}], center:{x:-2,y:0}, angle:270, direction:'clockwise', helps:{ghost:false}, attempts:2, reward:6 },
  { id:'choose-5', mode:'choose', difficulty:3, figure:'square', vertices:[{x:-4,y:-1},{x:-2,y:-1},{x:-2,y:1},{x:-4,y:1}], center:{x:1,y:0}, angle:90, direction:'counterclockwise', helps:{ghost:false}, attempts:1, reward:7 },
  { id:'choose-6', mode:'choose', difficulty:3, figure:'irregular', vertices:[{x:1,y:-1},{x:3,y:-2},{x:4,y:0},{x:2,y:2},{x:1,y:1}], center:{x:-2,y:0}, angle:180, direction:'counterclockwise', helps:{ghost:false}, attempts:1, reward:7 },
];

const ROTATION_BUILD_EXERCISES = [
  { id:'build-1', mode:'build', difficulty:1, figure:'triangle', vertices:[{x:1,y:1},{x:3,y:1},{x:2,y:3}], center:{x:0,y:0}, angle:90, direction:'clockwise', helps:{ghost:true,radii:true}, attempts:3, reward:8 },
  { id:'build-2', mode:'build', difficulty:2, figure:'square', vertices:[{x:-1,y:1},{x:1,y:1},{x:1,y:3},{x:-1,y:3}], center:{x:0,y:0}, angle:90, direction:'counterclockwise', helps:{ghost:true,radii:false}, attempts:3, reward:8 },
  { id:'build-3', mode:'build', difficulty:2, figure:'rectangle', vertices:[{x:-3,y:-1},{x:0,y:-1},{x:0,y:1},{x:-3,y:1}], center:{x:1,y:0}, angle:180, direction:'clockwise', helps:{ghost:false,radii:false}, attempts:2, reward:10 },
  { id:'build-4', mode:'build', difficulty:3, figure:'irregular', vertices:[{x:-3,y:-1},{x:-2,y:-2},{x:0,y:-1},{x:-1,y:1},{x:-3,y:1}], center:{x:2,y:0}, angle:270, direction:'counterclockwise', helps:{ghost:false,radii:false}, attempts:2, reward:12 },
];

const GEOMETRY_EXERCISES = [
  ...ROTATION_DEMOS,
  ...ROTATION_CHOICE_EXERCISES,
  ...ROTATION_BUILD_EXERCISES,
];

function roundGridValue(value) {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-9 ? rounded : Number(value.toFixed(6));
}

/**
 * Rotates a mathematical point around a center.
 * Mathematical coordinates use +Y upwards. SVG screen coordinates use +Y
 * downwards, so modelToScreen() performs the Y inversion exactly once.
 */
function rotatePoint(point, center, angle, direction='counterclockwise') {
  const signedAngle = direction === 'clockwise' ? -angle : angle;
  const radians = signedAngle * Math.PI / 180;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x:roundGridValue(center.x + dx * Math.cos(radians) - dy * Math.sin(radians)),
    y:roundGridValue(center.y + dx * Math.sin(radians) + dy * Math.cos(radians)),
  };
}

function rotateShape(points, center, angle, direction='counterclockwise') {
  return points.map(point => rotatePoint(point, center, angle, direction));
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function preservesRotationDistances(before, after, center, tolerance=1e-6) {
  return before.length === after.length && before.every((point, index) =>
    Math.abs(pointDistance(point, center) - pointDistance(after[index], center)) <= tolerance);
}

function rotationPath(point, center, angle, direction='counterclockwise', steps=24) {
  return Array.from({length:steps + 1}, (_, index) =>
    rotatePoint(point, center, angle * index / steps, direction));
}

function translateShape(points, dx, dy) {
  return points.map(point => ({x:point.x + dx, y:point.y + dy}));
}

function reflectShape(points, center) {
  return points.map(point => ({x:roundGridValue(2 * center.x - point.x), y:point.y}));
}

function samePoint(a, b, tolerance=1e-6) {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function sameShape(a, b, tolerance=1e-6) {
  return a.length === b.length && a.every((point, index) => samePoint(point, b[index], tolerance));
}

function generateRotationAlternatives(exercise) {
  const correct = rotateShape(exercise.vertices, exercise.center, exercise.angle, exercise.direction);
  const oppositeDirection = exercise.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
  const opposite = rotateShape(exercise.vertices, exercise.center, exercise.angle, oppositeDirection);
  const translated = translateShape(exercise.vertices, correct[0].x - exercise.vertices[0].x, correct[0].y - exercise.vertices[0].y);
  const reflected = reflectShape(exercise.vertices, exercise.center);
  const candidates = [
    {
      id:'correct',
      points:correct,
      correct:true,
      feedback:'¡Correcto! La figura giró alrededor del centro sin cambiar su forma, tamaño ni distancia.',
    },
    {
      id:'opposite',
      points:opposite,
      correct:false,
      feedback:'Esa posición corresponde al sentido contrario. Sigue la flecha del giro.',
    },
    {
      id:'translation',
      points:translated,
      correct:false,
      feedback:'Eso es una traslación: la figura se movió, pero no cambió su orientación alrededor del centro.',
    },
    {
      id:'reflection',
      points:reflected,
      correct:false,
      feedback:'Eso parece una reflexión. En una rotación, cada vértice recorre un arco alrededor del centro.',
    },
  ];
  const distinctWrong = candidates.filter(candidate =>
    candidate.correct || !sameShape(candidate.points, correct));
  return [distinctWrong[0], ...shuffle(distinctWrong.slice(1)).slice(0, 2)];
}

function validateGeometryContent() {
  const ids = new Set();
  GEOMETRY_EXERCISES.forEach(exercise => {
    if (!exercise.id || ids.has(exercise.id)) throw new Error(`Ejercicio geométrico duplicado: ${exercise.id}`);
    if (!GEOMETRY_MODES[exercise.mode]) throw new Error(`Modalidad geométrica desconocida: ${exercise.mode}`);
    if (!ROTATION_FIGURES[exercise.figure]) throw new Error(`Figura geométrica desconocida: ${exercise.figure}`);
    if (!Array.isArray(exercise.vertices) || exercise.vertices.length < 3) {
      throw new Error(`El ejercicio ${exercise.id} necesita al menos tres vértices`);
    }
    if (![90,180,270,360].includes(exercise.angle)) throw new Error(`Ángulo inválido en ${exercise.id}`);
    if (!['clockwise','counterclockwise'].includes(exercise.direction)) {
      throw new Error(`Sentido inválido en ${exercise.id}`);
    }
    const rotated = rotateShape(exercise.vertices, exercise.center, exercise.angle, exercise.direction);
    if (!preservesRotationDistances(exercise.vertices, rotated, exercise.center)) {
      throw new Error(`El ejercicio ${exercise.id} no conserva las distancias`);
    }
    ids.add(exercise.id);
  });
  if (ROTATION_DEMOS.length !== 3 || ROTATION_CHOICE_EXERCISES.length !== 6 || ROTATION_BUILD_EXERCISES.length !== 4) {
    throw new Error('Cantidad de actividades geométricas incompleta');
  }
}
