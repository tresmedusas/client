/**
 * Las figuras del hero (DESIGN.md §4): una por cada «qué construimos» del
 * titular (`HERO.headline.what`), en el mismo orden. Son interfaces
 * esquemáticas planas, en línea fina de tinta, con un solo acento: el
 * elemento que importa.
 *
 * Se describen como formas 2D en un marco de diseño de `DESIGN_WIDTH` px
 * (origen en el centro, y hacia abajo, como en SVG). De esta misma
 * descripción salen la figura de la escena (`scene/hero-figure.svelte`) y la
 * de la capa semántica (`lib/hero-figure.svelte`).
 */
import {
  HEADLINE_TIMING,
  stepOf,
  variant,
  type Headline,
  type HeadlineTiming,
} from "../headline.js";

export const DESIGN_WIDTH = 520;

/** Superficie: `fill` le pone la tinta casi transparente (o el tono que diga); `strong`, el trazo del acento. */
interface Style {
  strong?: boolean;
  /** Relleno: proporción de tinta mezclada con el papel (`FIGURE.fillOpacity` en las superficies). */
  fill?: number;
  /** Sin trazo: solo el relleno (los renglones de texto y las superficies). */
  bare?: boolean;
}

export type Shape =
  | ({
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      r: number;
    } & Style)
  | ({ kind: "circle"; x: number; y: number; r: number } & Style)
  /** Trazo abierto, o cerrado con `closed`. */
  | ({ kind: "line"; points: [number, number][]; closed?: boolean } & Style);

export interface HeroFigure {
  /** De atrás hacia adelante. */
  shapes: Shape[];
}

/**
 * Cómo se ve la figura en su marco y cómo cambia (valores del banco de
 * pruebas que eligió el usuario).
 */
export const LOOK = {
  /** Alto del marco, en fracción de su ancho. */
  height: 0.45,
  /** Escala de la placa en el marco (1: 340 px de diseño en 520). */
  scale: 1.5,
  /** Corrimiento de la placa hacia abajo, en px de diseño: con el difuminado, la figura se pierde abajo. */
  offsetY: -10,
  /** Franja de los bordes de arriba y de los costados en la que la figura se desvanece, en px CSS. */
  edgeFade: 0,
  /** Difuminado blanco del borde de abajo: qué parte del alto del marco toma, y su curva (más, más concentrado abajo). */
  bottomFade: 0.14,
  bottomCurve: 2,
  /** El panel de vidrio del cambio: su ancho en px de diseño, lo que tarda en cruzar (s) y su intensidad (0..1). */
  panelWidth: 70,
  wipe: 1.1,
  glass: 1,
} as const;

/** Los mismos valores, como números: lo que ajusta el banco de pruebas (`src/lib/lab/hero-lab*`). */
export type FigureLook = { [K in keyof typeof LOOK]: number };

/** Proporción del marco (ancho / alto) y su alto en px de diseño. */
export const ASPECT = 1 / LOOK.height;
export const DESIGN_HEIGHT = DESIGN_WIDTH / ASPECT;

const SURFACE = 0.03;
/** Tonos de la tinta para los renglones (barras): títulos, texto y texto suave. */
const HEAD = 0.16;
const BODY = 0.09;
const SOFT = 0.05;
/** Una superficie un paso más oscura que la placa: barras laterales y paneles. */
const PANEL = 0.05;

const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: Style = {},
): Shape => ({ kind: "rect", x, y, w, h, r, ...style });
const circle = (x: number, y: number, r: number, style: Style = {}): Shape => ({
  kind: "circle",
  x,
  y,
  r,
  ...style,
});
const line = (...points: [number, number][]): Shape => ({
  kind: "line",
  points,
});
/** Un renglón de texto: una barra redondeada desde `x`, centrada en `y`. */
const bar = (x: number, y: number, w: number, h = 4, fill = BODY): Shape =>
  rect(x + w / 2, y, w, h, h / 2, { fill, bare: true });
/** Renglones, uno debajo del otro. */
const bars = (
  x: number,
  y: number,
  widths: number[],
  gap: number,
  h = 4,
  fill = BODY,
): Shape[] => widths.map((w, i) => bar(x, y + i * gap, w, h, fill));

/**
 * La placa de fondo de cada figura: una ventana de 340 de ancho, sin sombra,
 * que sigue hacia abajo hasta salir del marco (pedido del usuario,
 * 2026-11-27). El contenido se arma en los primeros 130 px (`H`); la placa,
 * sus paneles y sus divisores llegan hasta `BOTTOM`.
 */
const W = 340;
const H = 130;
const L = -W / 2;
const T = -H / 2;
/** Borde de abajo de la placa: más abajo que el del marco, que la corta. */
const BOTTOM = 140;
/** Radio de las esquinas de arriba; las de abajo van rectas. */
const RADIUS = 14;
/** Un cuarto de círculo de radio `RADIUS` con centro en (`cx`, `cy`), desde el ángulo `from` (rad). */
const corner = (cx: number, cy: number, from: number): [number, number][] =>
  Array.from({ length: 9 }, (_, i) => {
    const a = from + (i / 8) * (Math.PI / 2);
    return [cx + Math.cos(a) * RADIUS, cy + Math.sin(a) * RADIUS];
  });
const board = (): Shape[] => [
  {
    kind: "line",
    points: [
      [L, BOTTOM],
      ...corner(L + RADIUS, T + RADIUS, Math.PI),
      ...corner(-L - RADIUS, T + RADIUS, -Math.PI / 2),
      [-L, BOTTOM],
    ],
    closed: true,
    fill: SURFACE,
  },
];
/** Un panel de `w` de ancho centrado en `x`, un paso más oscuro, desde la barra de arriba hasta el borde de abajo de la placa. */
const column = (x: number, w: number): Shape =>
  rect(x, (T + 16 + BOTTOM) / 2, w, BOTTOM - (T + 16), 0, {
    fill: PANEL,
    bare: true,
  });
/** La barra de arriba de una ventana: tres puntos, el divisor y lo que vaya en el medio. */
const titleBar = (y = T + 16): Shape[] => [
  ...[0, 9, 18].map((dx) =>
    circle(L + 12 + dx, T + 8, 2.6, { fill: 0.12, bare: true }),
  ),
  line([L, y], [-L, y]),
];

/** «El software»: un panel de gestión: barra lateral, encabezado, indicadores y una tabla; la fila elegida es el acento. */
function software(): HeroFigure {
  const side = 64;
  const main = L + side + 12;
  const mainW = -L - 10 - main;
  const nav = [30, 24, 34, 20, 28];
  const cardW = (mainW - 16) / 3;
  const rows = [30, 46, 62];
  return {
    shapes: [
      ...board(),
      // Barra lateral, un paso más oscura, con la marca y la navegación.
      column(L + side / 2, side),
      ...titleBar(),
      rect(10, T + 8, 120, 9, 4.5, { fill: 0.05, bare: true }),
      bar(-18, T + 8, 46, 3, SOFT),
      line([L + side, T + 16], [L + side, BOTTOM]),
      rect(L + 14, -38, 9, 9, 2.5, { fill: HEAD, bare: true }),
      bar(L + 23, -38, 28, 4, HEAD),
      rect(L + side / 2, -10 + 0, side - 10, 11, 5.5, {
        fill: 0.08,
        bare: true,
      }),
      ...nav.flatMap((w, i) => [
        rect(L + 14, -22 + i * 12, 6, 6, 1.5),
        bar(L + 21, -22 + i * 12, w, 3.5, i === 1 ? HEAD : BODY),
      ]),
      // Encabezado: título, bajada y botón.
      bar(main, -40, 74, 6, HEAD),
      bar(main, -30, 118, 3.5, SOFT),
      rect(-L - 34, -36, 44, 13, 6.5, { fill: 0.75, bare: true }),
      bar(-L - 46, -36, 24, 3, 0),
      rect(-L - 70, -36, 13, 13, 6.5),
      // Indicadores: valor, etiqueta y una línea de tendencia.
      ...[0, 1, 2].flatMap((i) => {
        const x = main + i * (cardW + 8);
        const spark: [number, number][] = [0, 1, 2, 3, 4, 5, 6].map((k) => [
          x + 40 + k * 6,
          -2 - [2, 4, 3, 6, 5, 8, 9 - i * 3][k]!,
        ]);
        return [
          rect(x + cardW / 2, -4, cardW, 24, 6, { fill: 0 }),
          bar(x + 7, -11, 26, 3, SOFT),
          bar(x + 7, -2, 20 + i * 4, 6, HEAD),
          { kind: "line", points: spark } as Shape,
        ];
      }),
      // Tabla: encabezado y filas.
      bar(main + 18, 17, 30, 3, SOFT),
      bar(main + 96, 17, 22, 3, SOFT),
      bar(main + 150, 17, 26, 3, SOFT),
      line([main, 22], [-L - 10, 22]),
      ...rows.flatMap((y, i) => [
        circle(main + 8, y, 4.5, { fill: 0.06 }),
        bar(main + 18, y, [56, 44, 62][i]!, 4, BODY),
        bar(main + 96, y, [34, 40, 28][i]!, 3.5, SOFT),
        rect(main + 163, y, 26, 9, 4.5, { fill: [0.1, 0.04, 0.04][i] }),
        bar(main + 224, y, 14, 3.5, SOFT),
      ]),
      rect(main + mainW / 2, rows[0]!, mainW + 6, 14, 7, { strong: true }),
    ],
  };
}

/** «La identidad»: un manual de marca: la marca con su construcción (el acento), la paleta, la tipografía y los componentes. */
function identity(): HeroFigure {
  const mx = L + 58;
  const my = 6;
  const swatch = [0.82, 0.4, 0.12, 0];
  return {
    shapes: [
      ...board(),
      ...titleBar(),
      bar(-22, T + 8, 44, 3, SOFT),
      // La marca, sobre su grilla de construcción.
      rect(mx, my, 96, 92, 10, { fill: 0 }),
      line([mx - 48, my], [mx + 48, my]),
      line([mx, my - 46], [mx, my + 46]),
      line([mx - 30, my - 30], [mx + 30, my + 30]),
      line([mx + 30, my - 30], [mx - 30, my + 30]),
      circle(mx, my, 34),
      circle(mx, my, 26, { strong: true }),
      circle(mx, my, 10, { strong: true }),
      ...[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy]) =>
        rect(mx + sx! * 34, my + sy! * 34, 4, 4, 1, { fill: 0 }),
      ),
      // Paleta: cuatro tonos con su nombre.
      bar(-48, -38, 40, 3.5, SOFT),
      ...swatch.flatMap((fill, i) => [
        rect(-33 + i * 36, -14, 30, 34, 6, { fill }),
        bar(-48 + i * 36, 9, 18, 3, SOFT),
      ]),
      // Tipografía: una «Aa» construida y la escala de tamaños.
      line([-46, 46], [-37, 22], [-28, 46]),
      line([-42, 37], [-32, 37]),
      circle(-15, 40, 6),
      line([-9, 34], [-9, 46]),
      ...[7, 5, 4, 3].map((h, i) =>
        bar(
          4,
          22 + [0, 9, 17, 24][i]!,
          [72, 92, 104, 84][i]!,
          h,
          i === 0 ? HEAD : BODY,
        ),
      ),
      // Componentes: botones, interruptor y casillas.
      line([108, T + 16], [108, BOTTOM]),
      bar(118, -38, 32, 3.5, SOFT),
      rect(142, -22, 46, 13, 6.5, { fill: 0.75, bare: true }),
      bar(128, -22, 28, 3, 0),
      rect(142, -4, 46, 13, 6.5),
      bar(128, -4, 28, 3, BODY),
      rect(129, 15, 22, 12, 6, { fill: 0.1 }),
      circle(134, 15, 4, { fill: 0 }),
      rect(158, 15, 9, 9, 2.5, { fill: 0.75, bare: true }),
      rect(129, 32, 22, 12, 6),
      circle(124, 32, 4, { fill: 0.1 }),
      rect(158, 32, 9, 9, 2.5),
    ],
  };
}

/** «El diseño»: un editor: herramientas, capas, el lienzo con dos marcos (el elegido es el acento) y sus propiedades. */
function design(): HeroFigure {
  const panel = 54;
  const left = L + panel;
  const right = -L - panel;
  const a = { x: left + 58, y: -2, w: 76, h: 70 };
  const b = { x: right - 62, y: 6, w: 92, h: 66 };
  const handles: [number, number][] = [
    [b.x - b.w / 2, b.y - b.h / 2],
    [b.x + b.w / 2, b.y - b.h / 2],
    [b.x - b.w / 2, b.y + b.h / 2],
    [b.x + b.w / 2, b.y + b.h / 2],
  ];
  const tools = [0, 1, 2, 3, 4];
  return {
    shapes: [
      ...board(),
      // Paneles de los costados, un paso más oscuros.
      column(L + panel / 2, panel),
      column(-L - panel / 2, panel),
      ...titleBar(),
      // Herramientas, al medio de la barra de arriba; la elegida, rellena.
      ...tools.map((i) =>
        rect(
          -30 + i * 15,
          T + 8,
          9,
          9,
          2.5,
          i === 1 ? { fill: 0.75, bare: true } : {},
        ),
      ),
      rect(-L - 22, T + 8, 26, 9, 4.5, { fill: 0.05, bare: true }),
      line([left, T + 16], [left, BOTTOM]),
      line([right, T + 16], [right, BOTTOM]),
      // Capas.
      bar(L + 8, -40, 24, 3.5, SOFT),
      rect(L + panel / 2, -16, panel - 8, 10, 5, { fill: 0.09, bare: true }),
      ...[0, 1, 2, 3, 4].flatMap((i) => [
        rect(L + 12, -28 + i * 12, 5, 5, 1.2),
        bar(
          L + 18,
          -28 + i * 12,
          [26, 22, 18, 24, 16][i]!,
          3,
          i === 1 ? HEAD : BODY,
        ),
      ]),
      // Propiedades: medidas, un deslizador y el color.
      bar(right + 8, -40, 24, 3.5, SOFT),
      ...[0, 1].flatMap((r) =>
        [0, 1].map((c) => rect(right + 15 + c * 22, -26 + r * 14, 18, 9, 3)),
      ),
      bar(right + 8, 4, 18, 3, SOFT),
      line([right + 8, 14], [-L - 8, 14]),
      circle(right + 30, 14, 3.5, { fill: 0 }),
      rect(right + 13, 28, 10, 10, 2.5, { fill: 0.4, bare: true }),
      bar(right + 22, 28, 22, 3.5, BODY),
      // Marco A: una pantalla con imagen y texto.
      bar(a.x - a.w / 2, a.y - a.h / 2 - 7, 30, 3, SOFT),
      rect(a.x, a.y, a.w, a.h, 6, { fill: 0 }),
      rect(a.x, a.y - 14, a.w - 14, 28, 4),
      line([a.x - a.w / 2 + 7, a.y - 28], [a.x + a.w / 2 - 7, a.y]),
      line([a.x + a.w / 2 - 7, a.y - 28], [a.x - a.w / 2 + 7, a.y]),
      ...bars(a.x - a.w / 2 + 7, a.y + 8, [48, 58, 36], 8, 3.5, BODY),
      // El conector, en ángulo recto.
      line(
        [a.x + a.w / 2, a.y - 6],
        [a.x + a.w / 2 + 14, a.y - 6],
        [a.x + a.w / 2 + 14, b.y + 8],
        [b.x - b.w / 2, b.y + 8],
      ),
      circle(b.x - b.w / 2, b.y + 8, 2.2, { fill: 0.6, bare: true }),
      // Guía de alineación por el centro del marco elegido.
      line([b.x, T + 22], [b.x, b.y - b.h / 2 - 3]),
      // Marco B, el elegido: contenido, tiradores, medida y cursor.
      bar(b.x - b.w / 2, b.y - b.h / 2 - 7, 30, 3, SOFT),
      rect(b.x, b.y, b.w, b.h, 6, { fill: 0 }),
      bar(b.x - b.w / 2 + 8, b.y - 20, 44, 6, HEAD),
      ...bars(b.x - b.w / 2 + 8, b.y - 8, [70, 56], 8, 3.5, BODY),
      rect(b.x - b.w / 2 + 25, b.y + 16, 34, 11, 5.5, {
        fill: 0.75,
        bare: true,
      }),
      rect(b.x - b.w / 2 + 63, b.y + 16, 34, 11, 5.5),
      rect(b.x, b.y, b.w + 4, b.h + 4, 7, { strong: true }),
      ...handles.map(([x, y]) => rect(x, y, 6, 6, 1.5, { fill: 0 })),
      rect(b.x, b.y + b.h / 2 + 10, 40, 10, 5, { fill: 0.75, bare: true }),
      bar(b.x - 12, b.y + b.h / 2 + 10, 24, 3, 0),
      {
        kind: "line",
        points: [
          [b.x + 34, b.y + 22],
          [b.x + 34, b.y + 40],
          [b.x + 39, b.y + 35.5],
          [b.x + 43, b.y + 44],
          [b.x + 46, b.y + 42.5],
          [b.x + 42, b.y + 34],
          [b.x + 48.5, b.y + 34],
        ],
        closed: true,
        fill: 0,
      },
    ],
  };
}

export const HERO_FIGURES: readonly HeroFigure[] = [
  software(),
  identity(),
  design(),
];

/** Lo que dura el cambio de figura: el panel de vidrio cruza el marco. */
export const WIPE = LOOK.wipe;

/**
 * Qué figura se ve a los `t` segundos del reloj del hero, siguiendo al
 * titular: cuando cambia «qué construimos», el panel arranca con el fundido
 * de salida de esas palabras y cruza durante `WIPE` segundos. `from` es la
 * figura de antes, `to` la nueva y `p` (0..1) cuánto cruzó; quieta, `from`
 * y `to` son la misma y `p` es 1. `timing` son los tiempos del titular y
 * `wipe`, lo que tarda el panel (s).
 */
export function figureAt(
  h: Headline,
  t: number,
  timing: HeadlineTiming = HEADLINE_TIMING,
  wipe: number = WIPE,
): { from: number; to: number; p: number } {
  const step = stepOf(timing);
  const k = Math.max(0, Math.floor(t / step));
  const to = variant(h, k).what;
  const u = t - k * step;
  if (k === 0) return { from: to, to, p: 1 };
  const from = variant(h, k - 1).what;
  if (from === to || u >= wipe) return { from: to, to, p: 1 };
  // Con el titular: arranca cuando las palabras empiezan a irse.
  const x = Math.min(1, u / wipe);
  return { from, to, p: x * x * (3 - 2 * x) };
}
