// Luz y grano del hero, en un quad que cubre toda su ventana. Arriba, una
// franja de luz: haces como los del botón (`prism-beams.glsl`, con sus propios
// valores), vistos a través de un canto de vidrio que hace de lente, pintando
// su color directo sobre el papel (pedido del usuario), y desvaneciéndose
// hacia abajo. En todo el hero, un grano fino sobre el papel que reacciona a
// esa luz: donde llega, el grano se tiñe de su color, la desgrana y se nota
// más. El color sale solo de estos shaders (excepción anotada en DESIGN.md §1).

uniform vec2 u_box;           // tamaño de la ventana del hero en px
uniform float u_thickness;    // alto de la franja de luz en px
uniform float u_time;         // segundos del reloj del hero
uniform vec3 u_ink;           // color del grano sobre el papel (lineal)

varying vec2 v_uv;

// ── Valores de los haces (banco de pruebas) ─────────────────
// Haces
const int BEAMS = 1;
const float ANGLE = 0.0;          // inclinación base, en grados
const float ANGLE_SPREAD = 12.0;  // cuánto se separa cada haz de la base, al azar, en grados
const float WOBBLE = 11.0;        // vaivén del ángulo, en grados
const float WIDTH = 400.0;        // ancho del haz, en px
const float SPEED = 0.2;
const float RANGE = 1.7;          // recorrido (1: llega a los bordes de lo que cruzan)
const float SOFT = 1.0;           // 0: borde del haz duro, 1: suave

// Espectro
const float SPECTRUM = 0.7;       // cuánto espectro entra a lo ancho del haz
const float SPEC_VAR = 2.0;       // cuánto cambian los colores al azar
const float SPEC_RATE = 0.1;      // qué tan rápido cambian
const float SPREAD = 12.5;        // corrimiento entre canales, en px
const float CORE = 0.2;           // núcleo blanco
const float CORE_WIDTH = 0.15;    // ancho del núcleo, en anchos de haz
const float STRIPES = 0.1;        // bandas finas
const float STRIPE_GAP = 1.0;     // separación de las bandas, en px

// Brillo: titila por tramos (para apagarlo y dejar el brillo parejo, `#define NO_FLICKER`).
const float FLOOR = 0.1;
const float PEAK = 1.1;
const float FLICKER = 0.6;        // velocidad del titileo
const float PATCH = 97.0;         // tamaño de los tramos que titilan, en px

// Lente (el vidrio por el que se ven los haces)
const float LENS = 0.15;          // aumento
const float LENS_SHIFT = 14.5;    // desvío hacia adentro en el medio del canto, en px
const float LENS_AB = 0.1;        // aberración (cada canal se desvía distinto)

// Rango de color de cada haz, en grados: color central y amplitud. El color
// va y vuelve dentro del rango, sin salirse ni saltar de un extremo al otro.
vec2 hueRange(int i) {
  return vec2(300.0, 221.0);
}

#include prism-beams;

const float GAIN = 1.8;           // intensidad
const float FADE = 0.8;           // qué parte del grosor se desvanece hacia abajo (1: toda)

// Grano
const float GRAIN_SIZE = 1.0;     // tamaño de cada grano, en px
const float GRAIN_PAPER = 0.035;  // opacidad del grano de tinta sobre el papel
const float GRAIN_LIGHT = 0.3;    // cuánto desgrana la luz (0: luz lisa, 1: toda en granos)
const float GRAIN_REACT = 0.8;    // cuánto más se nota el grano de tinta cerca de la luz
const float GRAIN_FADE = 0.2;     // qué parte del alto, desde abajo, se difumina hasta el papel liso

float grain(vec2 cell, float seed) {
  return fract(sin(dot(cell, vec2(12.9898, 78.233)) + seed) * 43758.5453);
}

void main() {
  vec2 p = (v_uv - 0.5) * u_box;
  float thickness = u_thickness;
  // Distancia al borde de arriba (0 en el borde, negativa hacia abajo).
  float d = p.y - u_box.y * 0.5;
  // La franja: hacia abajo se desvanece; arriba la corta el borde de la ventana.
  float band = smoothstep(-thickness, -thickness * (1.0 - FADE) + 0.7, d);

  vec3 color = vec3(1.0);
  float lit = 0.0;
  if (band > 0.001) {
    // Coordenadas de la franja: su centro en el medio de su alto.
    vec2 q = vec2(p.x, d + thickness * 0.5);
    vec3 light = lensBeams(q, vec2(0.0, 1.0), d, thickness, vec2(u_box.x, thickness) * 0.5, u_time, 1.0);
    // Sobre el papel: el color de la luz, con su intensidad como opacidad.
    vec3 add = pow(clamp(light * GAIN, 0.0, 1.0), vec3(1.0 / 2.2));
    float amount = max(add.r, max(add.g, add.b));
    color = add / max(amount, 1e-4);
    lit = amount * band;
  }

  // Grano: dos valores por celda, uno para la luz y otro para la tinta.
  vec2 cell = floor(p / GRAIN_SIZE);
  float g1 = grain(cell, 0.0);
  float g2 = grain(cell, 17.0);
  // La luz se desgrana: cada grano la deja pasar más o menos.
  float shine = clamp(lit * mix(1.0, g1 * 2.0, GRAIN_LIGHT), 0.0, 1.0);
  // La tinta: granos sueltos sobre el papel, más marcados donde llega la luz.
  // Abajo se difuminan hasta el papel liso, para fundirse con lo que sigue.
  float bottom = smoothstep(0.0, u_box.y * GRAIN_FADE, p.y + u_box.y * 0.5);
  float ink = GRAIN_PAPER * smoothstep(0.55, 1.0, g2) * (1.0 + GRAIN_REACT * lit) * (1.0 - shine) * bottom * bottom;

  float alpha = shine + ink;
  if (alpha < 0.002) discard;
  vec3 mixed = (pow(color, vec3(2.2)) * shine + u_ink * ink) / alpha;
  gl_FragColor = vec4(mixed, alpha);
  #include <colorspace_fragment>
}
