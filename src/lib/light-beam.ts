/**
 * Haz de luz del modal de un fundador (pedido del usuario, ver DESIGN.md §6):
 * dos haces que cruzan la pantalla, cálido a la izquierda y frío a la derecha,
 * con los canales apenas separados en los bordes, sobre un fondo oscuro.
 *
 * WebGL 2 crudo en su propio canvas: el modal es HTML (foco, Escape y lector de
 * pantalla nativos) y queda por encima de la escena.
 */

/**
 * A qué altura cruza el haz, en fracción del alto desde abajo (pedido del
 * usuario, 2026-11-27: más cerca del borde de abajo; antes, 0.34). El nombre
 * gigante del modal va detrás, a la misma altura.
 */
export const BEAM_HEIGHT = 0.18

const VERTEX = `#version 300 es
void main() {
  // Un triángulo que cubre la pantalla.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_open;   // 0 → 1 al abrir: el haz se enciende desde el centro
uniform vec3 u_bg;
out vec4 outColor;

// Un haz: núcleo fino que se abre hacia los costados, con halo.
float beam(float dy, float x) {
  float thick = mix(0.004, 0.05, smoothstep(0.0, 1.3, abs(x)));
  float core = exp(-dy * dy / (thick * thick) * 0.5);
  float halo = exp(-abs(dy) / (thick * 7.0)) * 0.28;
  return core + halo;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - ${BEAM_HEIGHT.toFixed(3)});
  float x = p.x;

  // Ondulación que se concentra donde cruzan.
  float wave = 0.03 * sin(x * 3.0 + u_time * 0.35) * exp(-x * x * 1.6)
             + 0.012 * sin(x * 8.0 - u_time * 0.6) * exp(-x * x * 5.0);

  // Cada canal un poco corrido: el borde del haz se abre en espectro.
  vec3 a = vec3(0.0);
  vec3 b = vec3(0.0);
  for (int c = 0; c < 3; c++) {
    float shift = (float(c) - 1.0) * 0.006 * (0.4 + abs(x));
    a[c] = beam(p.y - (wave + 0.045 * x) + shift, x);
    b[c] = beam(p.y - (-wave * 0.8 - 0.035 * x) - shift, x);
  }

  // Cálido a la izquierda, blanco en el cruce, frío a la derecha.
  float side = smoothstep(-1.1, 1.1, x);
  vec3 warm = vec3(1.0, 0.72, 0.32);
  vec3 cool = vec3(0.38, 0.58, 1.0);
  vec3 tint = mix(warm, cool, side);
  float white = exp(-x * x * 6.0);
  vec3 light = a * mix(tint, vec3(1.0), white * 0.7) * 1.1 + b * mix(cool * 0.9, vec3(1.0), white * 0.5) * 0.8;

  // Un resplandor bajo el haz, como luz que pega en el piso.
  light += tint * exp(-pow(max(0.0, -p.y), 1.0) * 6.0) * exp(-x * x * 0.8) * 0.06 * step(p.y, 0.0);

  // Se enciende desde el centro hacia los costados.
  float reach = u_open * (aspect * 0.5 + 0.4);
  float mask = 1.0 - smoothstep(reach - 0.35, reach, abs(x));

  // La luz satura suave (sin quemar a blanco plano); el fondo queda como está.
  vec3 color = u_bg + (1.0 - exp(-light * mask * 1.4));
  outColor = vec4(min(color, 1.0), 1.0);
}`

/** «#111111» → [r, g, b] en 0..1 (sRGB: el canvas no gestiona color). */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
  return shader
}

export interface LightBeam {
  /** Dibuja un cuadro: `time` en segundos, `open` de 0 a 1. */
  draw(time: number, open: number): void
  destroy(): void
}

/** Prepara el haz en `canvas`; null si no hay WebGL 2 (el modal queda solo oscuro). */
export function lightBeam(canvas: HTMLCanvasElement, background: string): LightBeam | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
  if (!gl) return null
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  gl.useProgram(program)
  const res = gl.getUniformLocation(program, 'u_res')
  const time = gl.getUniformLocation(program, 'u_time')
  const open = gl.getUniformLocation(program, 'u_open')
  gl.uniform3fv(gl.getUniformLocation(program, 'u_bg'), rgb(background))
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  return {
    draw(t, o) {
      // Hasta 1.5×: el haz es difuso, no gana nada con más resolución.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(res, w, h)
      gl.uniform1f(time, t)
      gl.uniform1f(open, o)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
