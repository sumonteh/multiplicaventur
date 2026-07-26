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

Abre `index.html` en un navegador moderno. Para evitar restricciones de archivos locales también puedes servir la carpeta con cualquier servidor web estático.

## Arquitectura

```text
index.html          Estructura y pantallas
css/styles.css      Diseño, responsive y accesibilidad
js/data.js          Mundos, modalidades, tienda y premios
js/state.js         Estado, persistencia y migraciones
js/questions.js     Generación de ejercicios sin duplicados
js/app.js           Navegación y control de las funcionalidades
```

Los mundos describen contenido y desbloqueo; las modalidades describen las reglas de cada partida. Esta separación permite combinar ambos conceptos sin duplicar lógica.

## Añadir un mundo

Agrega una entrada a `WORLDS` dentro de `js/data.js`:

```js
{
  id: 'w6',
  title: 'Templo Maestro',
  icon: '🏛️',
  tables: [2,3,4,5,6,7,8,9,10,11,12],
  minLevel: 10,
  difficulty: 'experta'
}
```

No es necesario modificar el motor, la navegación ni las modalidades. Al iniciar, `validateGameContent()` comprueba identificadores duplicados, tablas inválidas y configuraciones incompletas.

Las reglas de cada modalidad se encuentran en `GAME_MODES`. Allí se definen cantidad de preguntas, rango de factores, recompensa base, tiempo y vidas iniciales.

## Cómo funciona el progreso

El estado se guarda en `localStorage` con la clave `multiadv_gs`. La versión actual migra automáticamente partidas anteriores:

- Los potenciadores XP x2 y Monedas x2 duran tres partidas por compra.
- Las pistas se compran en grupos de tres.
- Vida Extra, Escudo e Imán se consumen cuando se activan.
- El dominio de cada tabla se calcula con respuestas reales por multiplicación.
- Las marcas de las tarjetas de repaso se conservan entre sesiones.

## Verificación recomendada

Antes de publicar cambios, comprueba al menos:

1. Inicio nuevo y continuación de una partida guardada.
2. Respuestas correctas e incorrectas en Clásico y Escribir.
3. Cancelación de Velocidad sin temporizador activo en segundo plano.
4. Consumo correcto de cada artículo.
5. Persistencia de tarjetas y progreso por tabla.
6. Reinicio de la racha diaria después de faltar un día.
7. Diseño a 375 × 667 y en escritorio.
