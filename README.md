# Multiplicaventura

Juego educativo en español para practicar las tablas de multiplicar. Funciona directamente en el navegador y guarda el progreso en el dispositivo.

## Funciones principales

- Mundos progresivos para las tablas del 2 al 12.
- Modos Clásico, Velocidad, Supervivencia, Desafío y Escribir.
- Tarjetas de repaso con progreso persistente.
- Tienda de personajes, apariencias, premios y ayudas.
- Recompensa diaria, experiencia, niveles y colección de premios.
- Diseño adaptable para teléfonos y computadores.

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
js/app.js               Navegación, controladores de interfaz y ciclo de partida.
tests/browser-smoke.cjs  Las 17 comprobaciones funcionales en navegador real.
package.json            Dependencias y comando de pruebas.
```

Los mundos describen contenido y desbloqueo; las modalidades describen las reglas de cada partida. El motor de preguntas combina ambas configuraciones sin conocer pantallas o persistencia. La interfaz consume ese motor y delega el guardado en `state.js`.

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

## Migraciones

El campo `version` de `DEFAULT_STATE` identifica el formato actual. `migrateState(saved)` transforma partidas anteriores antes de usarlas. Para cambiar el formato:

1. incrementa `DEFAULT_STATE.version`;
2. añade una transformación condicionada por `saved.version`;
3. conserva valores desconocidos cuando sean compatibles;
4. agrega una comprobación de migración a `tests/browser-smoke.cjs`.

Nunca reemplaces directamente una partida anterior sin pasar por `migrateState()`.

## Validar configuraciones

`validateGameContent()` se ejecuta al iniciar y detiene configuraciones inválidas. Comprueba mundos duplicados, campos incompletos, tablas fuera de rango, cantidades de preguntas y rangos de factores.

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

La prueba levanta un servidor local temporal, abre Chromium y ejecuta exactamente 17 comprobaciones:

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

Las capturas resultantes se guardan en `docs/screenshots/desktop.png` y `docs/screenshots/mobile.png`.
