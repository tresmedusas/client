// Bordes de arriba y de abajo de la ventana: el contenido que entra en la
// franja se dobla hacia el borde como sobre un cilindro, se abre hacia los
// costados, se separa en canales (aberración cromática), se difumina y, pegado
// al borde, ondula como líquido. Todo crece de forma continua desde 0 donde
// empieza la franja: no hay contorno ni canto, solo la deformación.
//
// Muestrea la captura de fondo de Essentia de su nivel (todo lo que hay
// detrás: el contenido y sus vidrios, sin la navbar). La captura guarda los
// colores ya codificados para la pantalla, así que se escriben tal cual (como
// hace <Glass>), sin colorspace_fragment.

uniform sampler2D u_background;
uniform vec2 u_resolution;    // píxeles físicos
uniform float u_dpr;
uniform float u_height;       // alto de cada franja (px CSS)
uniform float u_curve;        // ángulo (rad) del cilindro en el borde: cuánto se comprime hacia él
uniform float u_spread;       // cuánto se abre hacia los costados en el borde (0.4 = ×1.4)
uniform float u_aberration;   // diferencia de deformación entre canales (fracción)
uniform float u_split;        // separación vertical de canales en el borde (px CSS)
uniform float u_blur;         // radio del blur en el borde (px CSS)
uniform float u_ripple;       // amplitud de la ondulación en el borde (px CSS)
uniform float u_wavelength;   // largo de onda de la ondulación (px CSS)
uniform float u_phase;        // fase de la ondulación (rad)

const int TAPS = 10;
const float GOLDEN = 2.39996323;

// Ruido por píxel (interleaved gradient noise): gira el patrón del blur para
// que no se vean anillos.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// Dónde muestrea el píxel `p` (px CSS, origen abajo a la izquierda) un canal
// con deformación `k` (1 = la nominal). `t` va de 0 donde empieza la franja a
// 1 en el borde; `toward` es +1 si el borde es el de arriba y -1 si es el de abajo.
vec2 warp(vec2 p, vec2 size, float t, float toward, float k) {
  // Cilindro: la pantalla muestra R·sin θ y el contenido recorre R·θ. Con
  // R = h / sin α, el borde (t = 1) cae en θ = α. Derivada 1 en t = 0: empalma
  // sin salto con lo que está fuera de la franja.
  // Hasta casi π/2: más allá el cilindro daría la vuelta.
  float a = min(u_curve * k, 1.5);
  float s = a > 1e-3 ? u_height * asin(clamp(t * sin(a), -1.0, 1.0)) / sin(a) : u_height * t;
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

// Muestra difuminada alrededor de `src` (px CSS) con radio `radius`.
vec4 blurred(vec2 src, float radius, float spin) {
  vec2 toUV = u_dpr / u_resolution;
  if (radius < 0.5) return texture2D(u_background, src * toUV);
  vec4 sum = vec4(0.0);
  for (int i = 0; i < TAPS; i++) {
    float fi = float(i) + 0.5;
    float r = radius * sqrt(fi / float(TAPS));
    float ang = fi * GOLDEN + spin;
    sum += texture2D(u_background, (src + r * vec2(cos(ang), sin(ang))) * toUV);
  }
  return sum / float(TAPS);
}

void main() {
  vec2 size = u_resolution / u_dpr;
  vec2 p = gl_FragCoord.xy / u_dpr;

  float toTop = size.y - p.y;
  float toBottom = p.y;
  float d = min(toTop, toBottom);
  if (d >= u_height) discard;

  float toward = toTop < toBottom ? 1.0 : -1.0;
  float t = 1.0 - d / u_height;
  float t2 = t * t;

  float radius = u_blur * t2;
  float spin = ign(gl_FragCoord.xy) * 6.2831853;
  // Cada canal con su deformación y corrido hacia o desde el borde: el rojo
  // se abre menos, el azul más.
  vec2 shift = vec2(0.0, toward * u_split * t2);
  float r = blurred(warp(p, size, t, toward, 1.0 - u_aberration) - shift, radius, spin).r;
  float g = blurred(warp(p, size, t, toward, 1.0), radius, spin).g;
  float b = blurred(warp(p, size, t, toward, 1.0 + u_aberration) + shift, radius, spin).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
