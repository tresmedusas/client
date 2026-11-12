// Fondo marino de la landing, en un solo draw call y fijo a la ventana:
// - degradado de la superficie al abismo, que se oscurece al bajar (scroll);
// - haces de luz desde la superficie, que se apagan con la profundidad;
// - nieve marina: partículas que suben despacio, con parallax;
// - el brillo y los tentáculos de las tres medusas. Las campanas son vidrio
//   (<Glass>) y refractan este fondo: el tentáculo nace debajo del vidrio.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment; el
// dither va después, en sRGB, para que el degradado oscuro no haga bandas.

uniform vec2 u_size;          // píxeles CSS
uniform float u_scroll;       // píxeles CSS que bajó la página
uniform float u_time;         // segundos (solo avanza mientras hay movimiento)
uniform vec3 u_surface;       // color cerca de la superficie
uniform vec3 u_abyss;         // color del fondo
uniform vec3 u_light;         // color de los haces y la nieve
uniform vec3 u_glow[3];       // color de cada medusa
uniform vec3 u_haze;          // brillo bioluminiscente del fondo, al bajar
uniform vec4 u_medusa[3];     // píxeles CSS, origen abajo a la izquierda: x, y del centro, ancho, alto

varying vec2 v_uv;

const float DEPTH_FADE = 1800.0;   // píxeles CSS de scroll hasta el abismo
const int TENTACLES = 5;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Haces de luz inclinados que bajan desde arriba de la ventana.
float rays(vec2 p) {
  float x = p.x + (u_size.y - p.y) * 0.32;
  float a = noise(vec2(x * 0.006 + u_time * 0.05, 0.0));
  float b = noise(vec2(x * 0.013 - u_time * 0.04, 7.0));
  float shafts = pow(a * 0.65 + b * 0.35, 3.0);
  float fromTop = smoothstep(u_size.y * 1.1, u_size.y * 0.15, u_size.y - p.y + u_scroll * 0.6);
  return shafts * fromTop;
}

// Nieve marina: una partícula por celda, que sube con el tiempo y baja con el scroll.
float snow(vec2 p, float cell, float speed, float parallax) {
  vec2 q = p + vec2(0.0, -u_time * speed + u_scroll * parallax);
  vec2 id = floor(q / cell);
  vec2 f = fract(q / cell) - 0.5;
  float h = hash(id);
  if (h > 0.35) return 0.0;
  vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  float d = length((f - offset * 0.7) * cell);
  float size = mix(0.6, 1.6, hash(id + 11.0));
  return smoothstep(size + 0.8, size - 0.4, d) * mix(0.25, 0.8, hash(id + 5.0));
}

// Brillo y tentáculos de una medusa.
vec3 medusa(vec2 p, vec4 m, vec3 glow, float seed) {
  vec2 center = m.xy;
  float width = m.z;
  float height = m.w;
  if (width <= 0.0) return vec3(0.0);

  // Halo bajo la campana: el vidrio lo refracta y la hace brillar.
  vec2 d = (p - center) / vec2(width * 0.75, height * 0.8);
  vec3 color = glow * exp(-dot(d, d) * 1.6) * 0.22;

  float bottom = center.y - height * 0.32;
  float len = height * 1.9;
  float t = (bottom - p.y) / len;
  if (t < 0.0 || t > 1.0) return color;

  for (int k = 0; k < TENTACLES; k++) {
    float fk = float(k);
    float spread = (fk / float(TENTACLES - 1) - 0.5) * width * 0.55;
    float sway = sin(t * 5.0 - u_time * 1.3 + fk * 1.7 + seed) * width * 0.07 * t;
    float drift = sin(u_time * 0.5 + seed) * width * 0.05 * t * t;
    float x = center.x + spread * (1.0 - t * 0.35) + sway + drift;
    float thickness = mix(1.6, 0.5, t);
    float line = smoothstep(thickness + 1.0, thickness - 0.5, abs(p.x - x));
    color += glow * line * (1.0 - t) * (1.0 - t) * 0.55;
  }
  return color;
}

float interleavedNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 p = v_uv * u_size;

  float depth = clamp((u_scroll + (u_size.y - p.y) * 0.5) / DEPTH_FADE, 0.0, 1.0);
  vec3 color = mix(u_surface, u_abyss, smoothstep(0.0, 1.0, depth));

  color += u_light * rays(p) * 0.16;

  // Más abajo, donde ya no llega la luz de la superficie, una bruma tenue
  // que sube desde el borde inferior y se mueve con el scroll.
  float haze = noise(vec2(p.x * 0.0025, (p.y - u_scroll * 0.3) * 0.002)) * exp(-p.y / (u_size.y * 0.55));
  color += u_haze * haze * smoothstep(0.2, 0.9, depth) * 0.09;
  color += u_light * (snow(p, 90.0, 6.0, 0.25) * 0.22 + snow(p + 37.0, 150.0, 10.0, 0.5) * 0.3);

  for (int i = 0; i < 3; i++) {
    color += medusa(p, u_medusa[i], u_glow[i], float(i) * 2.3);
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (interleavedNoise(gl_FragCoord.xy) - 0.5) / 255.0;
}
