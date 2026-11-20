// Fondo del sitio, en un solo draw call y fijo a la ventana: papel blanco
// liso. Cada escena del deck es un nivel más hondo, y el paso de una a otra
// se siente como un buceo:
// - partículas finas en tres capas de parallax, que se estiran en estela
//   mientras el deck se mueve;
// - el halo y los tentáculos de las tres medusas del hero. Las campanas son
//   vidrio (<Glass>) y refractan este fondo: el tentáculo nace debajo del vidrio.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment.

uniform vec2 u_size;          // píxeles CSS
uniform float u_depth;        // escena que se ve, con decimales en la transición
uniform float u_speed;        // velocidad del deck, escenas/s (positiva al bajar)
uniform float u_time;         // segundos (solo avanza mientras hay movimiento)
uniform vec3 u_paper;         // color del papel
uniform vec3 u_speck;         // color de las partículas
uniform vec3 u_glow[3];       // color de cada medusa
uniform vec4 u_medusa[3];     // píxeles CSS, origen abajo a la izquierda: x, y del centro, ancho, alto

varying vec2 v_uv;

const int TENTACLES = 5;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Partículas: una por celda. Suben despacio con el tiempo, y con el deck suben
// `parallax` pantallas por escena, como el contenido (las capas cercanas, más
// rápido). En movimiento dejan una estela detrás, como un cometa: la cabeza
// queda donde está la partícula y la cola se aclara hacia atrás.
float specks(vec2 p, float cell, float rise, float parallax) {
  vec2 q = p - vec2(0.0, u_time * rise + u_depth * u_size.y * parallax);
  vec2 id = floor(q / cell);
  vec2 f = fract(q / cell) - 0.5;
  float h = hash(id);
  if (h > 0.3) return 0.0;
  vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  vec2 rel = (f - offset * 0.7) * cell;
  // Lo que se desplaza la partícula en ~1/25 s. Bajando por el deck las
  // partículas suben (u_speed > 0): la cola va abajo (origen abajo a la izquierda).
  float streak = clamp(abs(u_speed) * u_size.y * parallax * 0.04, 0.0, cell * 0.45);
  float back = u_speed >= 0.0 ? 1.0 : -1.0;
  float along = clamp(-rel.y * back, 0.0, streak);
  rel.y += back * along;
  float tail = 1.0 - 0.75 * along / max(streak, 1.0);
  float d = length(rel);
  float size = mix(0.5, 1.3, hash(id + 11.0));
  return smoothstep(size + 0.8, size - 0.4, d) * mix(0.3, 1.0, hash(id + 5.0)) * tail;
}

// Cuánto tiñe una medusa este píxel: el halo bajo la campana y los tentáculos.
float medusa(vec2 p, vec4 m, float seed) {
  vec2 center = m.xy;
  float width = m.z;
  float height = m.w;
  if (width <= 0.0) return 0.0;

  // Halo bajo la campana: el vidrio lo refracta y la tiñe.
  vec2 d = (p - center) / vec2(width * 0.75, height * 0.8);
  float amount = exp(-dot(d, d) * 1.6) * 0.3;

  float bottom = center.y - height * 0.32;
  float len = height * 1.9;
  float t = (bottom - p.y) / len;
  if (t < 0.0 || t > 1.0) return amount;

  for (int k = 0; k < TENTACLES; k++) {
    float fk = float(k);
    float spread = (fk / float(TENTACLES - 1) - 0.5) * width * 0.55;
    float sway = sin(t * 5.0 - u_time * 1.3 + fk * 1.7 + seed) * width * 0.07 * t;
    float drift = sin(u_time * 0.5 + seed) * width * 0.05 * t * t;
    float x = center.x + spread * (1.0 - t * 0.35) + sway + drift;
    float thickness = mix(1.4, 0.5, t);
    float line = smoothstep(thickness + 1.0, thickness - 0.5, abs(p.x - x));
    amount += line * (1.0 - t) * (1.0 - t) * 0.75;
  }
  return min(amount, 1.0);
}

void main() {
  vec2 p = v_uv * u_size;

  vec3 color = u_paper;

  // Tres capas de partículas: lejos, medio y cerca.
  float s = specks(p, 90.0, 6.0, 0.25) * 0.18 + specks(p + 37.0, 150.0, 10.0, 0.6) * 0.26 + specks(p + 91.0, 260.0, 16.0, 1.3) * 0.32;
  color = mix(color, u_speck, s);

  for (int i = 0; i < 3; i++) {
    color = mix(color, u_glow[i], medusa(p, u_medusa[i], float(i) * 2.3));
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
