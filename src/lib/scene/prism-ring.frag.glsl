// Lente del botón del hero: un círculo de vidrio más oscuro que la píldora,
// con una flecha blanca adentro y un aro por el que se ven los haces de luz
// (`prism-beams.glsl`), pegado al borde de la lente. El aro es una varilla de
// vidrio: agranda lo que hay detrás, lo desvía hacia adentro en el medio y
// desvía distinto cada canal (aberración), con dos reflejos finos en sus bordes.
// Hover (o foco): los haces brillan un 30 % más. El vidrio no cambia.
// La luz no sale de la lente. El color sale solo de estos shaders
// (excepción anotada en DESIGN.md §1).

uniform vec2 u_quad;          // tamaño del quad en px (la lente más un margen para el antialias)
uniform float u_radius;       // radio de la lente en px
uniform float u_time;         // segundos del reloj del hero
uniform float u_halo;         // 0 en reposo, 1 con el puntero encima o con foco (con transición)
uniform vec3 u_glass;         // color del vidrio de la píldora (lineal); la lente es más oscura
uniform vec3 u_icon;          // color de la flecha (lineal)

varying vec2 v_uv;

// ── Valores de los haces (banco de pruebas) ─────────────────
// Haces
const int BEAMS = 3;
const float ANGLE = 22.0;         // inclinación base, en grados
const float ANGLE_SPREAD = 62.0;  // cuánto se separa cada haz de la base, al azar, en grados
const float WOBBLE = 42.0;        // vaivén del ángulo, en grados
const float WIDTH = 19.0;         // ancho del haz, en px
const float SPEED = 0.15;
const float RANGE = 0.95;         // recorrido (1: llega a los bordes de lo que cruzan)
const float SOFT = 0.1;           // 0: borde del haz duro, 1: suave

// Espectro
const float SPECTRUM = 2.9;       // cuánto espectro entra a lo ancho del haz
const float SPEC_VAR = 1.5;       // cuánto cambian los colores al azar
const float SPEC_RATE = 0.25;     // qué tan rápido cambian
const float SPREAD = 1.0;         // corrimiento entre canales, en px
const float CORE = 1.0;           // núcleo blanco
const float CORE_WIDTH = 0.5;     // ancho del núcleo, en anchos de haz
const float STRIPES = 0.44;       // bandas finas
const float STRIPE_GAP = 1.0;     // separación de las bandas, en px

// Brillo
const float FLOOR = 0.65;
const float PEAK = 1.5;
const float FLICKER = 1.5;        // velocidad del titileo
const float PATCH = 54.0;         // tamaño de los tramos que titilan, en px

// Lente (el vidrio por el que se ven los haces)
const float LENS = 0.45;          // aumento
const float LENS_SHIFT = 5.5;     // desvío hacia adentro en el medio del canto, en px
const float LENS_AB = 0.05;       // aberración (cada canal se desvía distinto)

// Rango de color de cada haz, en grados: color central y amplitud. El color
// va y vuelve dentro del rango, sin salirse ni saltar de un extremo al otro.
vec2 hueRange(int i) {
  if (i == 0) return vec2(46.0, 36.0);
  if (i == 1) return vec2(287.0, 227.0);
  return vec2(360.0, 90.0);
}

#include prism-beams;

const float RING = 5.0;           // grosor del aro, en px
const float LENS_EDGE = 0.25;     // reflejos del vidrio del aro
const float GAIN = 1.5;           // los haces se ven más fuertes en el aro, que es fino
const float LENS_DARK = 0.78;     // la lente es el vidrio de la píldora oscurecido (en sRGB)
const float STROKE = 1.8;         // grosor del trazo de la flecha, en px

// Distancia a un segmento.
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

// La flecha (16 × 16 px, centrada): el asta y la punta, con puntas redondas.
float arrow(vec2 p) {
  float d = segment(p, vec2(-5.0, 0.0), vec2(4.0, 0.0));
  d = min(d, segment(p, vec2(0.5, 3.5), vec2(4.0, 0.0)));
  d = min(d, segment(p, vec2(0.5, -3.5), vec2(4.0, 0.0)));
  return 1.0 - smoothstep(-0.5, 0.5, d - STROKE * 0.5);
}

void main() {
  vec2 p = (v_uv - 0.5) * u_quad;
  float d = length(p) - u_radius;
  float disk = 1.0 - smoothstep(-0.5, 0.5, d);
  if (disk < 0.001) discard;

  // La lente y la flecha, en sRGB.
  vec3 lens = pow(u_glass, vec3(1.0 / 2.2)) * LENS_DARK;
  vec3 base = mix(lens, pow(u_icon, vec3(1.0 / 2.2)), arrow(p));

  // El aro: hacia adentro se apaga suave; hacia afuera termina justo en el borde de la lente.
  float ring = smoothstep(-RING - 0.7, -RING + 0.7, d);
  // Posición a través del aro: −1 adentro, 1 afuera.
  float across = clamp((d + RING * 0.5) / (RING * 0.5), -1.0, 1.0);
  vec2 normal = normalize(p + vec2(0.0, 1e-4));

  vec3 light = lensBeams(p, normal, d, RING, vec2(u_radius), u_time, 1.0 + 0.3 * u_halo);
  // Reflejos finos del vidrio en los dos bordes del aro.
  float edge = (exp(-pow((across - 0.8) / 0.18, 2.0)) + 0.6 * exp(-pow((across + 0.75) / 0.2, 2.0))) * LENS_EDGE;

  // La luz se suma sobre el vidrio (como una pantalla), en sRGB como en el banco de pruebas.
  vec3 add = pow(clamp(light * GAIN + edge, 0.0, 1.0), vec3(1.0 / 2.2));
  vec3 color = mix(base, base + add * (1.0 - base), ring);

  gl_FragColor = vec4(pow(color, vec3(2.2)), disk);
  #include <colorspace_fragment>
}
