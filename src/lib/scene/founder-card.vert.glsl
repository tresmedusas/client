// Card de un fundador: un quad que se inclina hacia el puntero con perspectiva.
//
// La cámara de la escena es ortográfica, así que la perspectiva se arma acá:
// el quad se rota en x e y alrededor de su centro y la w de salida es la de una
// cámara a `u_perspective` px. La GPU hace la división, así que las uv (y la
// textura del contenido) se interpolan con perspectiva correcta. La z de salida
// queda plana: la card no cruza los niveles de captura de los vidrios.

uniform vec2 u_quad;          // tamaño del quad en px CSS (la card más el margen de la sombra)
uniform vec2 u_tilt;          // rotación en radianes: x (cabeceo) e y (giro)
uniform float u_scale;        // escala de la card (crece un poco al pasar el mouse)
uniform float u_perspective;  // distancia de la cámara simulada, px

varying vec2 v_uv;

void main() {
  v_uv = uv;
  vec3 p = vec3(position.xy * u_quad * u_scale, 0.0);

  float cy = cos(u_tilt.y);
  float sy = sin(u_tilt.y);
  p = vec3(p.x * cy, p.y, -p.x * sy);
  float cx = cos(u_tilt.x);
  float sx = sin(u_tilt.x);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);

  // Lo que se acerca a la cámara (z > 0) se ve más grande: w < 1.
  float w = (u_perspective - p.z) / u_perspective;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p.xy, 0.0, w);
}
