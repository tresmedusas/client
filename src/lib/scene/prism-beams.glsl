// Haces de luz iridiscentes, compartidos por el botón del hero
// (`prism-ring.frag.glsl`) y la franja de arriba del hero (`prism-edge.frag.glsl`).
//
// Tres franjas de luz que cruzan lo que iluminan, cada una por su cuenta: su
// ángulo, su ancho, su velocidad y su vaivén salen de su propia semilla, y
// deambulan (van y vuelven al azar) sin coordinarse. Cada haz lleva el
// espectro a lo ancho, con dispersión (los canales corridos), bandas finas de
// difracción y un núcleo blanco. Cada haz tiene su rango de colores
// (`hueRange`); dentro de él, sus colores y el ancho de su arcoíris cambian al
// azar con el tiempo, y su brillo titila por tramos a lo largo. Se ven a
// través de un canto de vidrio que hace de lente (`lensBeams`).
//
// Los valores no están acá: cada shader que incluye este archivo define antes
// sus constantes (BEAMS, ANGLE, ANGLE_SPREAD, WOBBLE, WIDTH, SPEED, RANGE,
// SOFT, SPECTRUM, SPEC_VAR, SPEC_RATE, SPREAD, CORE, CORE_WIDTH, STRIPES,
// STRIPE_GAP, FLOOR, PEAK, FLICKER, PATCH, LENS, LENS_SHIFT, LENS_AB) y su
// `hueRange`, con lo que el usuario eligió en el banco de pruebas para cada uno.
// Con `#define NO_FLICKER` antes del include, el brillo no titila: cada haz
// queda parejo, con brillo 1 (y FLOOR, PEAK, FLICKER y PATCH no se usan).

const float PI = 3.14159265;
const float TAU = 6.2831853;

vec3 spectrum(float h) {
  return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
}

float hash1(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}

// Ruido suave de 0 a 1.
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f));
}

float noise2(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash1(i.x + i.y * 57.0);
  float b = hash1(i.x + 1.0 + i.y * 57.0);
  float c = hash1(i.x + (i.y + 1.0) * 57.0);
  float e = hash1(i.x + 1.0 + (i.y + 1.0) * 57.0);
  return mix(mix(a, b, u.x), mix(c, e, u.x), u.y);
}


// Perfil del haz a `x` px de su centro.
float profile(float x, float w) {
  return exp(-pow(abs(x / w), mix(4.0, 1.2, SOFT)));
}

// La luz de todos los haces en `p` (lineal, sin el vidrio). `extent` es la
// mitad del tamaño de lo que cruzan (hasta dónde deambulan) y `boost`
// multiplica su brillo.
vec3 beams(vec2 p, vec2 extent, float t, float boost) {
  vec3 light = vec3(0.0);
  for (int i = 0; i < BEAMS; i++) {
    float seed = float(i) * 17.31 + 3.0;
    // Cada haz con su velocidad, ángulo, vaivén y ancho.
    float pace = 0.55 + 0.9 * hash1(seed + 2.0);
    float base = ANGLE + (hash1(seed + 4.0) * 2.0 - 1.0) * ANGLE_SPREAD;
    float angle = radians(base + WOBBLE * (noise(t * (0.25 + 0.4 * hash1(seed + 8.0)) + seed) * 2.0 - 1.0));
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 normal = vec2(-dir.y, dir.x);
    float w = WIDTH * (0.65 + 0.7 * hash1(seed + 6.0));
    float u = dot(p, normal);
    float v = dot(p, dir);
    // Deambula: va y vuelve al azar a lo ancho de `extent`.
    float reach = abs(extent.x * normal.x) + abs(extent.y * normal.y) + w;
    float tt = t * SPEED * pace;
    float pos = (noise(tt + seed) * 2.0 - 1.0 + 0.5 * (noise(tt * 2.7 + 5.0 + seed) - 0.5)) * reach * 0.75 * RANGE;
    float x = u - pos;
#ifdef NO_FLICKER
    float field = 1.0;
    float level = boost;
#else
    // Titila por tramos a lo largo del haz.
    float field = 0.65 * noise2(vec2(v / PATCH + seed, t * FLICKER * pace)) + 0.35 * noise2(vec2(v / (PATCH * 0.35) + 31.0 + seed, t * FLICKER * 2.0 * pace));
    float level = mix(FLOOR, PEAK, smoothstep(0.25, 0.85, field)) * boost;
#endif
    // Espectro a lo ancho, con los canales corridos; sus colores y su ancho cambian al azar.
    vec3 cover = vec3(profile(x - SPREAD, w), profile(x, w), profile(x + SPREAD, w));
    float tr = t * SPEC_RATE;
    float span = SPECTRUM * mix(1.0, 0.3 + 1.4 * noise(tr * 0.9 + seed + 40.0), min(SPEC_VAR, 1.0));
    float raw = x / w * 0.5 * span + SPEC_VAR * (noise(tr + seed * 3.0) * 1.6 + 0.5 * noise(tr * 2.3 + seed)) + 0.25 * SPEC_VAR * noise2(vec2(v / 30.0 + seed, tr * 1.5));
    // Dentro del rango del haz, de ida y vuelta.
    float bounce = abs(fract(raw * 0.5) * 2.0 - 1.0);
    vec2 range = hueRange(i);
    float hue = (range.x + (bounce - 0.5) * range.y) / 360.0;
    float stripes = 1.0 - STRIPES + STRIPES * sin(x / STRIPE_GAP * TAU);
    vec3 iris = spectrum(hue) * stripes;
    float core = profile(x, w * CORE_WIDTH) * CORE * smoothstep(0.5, 0.85, field + 0.25);
    light += (iris * cover + vec3(core)) * level;
  }
  return light;
}

// Los haces vistos a través de un canto de vidrio de `thickness` px cuyo
// borde de afuera está a `d = 0` (`d` < 0 adentro) y cuya normal hacia
// afuera es `normal`. Cada canal mira los haces en otro punto: más cerca del
// centro del canto (aumento) y corrido hacia adentro en el medio (desvío).
vec3 lensBeams(vec2 p, vec2 normal, float d, float thickness, vec2 extent, float t, float boost) {
  float center = -thickness * 0.5;
  float across = clamp((d - center) / (thickness * 0.5), -1.0, 1.0);
  float bulge = 1.0 - across * across;
  vec3 light;
  for (int ch = 0; ch < 3; ch++) {
    float k = 1.0 + (float(ch) - 1.0) * LENS_AB * 0.6;
    float m = clamp(LENS * k, 0.0, 0.95);
    float seen = center + (d - center) * (1.0 - m) - LENS_SHIFT * k * bulge;
    vec3 b = beams(p + normal * (seen - d), extent, t, boost);
    if (ch == 0) light.r = b.r;
    else if (ch == 1) light.g = b.g;
    else light.b = b.b;
  }
  return light;
}
