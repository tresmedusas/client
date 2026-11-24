// Luz y grano del hero, en un quad que cubre toda su ventana. En los bordes
// de arriba y de los costados (no en el de abajo; pedido del usuario), una
// franja de luz: haces como los del botón (`prism-beams.glsl`, con sus propios
// valores), vistos a través de un canto de vidrio que hace de lente, pintando
// su color directo sobre el papel (pedido del usuario), y desvaneciéndose
// hacia adentro. Las de los costados se apagan al llegar abajo. En todo el hero, un grano fino sobre el papel que reacciona a
// esa luz: donde llega, el grano se tiñe de su color, la desgrana y se nota
// más. El color sale solo de estos shaders (excepción anotada en DESIGN.md §1).

uniform vec2 u_box;           // tamaño de la ventana del hero en px
uniform float u_thickness;    // grosor de cada franja de luz en px
uniform float u_time;         // segundos del reloj del hero
uniform vec3 u_ink;           // color del grano sobre el papel (lineal)
uniform vec3 u_paper;         // fondo propio del hero (lineal), si `u_opaque` es 1
uniform float u_opaque;       // 1: el hero tiene fondo propio (opaco); 0: transparente sobre el papel

varying vec2 v_uv;

// ── Valores de los haces (banco de pruebas) ─────────────────
// Haces
const int BEAMS = 1;
const float ANGLE = 0.0;          // inclinación base, en grados
const float ANGLE_SPREAD = 4.0;   // cuánto se separa cada haz de la base, al azar, en grados
const float WOBBLE = 3.0;         // vaivén del ángulo, en grados
const float WIDTH = 54.0;         // ancho del haz, en px
const float SPEED = 0.2;
const float RANGE = 0.35;         // recorrido (1: llega a los bordes de lo que cruzan)
const float SOFT = 0.7;           // 0: borde del haz duro, 1: suave

// Espectro
const float SPECTRUM = 0.2;       // cuánto espectro entra a lo ancho del haz
const float SPEC_VAR = 2.0;       // cuánto cambian los colores al azar
const float SPEC_RATE = 0.3;      // qué tan rápido cambian
const float SPREAD = 1.0;         // corrimiento entre canales, en px
const float CORE = 0.15;          // núcleo blanco
const float CORE_WIDTH = 0.1;     // ancho del núcleo, en anchos de haz
const float STRIPES = 0.02;       // bandas finas
const float STRIPE_GAP = 1.0;     // separación de las bandas, en px

// Brillo: deshabilitado (pedido del usuario): los haces no titilan y quedan con
// brillo parejo. Los valores quedan para volver a habilitarlo sacando el define.
#define NO_FLICKER
const float FLOOR = 0.1;
const float PEAK = 1.1;
const float FLICKER = 0.6;        // velocidad del titileo
const float PATCH = 97.0;         // tamaño de los tramos que titilan, en px

// Lente (el vidrio por el que se ven los haces)
const float LENS = 0.5;           // aumento
const float LENS_SHIFT = 125.0;   // desvío hacia adentro en el medio del canto, en px
const float LENS_AB = 0.0;        // aberración (cada canal se desvía distinto)

// Colores en movimiento: manchas que fluyen al azar, cada una con su tono.
#define COLOR_FLOW
const float FLOW_AMT = 1.2;       // cuánto cambian los colores
const float FLOW_SCALE = 375.0;   // tamaño de las manchas de color, en px
const float FLOW_SPEED = 0.15;    // velocidad de las manchas
const float FLOW_WARP = 0.5;      // turbulencia
const float FLOW_DRIFT = 0.9;     // deriva a lo largo del borde

// Rango de color de cada haz, en grados: color central y amplitud. El color
// va y vuelve dentro del rango, sin salirse ni saltar de un extremo al otro.
vec2 hueRange(int i) {
  return vec2(360.0, 154.0);
}

#include prism-beams;

const float GAIN = 0.95;          // intensidad
const float FADE = 1.0;           // qué parte del grosor se desvanece hacia adentro (1: toda)
const float FADE_CURVE = 2.5;     // curva del desvanecido: 1 lo reparte parejo; más, concentra la luz en el borde y deja una cola larga y tenue
const float SIDE_FADE = 0.3;      // qué parte del alto, desde abajo, apaga las franjas de los costados
const float EDGE_LAG = 37.0;      // desfase en el tiempo entre los bordes, en s (el derecho, 1.92 veces)

// Grano
const float GRAIN_SIZE = 0.5;     // tamaño de cada grano, en px
const float GRAIN_PAPER = 0.01;   // opacidad del grano de tinta sobre el papel
const float GRAIN_LIGHT = 0.3;    // cuánto desgrana la luz (0: luz lisa, 1: toda en granos)
const float GRAIN_REACT = 0.8;    // cuánto más se nota el grano de tinta cerca de la luz
const float GRAIN_FADE = 0.2;     // qué parte del alto, desde abajo, se difumina hasta el papel liso

float grain(vec2 cell, float seed) {
  return fract(sin(dot(cell, vec2(12.9898, 78.233)) + seed) * 43758.5453);
}

// La franja de un borde, ya como se pinta: su color (rgb) y su opacidad (a).
// `along` corre a lo largo del borde, `d` es la distancia al borde (0 en el
// borde, negativa hacia adentro) y `extentAlong` su largo. Cada borde mira
// los haces en otro momento, para que no se repitan.
//
// El desvanecido va sobre la opacidad, después de saturar la luz: si se
// aplicara a la luz antes, donde los haces son intensos la saturación se
// comería el degradé y la franja terminaría en un corte recto.
vec4 edgeLight(float along, float d, float extentAlong, float thickness, float seed) {
  float band = smoothstep(-thickness, -thickness * (1.0 - FADE) + 0.7, d);
  if (band < 0.001) return vec4(0.0);
  vec2 q = vec2(along, d + thickness * 0.5);
  vec3 light = lensBeams(q, vec2(0.0, 1.0), d, thickness, vec2(extentAlong, thickness) * 0.5, u_time + seed, 1.0);
  vec3 add = pow(clamp(light * GAIN, 0.0, 1.0), vec3(1.0 / 2.2));
  float amount = max(add.r, max(add.g, add.b));
  return vec4(add / max(amount, 1e-4), amount * pow(band, FADE_CURVE));
}

void main() {
  vec2 p = (v_uv - 0.5) * u_box;
  vec2 halfBox = u_box * 0.5;
  float thickness = u_thickness;

  // Arriba, y a los costados (que se apagan hacia abajo). En las esquinas,
  // los colores se mezclan según cuánto pesa cada franja.
  vec4 top = edgeLight(p.x, p.y - halfBox.y, u_box.x, thickness, 0.0);
  vec4 left = vec4(0.0);
  vec4 right = vec4(0.0);
  float sides = smoothstep(0.0, u_box.y * SIDE_FADE, p.y + halfBox.y);
  if (sides > 0.001) {
    left = edgeLight(-p.y, -p.x - halfBox.x, u_box.y, thickness, EDGE_LAG);
    right = edgeLight(p.y, p.x - halfBox.x, u_box.y, thickness, EDGE_LAG * 1.92);
    left.a *= sides;
    right.a *= sides;
  }
  float weight = top.a + left.a + right.a;
  vec3 color = weight > 0.0 ? (top.rgb * top.a + left.rgb * left.a + right.rgb * right.a) / weight : vec3(1.0);
  // Sobre el papel: el color de la luz, con su intensidad como opacidad.
  float lit = max(top.a, max(left.a, right.a));

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
  if (alpha < 0.002 && u_opaque < 0.5) discard;
  vec3 mixed = (pow(color, vec3(2.2)) * shine + u_ink * ink) / max(alpha, 1e-4);
  gl_FragColor = u_opaque > 0.5 ? vec4(mix(u_paper, mixed, clamp(alpha, 0.0, 1.0)), 1.0) : vec4(mixed, alpha);
  #include <colorspace_fragment>
}
