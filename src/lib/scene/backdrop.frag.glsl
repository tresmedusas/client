// Fondo del sitio, en un solo draw call y fijo a la ventana: papel blanco
// liso, con las medusas del hero impresas con los grises de su dibujo
// posterizado (static/brand/medusa.svg). La campana late y los tentáculos se
// mecen deformando la lectura de la textura, no la geometría.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment.

uniform vec2 u_size;          // píxeles CSS
uniform float u_time;         // segundos (solo avanza mientras hay movimiento)
uniform vec3 u_paper;         // color del papel
uniform sampler2D u_medusaMap; // dibujo de la medusa, en sRGB (se lee en lineal): grises y silueta en el alfa
uniform float u_medusaReady;  // 0 hasta que el dibujo carga
// Las medusas del hero, de atrás hacia adelante (igual que MEDUSA_COUNT en layout.ts).
#define MEDUSA_COUNT 3
uniform vec4 u_medusa[MEDUSA_COUNT];     // píxeles CSS, origen abajo a la izquierda: x, y del centro, ancho, alto (ancho 0 = no hay)
uniform vec4 u_medusaLook[MEDUSA_COUNT]; // adelanto del reloj (s), opacidad relativa, espejo (−1 o 1), sin uso

varying vec2 v_uv;

// Gris más oscuro y más claro de la medusa en pantalla, en sRGB.
const float MEDUSA_DARK = 0.5;
const float MEDUSA_LIGHT = 0.88;
// Opacidad de la medusa sobre el papel.
const float MEDUSA_OPACITY = 0.6;
// Segundos de un pulso de nado (igual que PULSE_PERIOD en layout.ts).
const float PULSE_PERIOD = 4.5;

// Color de una medusa en este píxel (rgb) y cuánto tapa el papel (a). `box`
// y `look` como en u_medusa y u_medusaLook.
vec4 medusa(vec2 p, vec4 box, vec4 look) {
  if (box.z <= 0.0) return vec4(0.0);
  vec2 uv = (p - box.xy) / box.zw + 0.5;
  // Margen para que la deformación no saque píxeles de borde fuera de la caja.
  if (uv.x < -0.12 || uv.x > 1.12 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);

  if (look.z < 0.0) uv.x = 1.0 - uv.x;
  float time = u_time + look.x;

  // Nado: la campana se cierra y se abre despacio, una vez por pulso (mismo
  // período que `bob` en layout.ts, que la empuja hacia arriba).
  float phase = time * 6.2831853 / PULSE_PERIOD;
  float squeeze = pow(0.5 + 0.5 * sin(phase), 1.6);

  // Desde la boca de la campana (~45 % del dibujo) hacia abajo, los
  // tentáculos ondulan más cuanto más lejos están, y la ola del pulso les
  // llega con retraso.
  float down = 1.0 - uv.y;
  float hang = smoothstep(0.3, 1.0, down);
  uv.x += sin(down * 9.0 - time * 1.1) * 0.016 * hang
        + sin(down * 3.2 - time * 0.5) * 0.05 * hang * hang
        + sin(phase - down * 5.0) * 0.012 * hang;

  // La campana se cierra de costado y se estira hacia arriba al contraerse.
  float bell = 1.0 - smoothstep(0.1, 0.55, down);
  uv.x = 0.5 + (uv.x - 0.5) * (1.0 + squeeze * 0.07 * bell);
  uv.y -= squeeze * 0.025 * bell * (0.5 - down);

  if (uv.x < 0.0 || uv.x > 1.0) return vec4(0.0);
  vec4 t = texture2D(u_medusaMap, uv);
  // El dibujo está cortado abajo: los tentáculos se pierden antes del borde.
  // Los costados y el tope traen restos del trazado: se borran.
  float edges = smoothstep(0.0, 0.22, uv.y) * smoothstep(1.0, 0.97, uv.y)
              * smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x);
  // Los grises del dibujo van de #252525 a #c9c9c9: se suben (en sRGB) a un
  // rango más claro, conservando los cinco tonos.
  float g = pow(t.g, 1.0 / 2.2);
  g = mix(MEDUSA_DARK, MEDUSA_LIGHT, clamp((g - 0.145) / 0.645, 0.0, 1.0));
  return vec4(vec3(pow(g, 2.2)), t.a * edges * MEDUSA_OPACITY * look.y);
}

void main() {
  vec2 p = v_uv * u_size;

  vec3 color = u_paper;

  // Las medusas con sus grises, sobre el papel: la de adelante tapa a las de atrás.
  if (u_medusaReady > 0.5) {
    for (int i = 0; i < MEDUSA_COUNT; i++) {
      vec4 m = medusa(p, u_medusa[i], u_medusaLook[i]);
      color = mix(color, m.rgb, m.a);
    }
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
