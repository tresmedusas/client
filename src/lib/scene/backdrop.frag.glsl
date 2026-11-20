// Fondo del sitio, en un solo draw call y fijo a la ventana: papel blanco
// liso, con el halo y los tentáculos de las tres medusas del hero. Las campanas
// son vidrio (<Glass>) y refractan este fondo: el tentáculo nace debajo del vidrio.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment.

uniform vec2 u_size;          // píxeles CSS
uniform float u_time;         // segundos (solo avanza mientras hay movimiento)
uniform vec3 u_paper;         // color del papel
uniform vec3 u_glow[3];       // color de cada medusa
uniform vec4 u_medusa[3];     // píxeles CSS, origen abajo a la izquierda: x, y del centro, ancho, alto

varying vec2 v_uv;

const int TENTACLES = 5;

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

  for (int i = 0; i < 3; i++) {
    color = mix(color, u_glow[i], medusa(p, u_medusa[i], float(i) * 2.3));
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
