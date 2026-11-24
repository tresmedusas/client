// Fondo del sitio, en un solo draw call y fijo a la ventana: papel blanco liso.
//
// Los colores llegan en lineal y se codifican con colorspace_fragment.

uniform vec3 u_paper;         // color del papel

varying vec2 v_uv;

void main() {
  gl_FragColor = vec4(u_paper, 1.0);
  #include <colorspace_fragment>
}
