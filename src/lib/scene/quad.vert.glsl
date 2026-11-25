// Quad de un PlaneGeometry con sus uv (el tamaño lo da la escala del mesh).

varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
