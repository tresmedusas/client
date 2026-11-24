// Logo del hero: el canvas trae la silueta en el alfa y el color sale del token.

uniform sampler2D u_map;
uniform vec3 u_color;         // en lineal

varying vec2 v_uv;

void main() {
  gl_FragColor = vec4(u_color, texture2D(u_map, v_uv).a);
  #include <colorspace_fragment>
}
