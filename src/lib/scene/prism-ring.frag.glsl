// Lente del botón del hero: un círculo de vidrio más oscuro que la píldora,
// con una flecha blanca adentro y un aro por el que se ven los haces de luz
// (`prism-beams.glsl`), pegado al borde de la lente. El aro es una varilla de
// vidrio: agranda lo que hay detrás, lo desvía hacia adentro en el medio y
// desvía distinto cada canal (aberración), con dos reflejos finos en sus bordes.
// Hover (o foco): los haces brillan más (HOVER). El vidrio no cambia.
// Al hacer click, destello: los haces se encienden y se apagan enseguida, y
// una onda gruesa sale del borde de la lente y cruza la píldora llevando los
// colores que tiene el aro en cada dirección. Fuera del click, la luz no sale
// de la lente, salvo con los haces en la píldora (PILL_BEAMS, PILL_EDGE). El color sale solo de estos shaders
// (excepción anotada en DESIGN.md §1).
//
// Se dibuja en dos capas: con `u_under`, solo los haces en la píldora, debajo
// del vidrio (el vidrio los refracta, los esmerila y los tiñe); sin él, la
// lente, el aro y la onda, encima del vidrio.

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
uniform bool u_under;         // la capa de debajo del vidrio: solo los haces en la píldora

varying vec2 v_uv;

// ── Valores (uniforms) ─────────────────────────────────────
// Salen de `PRISM_LOOK` (`prism-look.ts`); en desarrollo, del banco de pruebas.
// Haces
uniform int BEAMS;               // cuántos haces (hasta MAX_BEAMS)
const int MAX_BEAMS = 4;
uniform float ANGLE;         // inclinación base, en grados
uniform float ANGLE_SPREAD;  // cuánto se separa cada haz de la base, al azar, en grados
uniform float WOBBLE;         // vaivén del ángulo, en grados
uniform float WIDTH;         // ancho del haz, en px
uniform float SPEED;
uniform float RANGE;          // recorrido (1: llega a los bordes de lo que cruzan)
uniform float SOFT;           // 0: borde del haz duro, 1: suave

// Espectro
uniform float SPECTRUM;       // cuánto espectro entra a lo ancho del haz
uniform float SPEC_VAR;      // cuánto cambian los colores al azar
uniform float SPEC_RATE;      // qué tan rápido cambian
uniform float SPREAD;         // corrimiento entre canales, en px
uniform float CORE;           // núcleo blanco
uniform float CORE_WIDTH;     // ancho del núcleo, en anchos de haz
uniform float STRIPES;       // bandas finas
uniform float STRIPE_GAP;     // separación de las bandas, en px

// Brillo
uniform float FLOOR;
uniform float PEAK;
uniform float FLICKER;        // velocidad del titileo
uniform float PATCH;         // tamaño de los tramos que titilan, en px

// Lente (el vidrio por el que se ven los haces)
uniform float LENS;          // aumento
uniform float LENS_SHIFT;     // desvío hacia adentro en el medio del canto, en px
uniform float LENS_AB;       // aberración (cada canal se desvía distinto)

// Manchas de color que fluyen por el haz (con FLOW_AMT en 0, no se calculan).
#define COLOR_FLOW
uniform float FLOW_AMT;
uniform float FLOW_SCALE;
uniform float FLOW_SPEED;
uniform float FLOW_WARP;
uniform float FLOW_DRIFT;

// Brillo extra de los haces con el puntero encima (0.3 = 30 %).
uniform float HOVER;

// Rango de color de cada haz, en grados: color central y amplitud. El color
// va y vuelve dentro del rango, sin salirse ni saltar de un extremo al otro.
uniform vec2 HUES[MAX_BEAMS];
vec2 hueRange(int i) {
  return HUES[i];
}

#include prism-beams;

uniform float RING;           // grosor del aro, en px
uniform float LENS_EDGE;      // reflejos del vidrio del aro
uniform float GAIN;          // los haces se ven más fuertes en el aro, que es fino
uniform float LENS_DARK;     // la lente es el vidrio de la píldora oscurecido (en sRGB)
uniform float LENS_OPACITY;  // 1: lente opaca; menos, deja ver el vidrio y los haces de atrás
uniform float STROKE;         // grosor del trazo de la flecha, en px

// Destello al hacer click (propuesta 1 elegida por el usuario)
uniform float FLASH;          // cuánto más brillan los haces del aro en el click
uniform float FLASH_DECAY;    // qué tan rápido se apagan (por segundo)
uniform float WAVE_SPEED;   // velocidad de la onda, en px por segundo
uniform float WAVE_WIDTH;    // grosor de la onda al salir, en px
uniform float WAVE_GROW;     // cuánto engorda por segundo, en px
uniform float WAVE_FADE;      // qué tan rápido se desvanece (por segundo)
uniform float WAVE_GAIN;      // opacidad de la onda donde el aro tiene luz
uniform float WAVE_LIFE;      // segundos hasta que deja de dibujarse

// Haces en la píldora: los del aro siguen de largo y cruzan el vidrio (con
// PILL_BEAMS y PILL_EDGE en 0, la luz no sale de la lente).
uniform float PILL_BEAMS;         // luz en el cuerpo de la píldora
uniform float PILL_EDGE;          // luz extra en el bisel, donde el vidrio la junta
uniform float PILL_BEVEL;         // ancho del bisel, en px
uniform float PILL_BEND;          // desvío hacia adentro en el canto, en px
uniform float PILL_ROAM;          // 0: deambulan alrededor de la lente (los del aro); 1: por toda la píldora

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

// Los haces en la píldora, en `pill_p` (desde su centro): los mismos haces
// del aro (centrados en la lente), que siguen de largo detrás del vidrio. En el
// bisel se juntan (más luz) y se desvían hacia adentro, cada canal distinto.
// Color (lineal) y opacidad, como la onda.
vec4 pillBeams(vec2 pill_p, float boost) {
  if (PILL_BEAMS + PILL_EDGE <= 0.0) return vec4(0.0);
  vec2 extent = u_pill * 0.5;
  float d = pill(pill_p, extent);
  float inside = 1.0 - smoothstep(-1.5, -0.5, d);
  if (inside < 0.001) return vec4(0.0);
  // Normal hacia afuera del contorno.
  vec2 e = vec2(0.5, 0.0);
  vec2 normal = normalize(vec2(pill(pill_p + e.xy, extent) - pill(pill_p - e.xy, extent), pill(pill_p + e.yx, extent) - pill(pill_p - e.yx, extent)) + 1e-5);
  // 1 en el canto, 0 pasando el bisel.
  float bevel = pow(1.0 - clamp(-d / max(PILL_BEVEL, 0.5), 0.0, 1.0), 2.0);
  vec2 p = pill_p - u_lens * (1.0 - PILL_ROAM);
  vec2 roam = mix(vec2(u_radius), extent, PILL_ROAM);
  vec3 light;
  for (int ch = 0; ch < 3; ch++) {
    float k = 1.0 + (float(ch) - 1.0) * LENS_AB * 4.0;
    vec3 b = beams(p - normal * PILL_BEND * bevel * k, roam, u_time, boost);
    if (ch == 0) light.r = b.r;
    else if (ch == 1) light.g = b.g;
    else light.b = b.b;
  }
  vec3 add = pow(clamp(light * (PILL_BEAMS + PILL_EDGE * bevel), 0.0, 1.0), vec3(1.0 / 2.2));
  float amount = max(add.r, max(add.g, add.b));
  return vec4(pow(add / max(amount, 1e-4), vec3(2.2)), clamp(amount, 0.0, 1.0) * inside);
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
  float boost = 1.0 + HOVER * u_halo + FLASH * exp(-u_click * FLASH_DECAY);
  // La capa de debajo del vidrio: solo los haces en la píldora.
  if (u_under) {
    vec4 glow = pillBeams(pill_p, boost);
    if (glow.a < 0.002) discard;
    gl_FragColor = glow;
    #include <colorspace_fragment>
    return;
  }
  vec4 wave = u_click < WAVE_LIFE ? clickWave(pill_p, p, d, boost) : vec4(0.0);
  // Borde de 1 px por dentro del contorno de la píldora, encima de la onda.
  float edgeDist = pill(pill_p, u_pill * 0.5);
  float rim = u_borderAlpha * (1.0 - smoothstep(0.0, 0.5, abs(edgeDist + 0.5) - 0.5));
  wave = vec4(mix(wave.rgb * wave.a, u_border, rim) / max(wave.a + rim * (1.0 - wave.a), 1e-4), wave.a + rim * (1.0 - wave.a));
  if (disk < 0.001 && wave.a < 0.002) discard;

  // La lente y la flecha, en sRGB. La flecha va entera aunque la lente sea translúcida.
  vec3 lens = pow(u_glass, vec3(1.0 / 2.2)) * LENS_DARK;
  float icon = arrow(p);
  vec3 base = mix(lens, pow(u_icon, vec3(1.0 / 2.2)), icon);
  float solid = LENS_OPACITY + icon * (1.0 - LENS_OPACITY);

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
  // Donde la lente es translúcida, la luz del aro va sola sobre el vidrio de
  // atrás (su color, con la opacidad de su canal más fuerte). Con la lente
  // opaca queda igual que siempre.
  float glow = ring * max(add.r, max(add.g, add.b));
  float lensAlpha = solid + glow * (1.0 - solid);
  color = (color * solid + add * ring * (1.0 - solid)) / max(lensAlpha, 1e-4);
  float cover = disk * lensAlpha;

  // La lente encima de la onda.
  float alpha = cover + wave.a * (1.0 - cover);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4((pow(color, vec3(2.2)) * cover + wave.rgb * wave.a * (1.0 - cover)) / max(alpha, 1e-4), alpha);
  #include <colorspace_fragment>
}
