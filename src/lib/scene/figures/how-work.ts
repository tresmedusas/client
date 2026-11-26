/**
 * Las cuatro figuras de «Cómo trabajamos», una por etapa. Cada una vive en un
 * marco de diseño de `DESIGN_WIDTH` px de ancho (3:2) y se anima con `update(t)`,
 * con `t` en segundos. `REST` es el instante que mejor cuenta cada idea: el
 * cuadro fijo con movimiento reducido y el de las imágenes de la capa semántica.
 */
import { CylinderGeometry, Group, Matrix4, Mesh, Quaternion, TorusGeometry, Vector3, type Object3D } from 'three'
import { Kit, CAMERA_DIR, clamp01, ease, onFloor } from './kit.js'

export const DESIGN_WIDTH = 520
export const ASPECT = 3 / 2

/** Altura (en px de diseño) a la que mira la cámara en cada figura. */
export const TARGET_Y = [56, 64, 136, 100] as const
export const REST = [2.6, 1.4, 2.9, 3.4] as const

export interface Lens {
  /** Centro de la lente, en el mundo de la figura. */
  center: Vector3
  /** Radio del vidrio, en px de diseño. */
  radius: number
}

export interface Figure {
  root: Object3D
  update(t: number): void
  /** Solo la figura 1: la lente que el vidrio de Essentia dibuja encima. */
  lens?: Lens
}

export const FIGURES: ((kit: Kit) => Figure)[] = [understand, milestones, verify, approve]

// ── 1. Entendemos tu operación: lupa sobre hoja, página y dashboard ──
function understand(kit: Kit): Figure {
  const root = new Group()
  root.add(kit.dotGrid(300))

  // Hoja de texto, acostada.
  const sheet = new Group()
  sheet.add(kit.slab(112, 150, 3, { r: 10 }))
  sheet.add(kit.text(-40, -56, [56], 0, 3.4))
  sheet.add(kit.text(-40, -34, [80, 72, 80, 60, 78, 44], 16, 3.4))
  sheet.add(kit.shadow(170, 210))
  sheet.position.copy(onFloor(-150, 10))
  sheet.rotation.y = 0.12
  root.add(sheet)

  // Página web, de pie.
  const page = new Group()
  const panel = new Group()
  panel.add(kit.slab(176, 124, 6, { r: 12 }))
  const y = 6.4
  for (const x of [-74, -64, -54]) panel.add(kit.circle(x, -48, 3, y, kit.normal, 16))
  panel.add(kit.rrect(16, -48, 92, 10, 5, y))
  panel.add(kit.segments([-88, y, -38, 88, y, -38]))
  panel.add(kit.rrect(-28, -8, 104, 40, 6, y))
  panel.add(kit.text(-80, 24, [92, 70], 12, y))
  panel.add(kit.rrect(56, -8, 40, 40, 6, y))
  panel.add(kit.rrect(56, 36, 40, 24, 6, y))
  panel.rotation.x = Math.PI / 2
  panel.position.y = 70
  page.add(panel)
  const foot = kit.slab(64, 26, 8, { r: 8 })
  foot.position.z = -10
  page.add(foot)
  page.add(kit.shadow(230, 120))
  page.position.copy(onFloor(0, -40))
  page.rotation.y = Math.PI / 4 - 0.35
  root.add(page)

  // Dashboard, acostado, con barras en 3D.
  const dash = new Group()
  dash.add(kit.slab(176, 124, 6, { r: 12 }))
  dash.add(kit.text(-72, -46, [48], 0, 6.4))
  dash.add(kit.rrect(52, -46, 40, 10, 5, 6.4))
  ;[18, 30, 24, 42, 36, 52].forEach((h, i) => {
    const bar = kit.box(14, h, 14)
    bar.position.set(-62 + i * 24, 6 + h / 2, 22)
    dash.add(bar)
  })
  dash.add(kit.segments([-76, 6.4, 34, 76, 6.4, 34]))
  dash.add(kit.shadow(240, 190))
  dash.position.copy(onFloor(146, 18))
  dash.rotation.y = -0.1
  root.add(dash)

  // Lupa: el acento. Mira a la cámara, así el vidrio de Essentia (un círculo
  // en pantalla) calza con el aro. Acá van el aro y el mango; el vidrio, encima.
  const R = 50
  const lens = new Group()
  // Apenas inclinada, para que el aro y el mango muestren volumen.
  lens.quaternion
    .setFromRotationMatrix(new Matrix4().lookAt(CAMERA_DIR, new Vector3(), new Vector3(0, 1, 0)))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 1, 0).normalize(), 0.16))
  // Con el acento sólido, la lupa entera es `deep`: aro, cuello y mango.
  const solid = kit.solid ? { line: kit.strong, top: kit.deep, side: kit.deep, front: kit.deep } : { line: kit.strong }
  const rim = new Mesh(new TorusGeometry(R + 3, kit.solid ? 5 : 3.5, 12, 64), kit.solid ? kit.deep : kit.top)
  lens.add(rim)
  const ring = new Group()
  ring.rotation.x = Math.PI / 2
  ring.add(kit.circle(0, 0, R + 6.5, 0, kit.strong, 64))
  ring.add(kit.circle(0, 0, R - 0.5, 0, kit.strong, 64))
  lens.add(ring)
  const handle = kit.box(74, 12, 12, solid)
  const away = R + 6 + 37
  handle.position.set(away * Math.SQRT1_2, -away * Math.SQRT1_2, 0)
  handle.rotation.z = -Math.PI / 4
  lens.add(handle)
  // El cuello entre el aro y el mango.
  const neck = new Mesh(new CylinderGeometry(4, 4, 10, 16), kit.solid ? kit.deep : kit.top)
  neck.position.set((R + 8) * Math.SQRT1_2, -(R + 8) * Math.SQRT1_2, 0)
  neck.rotation.z = Math.PI / 4
  lens.add(neck)
  root.add(lens)

  // Se detiene delante de cada objeto, entre él y la cámara: en pantalla, encima.
  const stops = [
    onFloor(-150, 10).setY(10),
    onFloor(0, -40).setY(72),
    onFloor(146, 18).setY(30),
  ].map((p) => p.addScaledVector(CAMERA_DIR, 150))
  const center = new Vector3()
  const info: Lens = { center, radius: R }

  return {
    root,
    lens: info,
    update(t) {
      // Tres paradas de 3.2 s: viaja 1.2 s y se queda mirando 2 s.
      const T = 3.2
      const k = Math.floor(t / T) % 3
      const f = ease(clamp01((t % T) / 1.2))
      center.copy(stops[k]!).lerp(stops[(k + 1) % 3]!, f)
      center.y += Math.sin(t * 1.6) * 3
      lens.position.copy(center)
    },
  }
}

// ── 2. Lo dividimos en hitos: cadena de producción ───────────────
function milestones(kit: Kit): Figure {
  const root = new Group()
  root.add(kit.dotGrid(320))
  const L = 470
  const line = new Group()

  for (const x of [-180, 0, 180]) {
    for (const z of [-30, 30]) {
      const leg = kit.box(10, 26, 10)
      leg.position.set(x, 13, z)
      line.add(leg)
    }
  }
  const belt = kit.slab(L, 84, 14)
  belt.position.y = 26
  line.add(belt)
  const top = 40.4
  line.add(kit.segments([-L / 2 + 16, top, -32, L / 2 - 16, top, -32, -L / 2 + 16, top, 32, L / 2 - 16, top, 32]))
  const rollers: number[] = []
  for (let x = -L / 2 + 28; x <= L / 2 - 28; x += 22) rollers.push(x, top, -32, x, top, 32)
  line.add(kit.segments(rollers))
  line.add(kit.shadow(L + 120, 200))

  // Estaciones: los hitos.
  for (const gx of [-110, 30, 170]) {
    const gate = new Group()
    for (const z of [-50, 50]) {
      const post = kit.box(10, 96, 10)
      post.position.set(0, 74, z)
      gate.add(post)
    }
    const beam = kit.box(10, 12, 110)
    beam.position.set(0, 128, 0)
    gate.add(beam)
    const flag = kit.slab(30, 22, 3, { r: 5 })
    flag.rotation.x = Math.PI / 2
    flag.position.set(0, 152, 0)
    gate.add(flag)
    gate.position.x = gx
    line.add(gate)
  }

  // Paquetes en fila: el oscuro es el hito en curso.
  const boxes: Group[] = []
  const N = 6
  const gap = L / N
  for (let i = 0; i < N; i++) {
    const accent = i === 2
    const pack = new Group()
    const body = accent ? kit.box(42, 42, 42, { line: kit.strong, top: kit.deep, side: kit.deep, front: kit.deep }) : kit.box(42, 42, 42)
    body.position.y = 21
    pack.add(body)
    pack.add(kit.segments([-21, 42.4, 0, 21, 42.4, 0, 0, 42.4, -21, 0, 42.4, 21], accent ? kit.onDeep : kit.normal))
    line.add(pack)
    boxes.push(pack)
  }
  line.rotation.y = 0.18
  root.add(line)

  return {
    root,
    update(t) {
      const speed = 26
      boxes.forEach((pack, i) => {
        const s = ((i * gap + t * speed) % L) - L / 2
        const edge = Math.min(s + L / 2, L / 2 - s)
        const grow = ease(clamp01((edge - 6) / 34))
        pack.position.set(s, top - 0.4, 0)
        pack.scale.set(1, Math.max(0.001, grow), 1)
        pack.visible = grow > 0.01
      })
    },
  }
}

// ── 3. Construimos con verificación: página con varias tareas ────
function verify(kit: Kit): Figure {
  const root = new Group()
  root.add(kit.dotGrid(300))

  const doc = new Group()
  const W = 250
  const H = 350
  doc.add(kit.slab(W, H, 6))
  const y = 6.4
  doc.add(kit.text(-W / 2 + 28, -H / 2 + 30, [70], 0, y))
  const barZ = -H / 2 + 54
  doc.add(kit.rrect(0, barZ, W - 56, 8, 4, y))
  const progress = kit.segments([0, 0, 0, 1, 0, 0], kit.strong)
  doc.add(progress)

  const rows = 5
  const rowH = 42
  const rowGap = 10
  const z0 = -H / 2 + 84
  const cardW = W - 40
  const tasks = Array.from({ length: rows }, (_, i) => {
    const card = new Group()
    const plain = kit.slab(cardW, rowH, 4, { r: 10 })
    // Con el acento sólido, la tarea en curso es una tarjeta `deep` con el check en claro.
    const active = kit.slab(cardW, rowH, 4, kit.solid ? { r: 10, line: kit.strong, top: kit.deep } : { r: 10, line: kit.strong })
    card.add(plain, active)
    const cx = -cardW / 2 + 24
    card.add(kit.rrect(cx, 0, 18, 18, 5, 4.4))
    card.add(kit.text(-cardW / 2 + 44, -5, [i % 2 ? 110 : 132, i % 2 ? 70 : 54], 11, 4.4))
    const check = (material = kit.normal) =>
      kit.polyline([new Vector3(cx - 5, 4.6, 0), new Vector3(cx - 1, 4.6, 4), new Vector3(cx + 6, 4.6, -5)], material)
    const done = check()
    const doing = check(kit.solid ? kit.onDeep : kit.strong)
    card.add(done, doing)
    card.position.z = z0 + i * (rowH + rowGap) + rowH / 2
    doc.add(card)
    return { card, plain, active, done, doing }
  })

  // La página flota de pie, girada hacia la cámara.
  doc.rotation.x = Math.PI / 2 - 0.22
  doc.position.y = H / 2 + 30
  const holder = new Group()
  holder.add(doc)
  holder.rotation.y = Math.PI / 4 - 0.28
  holder.scale.setScalar(0.74)
  root.add(holder)
  root.add(kit.shadow(280, 150))

  return {
    root,
    update(t) {
      // Una tarea cada 1.1 s; al final, una pausa y vuelve a empezar.
      const step = 1.1
      const c = t % (rows * step + 2.2)
      const current = Math.floor(c / step)
      tasks.forEach((task, i) => {
        const isActive = i === current
        const lift = isActive ? ease(clamp01((c - i * step) / 0.35)) : 0
        task.card.position.y = y - 0.4 + lift * 10
        task.plain.visible = !isActive
        task.active.visible = isActive
        task.done.visible = i < current
        task.doing.visible = isActive && c - i * step > 0.4
      })
      const fraction = Math.min(current, rows) / rows
      const x0 = -(W - 56) / 2 + 4
      progress.geometry.setPositions([x0, y + 0.2, barZ, x0 + Math.max(0.001, (W - 64) * fraction), y + 0.2, barZ])
      progress.visible = fraction > 0
    },
  }
}

// ── 4. Lo apruebas tú: mockups de computadora y celular ──────────
function approve(kit: Kit): Figure {
  const root = new Group()
  root.add(kit.dotGrid(320))

  const laptop = new Group()
  const BW = 290
  const BD = 190
  laptop.add(kit.slab(BW, BD, 10, { r: 14 }))
  const keys: number[] = []
  const kx0 = -BW / 2 + 26
  const kz0 = -BD / 2 + 22
  const kw = (BW - 52) / 12
  for (let r = 0; r <= 5; r++) keys.push(kx0, 10.4, kz0 + r * 15, kx0 + kw * 12, 10.4, kz0 + r * 15)
  for (let c = 0; c <= 12; c++) keys.push(kx0 + c * kw, 10.4, kz0, kx0 + c * kw, 10.4, kz0 + 75)
  laptop.add(kit.segments(keys))
  laptop.add(kit.rrect(0, BD / 2 - 42, 96, 52, 8, 10.4))

  // Pantalla, abierta hacia atrás, con una interfaz esquemática.
  const screen = new Group()
  const SW = 290
  const SH = 186
  screen.add(kit.slab(SW, SH, 7, { r: 14 }))
  const sy = 7.4
  screen.add(kit.rrect(0, 0, SW - 24, SH - 24, 8, sy))
  screen.add(kit.segments([-SW / 2 + 12, sy, -SH / 2 + 34, SW / 2 - 12, sy, -SH / 2 + 34]))
  screen.add(kit.segments([-SW / 2 + 66, sy, -SH / 2 + 34, -SW / 2 + 66, sy, SH / 2 - 12]))
  screen.add(kit.text(-SW / 2 + 24, -SH / 2 + 52, [28, 34, 24, 30], 16, sy))
  const cards = [0, 1, 2].map((i) => kit.rrect(-34 + i * 62, -22, 52, 40, 6, sy))
  const lit = [0, 1, 2].map((i) => kit.rrect(-34 + i * 62, -22, 52, 40, 6, sy, kit.strong))
  for (const c of [...cards, ...lit]) screen.add(c)
  const chart = [-60, 46, -30, 30, 0, 38, 30, 14, 60, 22, 90, 0]
  const points: Vector3[] = []
  for (let i = 0; i < chart.length; i += 2) points.push(new Vector3(-6 + chart[i]!, sy, 30 + chart[i + 1]! * 0.8))
  screen.add(kit.polyline(points))
  screen.rotation.x = Math.PI / 2
  screen.position.y = SH / 2
  const hinge = new Group()
  hinge.add(screen)
  hinge.position.set(0, 10, -BD / 2 + 4)
  hinge.rotation.x = -0.2
  laptop.add(hinge)
  laptop.add(kit.shadow(420, 300))
  laptop.position.copy(onFloor(-50, -20))
  laptop.rotation.y = 0.2
  laptop.scale.setScalar(0.86)
  root.add(laptop)

  // Celular, de pie, con el sello de aprobación: el acento.
  const phone = new Group()
  const body = new Group()
  const PW = 88
  const PH = 176
  body.add(kit.slab(PW, PH, 8))
  const py = 8.4
  body.add(kit.rrect(0, 0, PW - 12, PH - 12, 11, py))
  body.add(kit.rrect(0, -PH / 2 + 14, 22, 5, 2.5, py))
  body.add(kit.text(-PW / 2 + 16, PH / 2 - 52, [56, 40, 50], 12, py))
  const seal = new Group()
  const disc = new Mesh(new CylinderGeometry(22, 22, 3, 40), kit.deep)
  disc.position.y = 1.5
  seal.add(disc)
  seal.add(kit.circle(0, 0, 22, 3.2, kit.strong, 40))
  seal.add(kit.polyline([new Vector3(-9, 3.4, 0), new Vector3(-3, 3.4, 6), new Vector3(10, 3.4, -7)], kit.onDeep))
  seal.position.set(0, py, -14)
  body.add(seal)
  body.rotation.x = Math.PI / 2 - 0.08
  body.position.y = PH / 2 + 10
  phone.add(body)
  const stand = kit.slab(60, 34, 10, { r: 10 })
  stand.position.z = -6
  phone.add(stand)
  phone.add(kit.shadow(160, 110))
  phone.position.copy(onFloor(196, 70))
  phone.rotation.y = Math.PI / 4 - 0.5
  root.add(phone)
  const phoneY = phone.position.y

  return {
    root,
    update(t) {
      // Las tarjetas se encienden de a una y después llega el sello.
      const c = t % 5
      cards.forEach((card, i) => {
        const on = c > 0.4 + i * 0.5 && c < 2.2
        card.visible = !on
        lit[i]!.visible = on
      })
      const grow = c < 2.2 ? 0 : clamp01((c - 2.2) / 0.25)
      const bounce = 1 + Math.sin(clamp01((c - 2.2) / 0.5) * Math.PI) * 0.18
      seal.scale.setScalar(Math.max(0.001, grow * bounce))
      seal.visible = grow > 0
      phone.position.y = phoneY + Math.sin(t * 1.1) * 2
    },
  }
}
