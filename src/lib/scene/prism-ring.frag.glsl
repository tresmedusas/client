// Lente del botón del hero: un círculo de vidrio más oscuro que la píldora,
// con una flecha blanca adentro y un aro por el que se ven los haces de luz
// (`prism-beams.glsl`), pegado al borde de la lente. El aro es una varilla de
// vidrio: agranda lo que hay detrás, lo desvía hacia adentro en el medio y
// desvía distinto cada canal (aberración), con dos reflejos finos en sus bordes.
// Hover (o foco): los haces brillan un 30 % más. El vidrio no cambia.
// Al hacer click, destello: los haces se encienden y se apagan enseguida, y
// una onda gruesa sale del borde de la lente y cruza la píldora llevando los
// colores que tiene el aro en cada dirección. Fuera del click, la luz no sale
// de la lente. El color sale solo de estos shaders
// (excepción anotada en DESIGN.md §1).

uniform vec2 u_quad;          // tamaño del quad en px (la píldora más un margen para el antialias)
uniform vec2 u_pill;          // tamaño de la píldora en px
uniform vec2 u_lens;          // centro de la lente, desde el centro de la píldora, en px
uniform float u_radius;       // radio de la lente en px
uniform float u_click;        // segundos desde el último click (grande si no hubo)
uniform float u_time;         // segundos del reloj del hero
uniform float u_halo;         // 0 en reposo, 1 con el puntero encima o con foco (con transición)
uniform vec3 u_glass;         // color del vidrio de la píldora (lineal); la lente es más oscura
uniform vec3 u_icon;          // color de la flecha (lineal)
uniform vec3 u_border;        // color del borde de la píldora (lineal)
uniform float u_borderAlpha;  // opacidad del borde de 1 px (0: sin borde)

varying vec2 v_uv;

// ── Valores de los haces (banco de pruebas) ─────────────────
// Haces
const int BEAMS = 2;
const float ANGLE = 22.0;         // inclinación base, en grados
const float ANGLE_SPREAD = 62.0;  // cuánto se separa cada haz de la base, al azar, en grados
const float WOBBLE = 9.0;         // vaivén del ángulo, en grados
const float WIDTH = 15.0;         // ancho del haz, en px
const float SPEED = 0.15;
const float RANGE = 1.5;          // recorrido (1: llega a los bordes de lo que cruzan)
const float SOFT = 0.1;           // 0: borde del haz duro, 1: suave

// Espectro
const float SPECTRUM = 3.3;       // cuánto espectro entra a lo ancho del haz
const float SPEC_VAR = 1.05;      // cuánto cambian los colores al azar
const float SPEC_RATE = 0.7;      // qué tan rápido cambian
const float SPREAD = 0.5;         // corrimiento entre canales, en px
const float CORE = 0.5;           // núcleo blanco
const float CORE_WIDTH = 0.1;     // ancho del núcleo, en anchos de haz
const float STRIPES = 0.24;       // bandas finas
const float STRIPE_GAP = 1.0;     // separación de las bandas, en px

// Brillo
const float FLOOR = 0.65;
const float PEAK = 1.5;
const float FLICKER = 1.5;        // velocidad del titileo
const float PATCH = 18.0;         // tamaño de los tramos que titilan, en px

// Lente (el vidrio por el que se ven los haces)
const float LENS = 0.45;          // aumento
const float LENS_SHIFT = 5.5;     // desvío hacia adentro en el medio del canto, en px
const float LENS_AB = 0.05;       // aberración (cada canal se desvía distinto)

// Rango de color de cada haz, en grados: color central y amplitud. El color
// va y vuelve dentro del rango, sin salirse ni saltar de un extremo al otro.
vec2 hueRange(int i) {
  if (i == 0) return vec2(46.0, 36.0);
  return vec2(287.0, 227.0);
}

#include prism-beams;

const float RING = 5.0;           // grosor del aro, en px
const float LENS_EDGE = 0.2;      // reflejos del vidrio del aro
const float GAIN = 2.35;          // los haces se ven más fuertes en el aro, que es fino
const float LENS_DARK = 0.78;     // la lente es el vidrio de la píldora oscurecido (en sRGB)
const float STROKE = 1.8;         // grosor del trazo de la flecha, en px

// Destello al hacer click (propuesta 1 elegida por el usuario)
const float FLASH = 2.5;          // cuánto más brillan los haces del aro en el click
const float FLASH_DECAY = 5.0;    // qué tan rápido se apagan (por segundo)
const float WAVE_SPEED = 260.0;   // velocidad de la onda, en px por segundo
const float WAVE_WIDTH = 12.0;    // grosor de la onda al salir, en px
const float WAVE_GROW = 30.0;     // cuánto engorda por segundo, en px
const float WAVE_FADE = 2.2;      // qué tan rápido se desvanece (por segundo)
const float WAVE_GAIN = 1.6;      // opacidad de la onda donde el aro tiene luz
const float WAVE_LIFE = 1.6;      // segundos hasta que deja de dibujarse

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

float pill(vec2 p, vec2 extent) {
  float r = extent.y;
  vec2 q = abs(p) - vec2(extent.x - r, 0.0);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// La onda del click en `p` (desde el centro de la píldora; `q` desde el centro
// de la lente, a `d` de su borde): en cada dirección, el color que tiene el
// aro en esa dirección (lineal) y su opacidad.
vec4 clickWave(vec2 p, vec2 q, float d, float boost) {
  float inside = 1.0 - smoothstep(-0.5, 0.5, pill(p, u_pill * 0.5));
  float front = u_radius + u_click * WAVE_SPEED;
  float width = WAVE_WIDTH + u_click * WAVE_GROW;
  float wave = exp(-pow((length(q) - front) / width, 2.0)) * exp(-u_click * WAVE_FADE) * inside * smoothstep(0.0, 2.0, d);
  if (wave < 0.002) return vec4(0.0);
  vec2 normal = normalize(q + vec2(0.0, 1e-4));
  // La luz del aro en el medio de su grosor, en esta dirección.
  vec3 light = lensBeams(normal * (u_radius - RING * 0.5), normal, -RING * 0.5, RING, vec2(u_radius), u_time, boost);
  vec3 add = pow(clamp(light * GAIN, 0.0, 1.0), vec3(1.0 / 2.2));
  float amount = max(add.r, max(add.g, add.b));
  return vec4(pow(add / max(amount, 1e-4), vec3(2.2)), wave * clamp(amount * WAVE_GAIN, 0.0, 1.0));
}

void main() {
  vec2 pill_p = (v_uv - 0.5) * u_quad;
  vec2 p = pill_p - u_lens;
  float d = length(p) - u_radius;
  float disk = 1.0 - smoothstep(-0.5, 0.5, d);
  float boost = 1.0 + 0.3 * u_halo + FLASH * exp(-u_click * FLASH_DECAY);
  vec4 wave = u_click < WAVE_LIFE ? clickWave(pill_p, p, d, boost) : vec4(0.0);
  // Borde de 1 px por dentro del contorno de la píldora, encima de la onda.
  float edgeDist = pill(pill_p, u_pill * 0.5);
  float rim = u_borderAlpha * (1.0 - smoothstep(0.0, 0.5, abs(edgeDist + 0.5) - 0.5));
  wave = vec4(mix(wave.rgb * wave.a, u_border, rim) / max(wave.a + rim * (1.0 - wave.a), 1e-4), wave.a + rim * (1.0 - wave.a));
  if (disk < 0.001 && wave.a < 0.002) discard;

  // La lente y la flecha, en sRGB.
  vec3 lens = pow(u_glass, vec3(1.0 / 2.2)) * LENS_DARK;
  vec3 base = mix(lens, pow(u_icon, vec3(1.0 / 2.2)), arrow(p));

  // El aro: hacia adentro se apaga suave; hacia afuera termina justo en el borde de la lente.
  float ring = smoothstep(-RING - 0.7, -RING + 0.7, d);
  // Posición a través del aro: −1 adentro, 1 afuera.
  float across = clamp((d + RING * 0.5) / (RING * 0.5), -1.0, 1.0);
  vec2 normal = normalize(p + vec2(0.0, 1e-4));

  vec3 light = lensBeams(p, normal, d, RING, vec2(u_radius), u_time, boost);
  // Reflejos finos del vidrio en los dos bordes del aro.
  float edge = (exp(-pow((across - 0.8) / 0.18, 2.0)) + 0.6 * exp(-pow((across + 0.75) / 0.2, 2.0))) * LENS_EDGE;

  // La luz se suma sobre el vidrio (como una pantalla), en sRGB como en el banco de pruebas.
  vec3 add = pow(clamp(light * GAIN + edge, 0.0, 1.0), vec3(1.0 / 2.2));
  vec3 color = mix(base, base + add * (1.0 - base), ring);

  // La lente encima de la onda.
  float alpha = disk + wave.a * (1.0 - disk);
  gl_FragColor = vec4((pow(color, vec3(2.2)) * disk + wave.rgb * wave.a * (1.0 - disk)) / max(alpha, 1e-4), alpha);
  #include <colorspace_fragment>
}
