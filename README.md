# Multiplicaventura

Juego educativo en español para practicar las tablas de multiplicar. Funciona directamente en el navegador y guarda el progreso en el dispositivo.

## Funciones principales

- Mundos progresivos para las tablas del 2 al 12.
- Modos Clásico, Velocidad, Supervivencia, Desafío y Escribir.
- Tarjetas de repaso con progreso persistente.
- Tienda de personajes, apariencias, premios y ayudas.
- Recompensa diaria, experiencia, niveles y colección de premios.
- Diseño adaptable para teléfonos y computadores.
- Geometría Aventura con rotaciones visuales en cuadrícula.

## Ejecutar localmente

La opción más simple es abrir `index.html` en un navegador moderno. Para reproducir el entorno de las pruebas conviene usar un servidor estático:

```bash
python3 -m http.server 4173
```

Luego abre `http://localhost:4173`.

## Arquitectura modular

```text
index.html              Estructura semántica y pantallas.
css/styles.css          Diseño, responsive, animaciones y accesibilidad.
js/data.js              Mundos, modalidades, catálogo, premios y validación.
js/state.js             Estado global, persistencia, migraciones y potenciadores.
js/questions.js         Generación reutilizable de ejercicios sin duplicados.
js/geometry.js          Figuras, ejercicios y motor matemático puro de rotaciones.
js/geometry-ui.js       Tablero SVG y control de actividades geométricas visuales.
js/app.js               Navegación, controladores de interfaz y ciclo de partida.
tests/browser-smoke.cjs  Las 17 comprobaciones funcionales en navegador real.
tests/geometry-smoke.cjs Comprobaciones matemáticas, visuales y de persistencia.
package.json            Dependencias y comando de pruebas.
```

Los mundos describen contenido y desbloqueo; las modalidades describen las reglas de cada partida. `WORLDS` conserva exclusivamente los cinco mundos de multiplicación para no alterar sus 25 combinaciones verificadas. `LEARNING_WORLDS` añade mundos de otros tipos, como Geometría, y permite que la navegación elija el controlador apropiado.

El motor de preguntas combina mundos de multiplicación y modalidades sin conocer pantallas o persistencia. De forma paralela, el motor puro de `geometry.js` calcula vértices, distancias, trayectorias y distractores; `geometry-ui.js` los representa en SVG. Esta separación permite reutilizar el tablero para futuras transformaciones sin introducirlas en el cuestionario de multiplicaciones.

## Añadir un mundo

Agrega una entrada a `WORLDS` dentro de `js/data.js`:

```js
{
  id: 'w6',
  title: 'Isla de las Tablas',
  icon: '🏝️',
  tables: [3, 6, 9],
  minLevel: 8,
  difficulty: 'experta',
}
```

Usa un `id` único, declara al menos una tabla válida y conserva los campos requeridos. No es necesario modificar el motor, la navegación ni las modalidades.

Este ejemplo solo documenta el mecanismo de extensión; no registra un mundo nuevo en la aplicación.

Para una actividad visual, registra además el mundo en `LEARNING_WORLDS` con un tipo estable y conecta un controlador especializado:

```js
const VISUAL_WORLD = {
  id: 'visual-example',
  type: 'visual',
  title: 'Mundo visual',
  icon: '🔷',
  minLevel: 1,
  unlockedByDefault: true,
  modes: ['learn'],
};

const LEARNING_WORLDS = [...WORLDS, VISUAL_WORLD];
```

El ejemplo no implementa ningún contenido adicional. Las respuestas calculables deben permanecer en un motor independiente de la interfaz.

## Añadir una modalidad

Agrega su configuración a `GAME_MODES` dentro de `js/data.js`:

```js
practice: {
  questionCount: 10,
  factorStart: 1,
  factorEnd: 10,
  baseCoins: 8,
  timedSeconds: 0,
}
```

Después añade su tarjeta o control de entrada en `index.html`. Las reglas deben permanecer en `GAME_MODES`; evita introducir condiciones específicas del mundo en `app.js`.

## Persistencia

El estado se guarda en `localStorage` con la clave `multiadv_gs`. `DEFAULT_STATE` define el contrato vigente y `saveGs()` serializa el progreso. `loadGs()` combina el contenido guardado con los valores predeterminados y se recupera de datos corruptos sin detener la aplicación.

- Los potenciadores XP x2 y Monedas x2 duran tres partidas por compra.
- Las pistas se compran en grupos de tres.
- Vida Extra, Escudo e Imán se consumen cuando se activan.
- El dominio de cada tabla se calcula con respuestas reales por multiplicación.
- Las marcas de las tarjetas de repaso se conservan entre sesiones.
- Geometría guarda acceso, modalidad actual, ejercicios completados, mejores resultados, estrellas, ayudas utilizadas y progreso total.

## Migraciones

El campo `version` de `DEFAULT_STATE` identifica el formato actual. `migrateState(saved)` transforma partidas anteriores antes de usarlas. Para cambiar el formato:

1. incrementa `DEFAULT_STATE.version`;
2. añade una transformación condicionada por `saved.version`;
3. conserva valores desconocidos cuando sean compatibles;
4. agrega una comprobación de migración a `tests/browser-smoke.cjs`.

Nunca reemplaces directamente una partida anterior sin pasar por `migrateState()`.

## Validar configuraciones

`validateGameContent()` se ejecuta al iniciar y detiene configuraciones inválidas. Comprueba mundos duplicados, campos incompletos, tablas fuera de rango, cantidades de preguntas y rangos de factores. `validateGeometryContent()` comprueba identificadores, modalidades, figuras, vértices, ángulos, sentidos, conservación de distancias y las cantidades iniciales de actividades.

El motor también rechaza una modalidad que solicite más preguntas que combinaciones únicas disponibles. Ejecuta las pruebas después de modificar `WORLDS` o `GAME_MODES`.

## Probar

Requiere Node.js y npm. Instala las dependencias una vez:

```bash
npm install
```

Ejecuta:

```bash
npm test
```

La prueba levanta un servidor local temporal y abre Chromium. Primero ejecuta exactamente las 17 comprobaciones históricas:

- carga inicial y creación de jugador;
- configuración de mundos y modalidades;
- ejercicios únicos;
- migración de partidas anteriores;
- salida segura del modo Velocidad;
- compra y consumo de artículos;
- progreso por multiplicación;
- persistencia de tarjetas;
- racha diaria;
- vista móvil a 375 × 667;
- ausencia de errores de ejecución.

Después ejecuta las comprobaciones de Geometría: motor de 90°, 180°, 270° y 360°; centro fuera del origen; conservación de distancias; catálogo y alternativas; migración; persistencia; navegación; SVG; vista móvil y errores de ejecución.

Las capturas resultantes se guardan en `docs/screenshots/desktop.png`, `mobile.png`, `geometry-desktop.png` y `geometry-mobile.png`.

## Geometría Aventura

El mundo `geometry-rotations` está disponible por defecto y ofrece:

- **Aprende:** tres demostraciones, controles de ángulo y sentido, animación alrededor del centro real y ayudas visuales.
- **Elige:** seis ejercicios con tres posiciones y explicaciones específicas para los errores.
- **Construye:** cuatro ejercicios táctiles para marcar vértices en orden y comparar con la solución.
- **Laboratorio:** triángulo, cuadrado, rectángulo o figura irregular; centro y figura móviles; cuadrícula, radios, trayectorias y fantasma configurables.

Las coordenadas del modelo usan Y positiva hacia arriba. Solo `modelToScreen()` invierte Y para SVG, donde la coordenada vertical crece hacia abajo. Así se evita invertir accidentalmente los sentidos horario y antihorario.
