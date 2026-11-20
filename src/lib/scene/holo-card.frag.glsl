// Card holográfica de un fundador, en un solo draw call:
// - la sombra suave sobre el papel, en el margen del quad;
// - la card oscura con la textura de una huella dactilar (crestas finas);
// - el holograma satinado: un reflejo amplio y suave, de colores pastel, que
//   corre por el relieve de las crestas; la luz sigue al puntero;
// - la foto a sangre: cubre toda la card, a color y un poco oscurecida, con
//   el holograma encima y un velo abajo para el texto (sin foto, la huella
//   sola con las iniciales);
// - el contenido (texto), que llega ya dibujado en `u_content`;
// - un brillo especular encima de todo y el anillo de foco del teclado.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment.

uniform vec2 u_quad;          // tamaño del quad, px CSS
uniform vec2 u_card;          // tamaño de la card, px CSS
uniform float u_radius;       // radio de las esquinas, px
uniform vec3 u_base;          // superficie de la card
uniform vec3 u_light;         // blanco de la marca: crestas, anillos y brillo
uniform vec3 u_ink;           // sombra y anillo de foco
uniform vec2 u_pointer;       // puntero en la card, [0, 1]² con y arriba
uniform float u_hover;        // 0 en reposo, 1 con el puntero encima
uniform float u_focus;        // 1 con el foco del teclado en su botón
uniform float u_seed;         // varía la huella entre fundadores
uniform sampler2D u_content;  // texto de la card, premultiplicado
uniform sampler2D u_photo;    // foto del fundador, completa (no recortada al rostro)
uniform float u_photoAspect;  // ancho / alto de la foto
uniform float u_hasPhoto;     // 1 con foto cargada; 0 deja la huella sola para las iniciales
uniform float u_dim;          // cuánto se oscurece la foto para leer el texto

varying vec2 v_uv;

const float TAU = 6.28318530718;

float sdRoundRect(vec2 p, vec2 half_, float r) {
  vec2 q = abs(p) - half_ + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

// Espectro continuo (paleta de cosenos): el color de una lámina holográfica.
vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

// Satinado: el espectro lavado hacia un blanco perla. Los colores se intuyen
// en el reflejo, sin bandas de arcoíris saturado.
vec3 satin(float t) {
  return mix(vec3(0.82, 0.84, 0.88), spectrum(t), 0.42);
}

// Huella dactilar: un lazo de crestas alrededor de un núcleo, sobre un dominio
// doblado por ondas grandes de ruido. Las crestas se abren en arcos hacia un
// lado, cambian de grosor y se cortan de a ratos, como en una yema real.
// Devuelve el campo (cada entero es una cresta); `shape` es (grosor, continuidad).
float fingerprint(vec2 p, out vec2 shape) {
  vec2 core = vec2(-0.3, 0.12) * u_card.y;
  vec2 q = (p - core) / u_card.y;
  // Ondas grandes: el dominio se dobla con ruido de baja frecuencia.
  vec2 bend = vec2(fbm(q * 1.3 + u_seed), fbm(q * 1.3 + u_seed + 31.7)) - 0.5;
  q += bend * 0.34;
  q.y *= 1.3;
  float r = length(q);
  float a = atan(q.y, q.x);
  // Lazo: de un lado las crestas se estiran y dejan de cerrarse.
  float loop = 1.0 - 0.24 * smoothstep(-0.2, 1.0, cos(a + 0.5 + u_seed * 0.13)) * smoothstep(0.04, 0.45, r);
  // RIDGES crestas por alto de card; la ondulación escala con ellas para que
  // el dibujo conserve su forma.
  const float RIDGES = 48.0;
  float f = (r * loop * 30.0 + 0.7 * sin(a * 2.0 + r * 3.0 + u_seed) + fbm(q * 3.5 + u_seed) * 1.1) * (RIDGES / 30.0);
  float thick = mix(0.018, 0.045, noise(q * 5.0 + u_seed * 2.0));
  float gap = smoothstep(0.05, 0.14, noise(q * 26.0 + u_seed * 5.0));
  shape = vec2(thick, gap);
  return f;
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

  // Superficie: apenas más clara arriba a la izquierda, como la de la referencia.
  vec3 color = u_base * mix(1.25, 0.85, clamp(uv.x * 0.6 + (1.0 - uv.y) * 0.5, 0.0, 1.0));

  // La luz: en reposo pega en el borde izquierdo; con el puntero encima se
  // refleja del lado opuesto, como en una lámina que se inclina.
  vec2 rest = vec2(-0.12, 0.52);
  vec2 lit = vec2(1.0 - u_pointer.x, 1.0 - u_pointer.y);
  vec2 L = mix(rest, lit, u_hover);
  vec2 toL = (uv - L) * vec2(u_card.x / u_card.y, 1.0);
  // Satinado: el reflejo es ancho y suave, no un punto brillante.
  float glow = exp(-dot(toL, toL) * mix(14.0, 6.5, u_hover));
  // Bajo el nombre y el pie la luz baja, para que el texto se lea.
  glow *= mix(0.45, 1.0, smoothstep(0.1, 0.38, uv.y));

  // Crestas de la huella: siempre se intuyen; donde pega la luz, se encienden.
  vec2 shape;
  float field = fingerprint(p, shape);
  float ridge = abs(fract(field) - 0.5);
  float fw = fwidth(field);
  float line = (1.0 - smoothstep(shape.x, shape.x + fw * 1.5, ridge)) * shape.y;
  // El relieve: cada cresta sube y baja suave; el satinado lo recorre entero.
  float relief = 0.5 + 0.5 * cos(TAU * field);
  float hue = field * 0.006 + uv.x * 0.45 - uv.y * 0.3 + (u_pointer.x - u_pointer.y) * 0.6 * u_hover;
  vec3 holo = satin(hue);
  // Las crestas llevan el holograma: en reposo apenas se intuyen y, donde pega
  // la luz, se encienden con un espectro algo más vivo que el satinado del fondo.
  vec3 ridgeHolo = mix(holo, spectrum(hue + field * 0.012), 0.55);
  color += u_light * line * 0.014;
  color += ridgeHolo * line * (glow * 1.3 + u_hover * 0.08);
  color += holo * glow * (relief * 0.14 + 0.1) * mix(0.9, 1.15, u_hover);

  // ── Foto a sangre ─────────────────────────────────────────────
  if (u_hasPhoto > 0.5) {
    // Cubre la card con su proporción (se recorta solo lo que sobra, centrado).
    vec2 cover = u_card * 0.5;
    float cardAspect = u_card.x / u_card.y;
    if (u_photoAspect > cardAspect) cover.x *= u_photoAspect / cardAspect;
    else cover.y *= cardAspect / u_photoAspect;
    vec3 photo = texture2D(u_photo, p / (2.0 * cover) + 0.5).rgb;
    float luma = dot(photo, vec3(0.2126, 0.7152, 0.0722));
    // La foto conserva su color; el holograma se suma encima como una lámina
    // (mezcla «screen»: aclara, nunca oscurece). En reposo apenas se intuye;
    // con la luz encima corre por las luces de la foto y por las crestas.
    vec3 foil = satin(luma * 0.6 + field * 0.006 + uv.x * 0.45 - uv.y * 0.3 + (u_pointer.x - u_pointer.y) * 0.6 * u_hover);
    float shine = clamp(0.06 + glow * 0.6 + u_hover * 0.14, 0.0, 0.45);
    vec3 layer = foil * shine * (0.35 + 0.65 * luma) + foil * (line * 0.2 + relief * 0.06) * shine;
    color = (1.0 - (1.0 - photo) * (1.0 - layer)) * (1.0 - u_dim);
    // Las crestas se intuyen sobre la foto y un velo de la superficie sube
    // desde abajo (nombre y pie) y baja apenas desde arriba («Fundador»).
    color += ridgeHolo * line * (glow * 0.45 + 0.02);
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

  // ── Brillo especular: una franja diagonal que cruza con la luz ─
  // Ancha y con una veta fina, como la luz sobre una tela satinada.
  vec2 dir = normalize(vec2(1.0, -0.7));
  float band = dot(uv - L, dir);
  float grain = noise(vec2(dot(p, dir) * 0.015, dot(p, vec2(-dir.y, dir.x)) * 0.35) + u_seed);
  float sheen = exp(-band * band * 7.0) * (0.03 + 0.06 * u_hover) * (0.75 + 0.5 * grain);
  color += mix(u_light, holo, 0.5) * sheen;

  // Canto: un filo de luz de 1 px que se enciende del lado de la luz.
  float rim = 1.0 - smoothstep(0.0, 1.2, abs(d + 0.7));
  color += rim * mix(u_light * 0.1, holo * 0.45, glow);

  // ── Composición sobre el papel ────────────────────────────────
  // Anillo de foco: tinta, 3 px por fuera del canto.
  float focus = (1.0 - smoothstep(0.0, 1.0, abs(d - 4.5) - 1.0)) * u_focus;
  float outside = max(shadow, focus * 0.75);
  float alpha = max(inside, outside * (1.0 - inside));
  vec3 rgb = mix(u_ink, color, inside / max(alpha, 1e-4));

  gl_FragColor = vec4(rgb, alpha);
  #include <colorspace_fragment>
}
