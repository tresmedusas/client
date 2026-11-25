// Los bordes por donde entra y sale el contenido con el scroll (arriba y
// abajo en la home; izquierda y derecha en el showcase, donde los casos pasan
// en fila: `u_axis`): el contenido que entra en la franja se deforma hacia el borde, se abre hacia los costados, se separa en
// canales (aberración cromática), se difumina y, pegado al borde, ondula como
// líquido. Todo crece de forma continua desde 0 donde empieza la franja: no
// hay contorno ni canto, solo la deformación.
//
// La deformación hacia el borde es de dos tipos (ver `edge-warp.ts`): en la
// home, el contenido se dobla como sobre un cilindro (se comprime); en el
// showcase, se estira hacia el borde, como si el borde se lo tragara.
//
// Además, los otros dos bordes (izquierda y derecha con el scroll vertical;
// arriba y abajo en el showcase) pueden reflejar lo que hay hacia el centro: como un espejo curvo, cada uno muestra el contenido
// que está más adentro de la ventana, difuminado, abierto a lo alto y con el
// croma subido, mezclado por multiplicación: el papel blanco no se ve en el
// reflejo, el color de los casos sí. No ocupa todo el borde: es un óvalo en
// el centro de cada uno de esos bordes, que se enciende cuando un caso pasa por el
// centro de la ventana (`u_reflectFocus`).
//
// Todo se calcula en un marco donde la «y» es el eje del scroll: con el eje
// horizontal, x e y se intercambian al entrar y al muestrear (`orient`).
//
// Muestrea la captura de fondo de Essentia de su nivel (todo lo que hay
// detrás: el contenido y sus vidrios, sin la navbar). La captura guarda los
// colores ya codificados para la pantalla, así que se escriben tal cual (como
// hace <Glass>), sin colorspace_fragment.

uniform sampler2D u_background;
uniform vec2 u_resolution;    // píxeles físicos
uniform float u_dpr;
uniform float u_axis;         // eje del scroll: 0 = vertical (franjas arriba y abajo), 1 = horizontal (a los costados)
uniform float u_height;       // alto de cada franja (px CSS), medido hacia adentro desde su borde
uniform float u_curve;        // ángulo (rad) del cilindro en el borde: cuánto se comprime hacia él
uniform float u_stretch;      // en vez del cilindro, cuánto se estira hacia el borde (0 = nada)
uniform float u_spread;       // cuánto se abre hacia los costados en el borde (0.4 = ×1.4)
uniform float u_aberration;   // diferencia de deformación entre canales (fracción)
uniform float u_split;        // separación vertical de canales en el borde (px CSS)
uniform float u_blur;         // radio del blur en el borde (px CSS)
uniform float u_ripple;       // amplitud de la ondulación en el borde (px CSS)
uniform float u_wavelength;   // largo de onda de la ondulación (px CSS)
uniform float u_phase;        // fase de la ondulación (rad)
uniform float u_reflect;      // fuerza del reflejo (0 = sin reflejo)
uniform float u_reflectWidth;   // grosor de la franja del reflejo, medido hacia adentro desde su borde (px CSS)
uniform float u_reflectSpan;    // medio largo del óvalo del reflejo, a lo largo de su borde y centrado (px CSS)
uniform float u_reflectFocus;   // cuánto se enciende: 1 con un caso en el centro de la ventana
uniform float u_reflectReach;   // hasta dónde llega lo reflejado, desde el borde de la franja (px CSS)
uniform float u_reflectBlur;    // radio del blur del reflejo (px CSS)
uniform float u_reflectWiden;   // cuánto más alto se ve el reflejo
uniform float u_reflectSaturation; // croma extra del reflejo

const int TAPS = 12;
const int REFLECT_TAPS = 20;
const float GOLDEN = 2.39996323;

// Del marco del scroll a la pantalla y al revés (es su propia inversa).
vec2 orient(vec2 v) {
  return u_axis > 0.5 ? v.yx : v;
}

// Ruido por píxel (interleaved gradient noise): gira el patrón del blur para
// que no se vean anillos.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// Dónde muestrea el píxel `p` (px CSS en el marco del scroll) un canal
// con deformación `k` (1 = la nominal). `t` va de 0 donde empieza la franja a
// 1 en el borde; `toward` es +1 si el borde es el de arriba y -1 si es el de abajo.
vec2 warp(vec2 p, vec2 size, float t, float toward, float k) {
  float s;
  if (u_stretch > 0.0) {
    // Estirado: s = h·(t − c·t²/2). Derivada 1 en t = 0 (empalma sin salto
    // con lo de afuera) y 1 − c en el borde: cada px de contenido ocupa
    // 1/(1 − c) px de pantalla. Lo que queda más allá de s(1) no se ve: se
    // lo tragó el borde.
    float c = min(u_stretch * k, 0.95);
    s = u_height * (t - 0.5 * c * t * t);
  } else {
    // Cilindro: la pantalla muestra R·sin θ y el contenido recorre R·θ. Con
    // R = h / sin α, el borde (t = 1) cae en θ = α. Derivada 1 en t = 0.
    // Hasta casi π/2: más allá el cilindro daría la vuelta.
    float a = min(u_curve * k, 1.5);
    s = a > 1e-3 ? u_height * asin(clamp(t * sin(a), -1.0, 1.0)) / sin(a) : u_height * t;
  }
  float start = toward > 0.0 ? size.y - u_height : u_height;
  float y = start + toward * s;

  // Costados: zoom horizontal desde el centro, que crece como t² (sin quiebre
  // donde empieza la franja).
  float open = 1.0 + u_spread * k * t * t;
  float x = size.x * 0.5 + (p.x - size.x * 0.5) / open;

  // Líquido: solo pegado al borde.
  float liquid = smoothstep(0.45, 1.0, t);
  float w = 6.2831853 / u_wavelength;
  x += u_ripple * liquid * sin(p.y * w * 1.7 + u_phase * 1.3 + p.x * w * 0.4);
  y += u_ripple * liquid * sin(p.x * w + u_phase);

  return vec2(x, y);
}

// Muestra difuminada alrededor de `src` (px CSS en el marco del scroll) con radio `radius`.
vec4 blurred(vec2 src, float radius, float spin) {
  vec2 toUV = u_dpr / u_resolution;
  if (radius < 0.5) return texture2D(u_background, orient(src) * toUV);
  vec4 sum = vec4(0.0);
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i) + 0.5;
    float r = radius * sqrt(fi / float(TAPS));
    float ang = fi * GOLDEN + spin;
    sum += texture2D(u_background, orient(src + r * vec2(cos(ang), sin(ang))) * toUV);
  }
  return sum / float(TAPS);
}

// Como `blurred`, con más muestras: el reflejo es muy ancho.
vec3 wide(vec2 src, float radius, float spin) {
  vec2 toUV = u_dpr / u_resolution;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < REFLECT_TAPS; i++) {
    float fi = float(i) + 0.5;
    float r = radius * sqrt(fi / float(REFLECT_TAPS));
    float ang = fi * GOLDEN + spin;
    // Elipse: el reflejo se abre más a lo largo de su borde que hacia adentro.
    vec2 offset = r * vec2(cos(ang) * 0.6, sin(ang) * 1.6);
    sum += texture2D(u_background, clamp(orient(src + offset) * toUV, 0.0, 1.0)).rgb;
  }
  return sum / float(REFLECT_TAPS);
}

void main() {
  // En el marco del scroll: «arriba» y «abajo» son los bordes por donde entra
  // el contenido; «izquierda» y «derecha», los del reflejo.
  vec2 size = orient(u_resolution / u_dpr);
  vec2 p = orient(gl_FragCoord.xy / u_dpr);

  float toTop = size.y - p.y;
  float toBottom = p.y;
  float d = min(toTop, toBottom);
  float toLeft = p.x;
  float toRight = size.x - p.x;
  float side = min(toLeft, toRight);
  // -1 a 1 a lo alto del óvalo del reflejo; afuera, más de 1.
  float vy = u_reflectSpan > 0.0 ? (p.y - size.y * 0.5) / u_reflectSpan : 2.0;
  bool inReflect = u_reflect > 0.0 && u_reflectFocus > 0.0 && side < u_reflectWidth && abs(vy) < 1.0;
  if (d >= u_height && !inReflect) discard;

  float toward = toTop < toBottom ? 1.0 : -1.0;
  float spin = ign(gl_FragCoord.xy) * 6.2831853;

  vec3 color;
  if (d < u_height) {
    float t = 1.0 - d / u_height;
    float t2 = t * t;
    float radius = u_blur * t2;
    // Cada canal con su deformación y corrido hacia o desde el borde: el rojo
    // se abre menos, el azul más.
    vec2 shift = vec2(0.0, toward * u_split * t2);
    float r = blurred(warp(p, size, t, toward, 1.0 - u_aberration) - shift, radius, spin).r;
    float g = blurred(warp(p, size, t, toward, 1.0), radius, spin).g;
    float b = blurred(warp(p, size, t, toward, 1.0 + u_aberration) + shift, radius, spin).b;
    color = vec3(r, g, b);
  } else {
    color = texture2D(u_background, gl_FragCoord.xy / u_resolution).rgb;
  }

  if (inReflect) {
    // El óvalo: la franja es más angosta lejos del centro (como una elipse
    // pegada al borde) y se apaga suave hacia arriba y hacia abajo.
    float across = u_reflectWidth * sqrt(1.0 - vy * vy);
    // 0 donde empieza la franja del reflejo, 1 en el borde.
    float tr = clamp(1.0 - side / max(across, 1.0), 0.0, 1.0);
    float along = 1.0 - smoothstep(0.35, 1.0, abs(vy));
    // +1 si el borde es el derecho, -1 si es el izquierdo.
    float sideward = toRight < toLeft ? 1.0 : -1.0;
    // Espejo: cerca de donde empieza la franja se ve lo que está justo más
    // adentro; pegado al borde, lo que está más lejos (como mucho, el centro).
    float reach = u_reflectWidth + tr * min(u_reflectReach, max(0.0, size.x * 0.5 - u_reflectWidth));
    float x = sideward > 0.0 ? size.x - reach : reach;
    float y = size.y * 0.5 + (p.y - size.y * 0.5) / u_reflectWiden;
    vec3 seen = wide(vec2(x, y), u_reflectBlur * (0.6 + 0.4 * tr), spin);
    float luma = dot(seen, vec3(0.2126, 0.7152, 0.0722));
    seen = clamp(mix(vec3(luma), seen, 1.0 + u_reflectSaturation), 0.0, 1.0);
    // Crece hacia el borde, sin canto donde empieza.
    float m = u_reflect * u_reflectFocus * along * smoothstep(0.0, 1.0, tr);
    color *= mix(vec3(1.0), seen, m);
  }

  gl_FragColor = vec4(color, 1.0);
}
