// Card de un fundador, en un solo draw call:
// - la sombra suave sobre el papel, en el margen del quad;
// - la foto a sangre: cubre toda la card, a color y un poco oscurecida, con un
//   velo de la superficie abajo y arriba para el texto (sin foto, la
//   superficie lisa con las iniciales);
// - la cruz fina de arriba a la derecha y el contenido (texto), que llega ya
//   dibujado en `u_content`;
// - un canto de luz de 1 px y el anillo de foco del teclado.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment.

uniform vec2 u_quad;          // tamaño del quad, px CSS
uniform vec2 u_card;          // tamaño de la card, px CSS
uniform float u_radius;       // radio de las esquinas, px
uniform vec3 u_base;          // superficie de la card
uniform vec3 u_light;         // blanco de la marca: cruz y canto
uniform vec3 u_ink;           // sombra y anillo de foco
uniform float u_hover;        // 0 en reposo, 1 con el puntero encima
uniform float u_focus;        // 1 con el foco del teclado en su botón
uniform sampler2D u_content;  // texto de la card, premultiplicado
uniform sampler2D u_photo;    // foto del fundador, completa (no recortada al rostro)
uniform float u_photoAspect;  // ancho / alto de la foto
uniform float u_hasPhoto;     // 1 con foto cargada; 0 deja la superficie lisa para las iniciales
uniform float u_dim;          // cuánto se oscurece la foto para leer el texto

varying vec2 v_uv;

float sdRoundRect(vec2 p, vec2 half_, float r) {
  vec2 q = abs(p) - half_ + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (v_uv - 0.5) * u_quad;
  float aa = 1.0;

  // ── Sombra: la card flota un poco sobre el papel ──────────────
  float dShadow = sdRoundRect(p - vec2(0.0, -10.0), u_card * 0.5 - 6.0, u_radius);
  float shadow = (1.0 - smoothstep(-18.0, 22.0, dShadow)) * mix(0.1, 0.14, u_hover);

  // ── La card ───────────────────────────────────────────────────
  float d = sdRoundRect(p, u_card * 0.5, u_radius);
  float inside = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
  vec2 uv = p / u_card + 0.5;
  vec3 color = u_base;

  // ── Foto a sangre ─────────────────────────────────────────────
  if (u_hasPhoto > 0.5) {
    // Cubre la card con su proporción (se recorta solo lo que sobra, centrado).
    vec2 cover = u_card * 0.5;
    float cardAspect = u_card.x / u_card.y;
    if (u_photoAspect > cardAspect) cover.x *= u_photoAspect / cardAspect;
    else cover.y *= cardAspect / u_photoAspect;
    color = texture2D(u_photo, p / (2.0 * cover) + 0.5).rgb * (1.0 - u_dim);
    // Un velo de la superficie sube desde abajo (nombre y pie) y baja apenas
    // desde arriba («Fundador»).
    float veil = smoothstep(0.52, 0.0, uv.y) * 0.9 + smoothstep(0.8, 1.0, uv.y) * 0.55;
    color = mix(color, u_base, veil);
  }

  // ── Más: la cruz fina de arriba a la derecha ──────────────────
  vec2 plus = p - vec2(u_card.x * 0.5 - 30.0, u_card.y * 0.5 - 30.0);
  float arm = 7.0;
  float cross_ = max(
    (1.0 - smoothstep(0.4, 1.0, abs(plus.y))) * step(abs(plus.x), arm),
    (1.0 - smoothstep(0.4, 1.0, abs(plus.x))) * step(abs(plus.y), arm)
  );
  color += u_light * cross_ * 0.45;

  // ── Contenido ─────────────────────────────────────────────────
  vec4 content = texture2D(u_content, uv);
  color = color * (1.0 - content.a) + content.rgb;

  // Canto: un filo de luz de 1 px, apenas más claro con el puntero encima.
  float rim = 1.0 - smoothstep(0.0, 1.2, abs(d + 0.7));
  color += rim * u_light * mix(0.1, 0.16, u_hover);

  // ── Composición sobre el papel ────────────────────────────────
  // Anillo de foco: tinta, 3 px por fuera del canto.
  float focus = (1.0 - smoothstep(0.0, 1.0, abs(d - 4.5) - 1.0)) * u_focus;
  float outside = max(shadow, focus * 0.75);
  float alpha = max(inside, outside * (1.0 - inside));
  vec3 rgb = mix(u_ink, color, inside / max(alpha, 1e-4));

  gl_FragColor = vec4(rgb, alpha);
  #include <colorspace_fragment>
}
