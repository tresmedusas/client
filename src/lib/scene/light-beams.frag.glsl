// Los haces de luz del botón del hero (`prism-beams.glsl`), sueltos en un
// rectángulo redondeado: deambulan por el rectángulo y, en su bisel, se juntan
// (más luz) y se desvían hacia el canto, cada canal distinto, como en la píldora
// del botón. Con `u_top`, el rectángulo es una franja bajo un borde de arriba:
// el bisel es solo ese borde y la luz se apaga hacia abajo
// (`FIELD_FADE`); los haces deambulan dentro de la franja. Sobre el papel se
// pintan con su color y la opacidad de su canal más fuerte: el núcleo blanco no
// se ve, el espectro sí. El color sale solo de este shader (excepción anotada en
// DESIGN.md §1).

uniform vec2 u_size;          // tamaño del rectángulo en px
uniform float u_radius;       // radio de las esquinas en px
uniform float u_time;         // segundos del reloj de los haces
uniform float u_boost;        // multiplica el brillo de los haces
uniform float u_top;          // 1: franja bajo el borde de arriba; 0: todo el contorno

varying vec2 v_uv;

// ── Haces (uniforms): salen de `BeamLook` (`beam-look.ts`) ─────
uniform int BEAMS;
const int MAX_BEAMS = 4;
uniform float ANGLE;
uniform float ANGLE_SPREAD;
uniform float WOBBLE;
uniform float WIDTH;
uniform float SPEED;
uniform float RANGE;
uniform float SOFT;
uniform float SPECTRUM;
uniform float SPEC_VAR;
uniform float SPEC_RATE;
uniform float SPREAD;
uniform float CORE;
uniform float CORE_WIDTH;
uniform float STRIPES;
uniform float STRIPE_GAP;
uniform float FLOOR;
uniform float PEAK;
uniform float FLICKER;
uniform float PATCH;

#define COLOR_FLOW
uniform float FLOW_AMT;
uniform float FLOW_SCALE;
uniform float FLOW_SPEED;
uniform float FLOW_WARP;
uniform float FLOW_DRIFT;

// La lente del aro no se usa acá (`lensBeams` queda sin llamar).
const float LENS = 0.0;
const float LENS_SHIFT = 0.0;
const float LENS_AB = 0.0;

uniform vec2 HUES[MAX_BEAMS];
vec2 hueRange(int i) {
  return HUES[i];
}

#include prism-beams;

// ── El campo de luz en el rectángulo ──────────────────────────
uniform float FIELD_LIGHT;    // luz de los haces en el cuerpo
uniform float FIELD_EDGE;     // luz extra en el bisel, donde el vidrio la junta
uniform float FIELD_BEVEL;    // ancho del bisel, en px
uniform float FIELD_BEND;     // desvío hacia adentro en el canto, en px
uniform float FIELD_AB;       // aberración del desvío (cada canal distinto)
uniform float FIELD_OPACITY;  // opacidad de toda la luz
uniform float FIELD_SCALE;    // escala del dibujo de los haces (2: todo el doble de grande)
uniform float FIELD_FADE;     // con u_top, cuánto se apaga la franja hacia abajo

float box(vec2 p, vec2 extent, float r) {
  vec2 q = abs(p) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 extent = u_size * 0.5;
  vec2 p = (v_uv - 0.5) * u_size;
  float r = min(u_radius, min(extent.x, extent.y));
  // En la franja, el rectángulo sigue hacia abajo: solo se redondean las esquinas de arriba.
  vec2 reach = vec2(0.0, u_top * u_size.y);
  float d = box(p + reach, extent + reach, r);
  float inside = 1.0 - smoothstep(-1.5, -0.5, d);
  if (inside < 0.001) discard;
  // Normal hacia afuera del contorno; en la franja, hacia arriba.
  vec2 e = vec2(0.5, 0.0);
  vec2 normal = normalize(vec2(box(p + reach + e.xy, extent + reach, r) - box(p + reach - e.xy, extent + reach, r), box(p + reach + e.yx, extent + reach, r) - box(p + reach - e.yx, extent + reach, r)) + 1e-5);
  // Distancia al canto: en la franja, al borde de arriba.
  float depth = mix(-d, extent.y - p.y, u_top);
  // 1 en el canto, 0 pasando el bisel.
  float bevel = pow(1.0 - clamp(depth / max(FIELD_BEVEL, 0.5), 0.0, 1.0), 2.0);
  // La franja se apaga hacia abajo.
  float fall = 1.0 - u_top * FIELD_FADE * smoothstep(0.0, 1.0, depth / max(u_size.y, 1.0));
  float s = max(FIELD_SCALE, 0.05);
  vec3 light;
  for (int ch = 0; ch < 3; ch++) {
    float k = 1.0 + (float(ch) - 1.0) * FIELD_AB;
    vec3 b = beams((p - normal * FIELD_BEND * bevel * k) / s, extent / s, u_time, u_boost);
    if (ch == 0) light.r = b.r;
    else if (ch == 1) light.g = b.g;
    else light.b = b.b;
  }
  vec3 add = pow(clamp(light * (FIELD_LIGHT * fall + FIELD_EDGE * bevel), 0.0, 1.0), vec3(1.0 / 2.2));
  float amount = max(add.r, max(add.g, add.b));
  float alpha = clamp(amount, 0.0, 1.0) * inside * FIELD_OPACITY;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(pow(add / max(amount, 1e-4), vec3(2.2)), alpha);
  #include <colorspace_fragment>
}
