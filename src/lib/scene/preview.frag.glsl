// La previsualización de un caso: una imagen en un rectángulo redondeado,
// encajada como `object-fit` (cover o contain) y anclada arriba o al centro.
// Con contain, lo que no cubre la imagen es el fondo (`u_background`), y la
// imagen va con un margen (`u_padding`, fracción del lado corto).

uniform sampler2D u_texture;
uniform vec2 u_size;          // px CSS
uniform float u_radius;
uniform float u_softness;
uniform float u_opacity;
uniform float u_imageAspect;  // ancho / alto de la imagen; 0 mientras no cargó
uniform float u_contain;      // 1 = contain, 0 = cover
uniform float u_top;          // 1 = anclada arriba, 0 = al centro
uniform float u_padding;
uniform vec3 u_background;

varying vec2 v_uv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (v_uv - 0.5) * u_size;
  float d = sdRoundedBox(p, u_size * 0.5, u_radius);
  float alpha = 1.0 - smoothstep(-u_softness, u_softness, d);

  vec4 color = vec4(u_background, 1.0);
  if (u_imageAspect > 0.0) {
    // Tamaño de la imagen en px CSS dentro del marco.
    vec2 box = u_size;
    if (u_contain > 0.5) box -= 2.0 * u_padding * min(u_size.x, u_size.y);
    float boxAspect = box.x / box.y;
    bool wider = u_imageAspect > boxAspect;
    vec2 image;
    if (u_contain > 0.5) image = wider ? vec2(box.x, box.x / u_imageAspect) : vec2(box.y * u_imageAspect, box.y);
    else image = wider ? vec2(box.y * u_imageAspect, box.y) : vec2(box.x, box.x / u_imageAspect);
    // Centro de la imagen: al centro del marco, o con su borde de arriba en el del marco.
    vec2 center = vec2(0.0, u_top > 0.5 ? (u_size.y - image.y) * 0.5 : 0.0);
    if (u_contain > 0.5 && u_top > 0.5) center.y -= u_padding * min(u_size.x, u_size.y);
    vec2 uv = (p - center) / image + 0.5;
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      vec4 tex = texture2D(u_texture, uv);
      color = vec4(mix(color.rgb, tex.rgb, tex.a), 1.0);
    }
  }

  gl_FragColor = vec4(color.rgb, u_opacity * alpha);

  #include <colorspace_fragment>
}
