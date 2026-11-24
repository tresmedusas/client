/**
 * Contenido del sitio. Es la única fuente: la capa semántica (las rutas, el
 * HTML que indexan los buscadores y que se lee sin WebGL) y la escena del
 * canvas (`lib/scene/*`) dibujan lo mismo desde acá.
 *
 * Reglas de comunicación de Tres Medusas que este texto respeta:
 * - se vende la solución, no la tecnología (la IA y la automatización no son el titular);
 * - nada de «calidad garantizada» ni métricas que no estén medidas;
 * - tono claro y directo, sin jerga.
 *
 * Lo marcado con TODO es provisorio: placeholders hasta tener el contenido real.
 */

/** Contacto. TODO: dominio, página de empresa y número de WhatsApp reales. */
export const CONTACT = {
  email: 'hola@tresmedusas.com',
  linkedin: 'https://www.linkedin.com/company/tres-medusas',
  /** Número con código de país, solo dígitos (formato de wa.me). TODO: el real. */
  whatsapp: '10000000000',
  /** Mensaje con el que se abre la conversación. */
  whatsappMessage: 'Hola, quiero contarles un proceso que hoy hacemos a mano.',
} as const

export const SITE = {
  name: 'Tres Medusas',
  title: 'Tres Medusas — Software a medida e integraciones',
  description:
    'Resolvemos operaciones manuales y procesos fragmentados con software a medida e integraciones. Cada cambio pasa por tests, revisión y tu aprobación antes de llegar a tu sistema.',
} as const

export interface Link {
  label: string
  href: string
}

/** Escena de una página: su id es el ancla (`#nosotros`) y el `<section>` de la capa semántica. */
export interface Section {
  id: string
  /** Número de la escena, como se muestra: «01». */
  index: string
  label: string
  title: string
  intro?: string
}

export interface Item {
  title: string
  body: string
}

/**
 * El contacto principal: no hay agenda, se escribe por WhatsApp y desde ahí se
 * coordina la llamada.
 */
const WRITE_US: Link = {
  label: 'Escríbenos por WhatsApp',
  href: `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`,
}

/** Navegación fija. Las anclas de la home funcionan también desde otra página. */
export const NAV: readonly Link[] = [
  { label: 'Cómo trabajamos', href: '/#como-trabajamos' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Contacto', href: '/#contacto' },
]

// ── Home ─────────────────────────────────────────────────────────

/** Hero: la marca, qué hacemos y un botón que lleva a cómo trabajamos. Va a la izquierda, con el logo animado a la derecha. */
export const HERO = {
  id: 'inicio',
  /**
   * El titular: «Construimos el software que tu empresa necesita.», con
   * palabras que van rotando (pedido del usuario, 2026-11-24). El texto fijo
   * va en `muted` y regular; las palabras que rotan, en `ink` y black. Arma
   * el texto `scene/headline.ts`.
   */
  headline: {
    before: 'Construimos',
    /** Qué construimos: artículo y sustantivo, que concuerdan. */
    what: [
      ['el', 'software'],
      ['la', 'identidad'],
      ['el', 'diseño'],
    ],
    /** En escritorio, la segunda línea empieza acá. */
    middle: 'que tu',
    /** Para quién. */
    who: ['empresa', 'negocio', 'emprendimiento'],
    after: 'necesita.',
  },
  /** Lleva a la escena siguiente; el mismo href que en `NAV`, para que el foco del teclado encuentre el botón. */
  primary: { label: 'Conocer más', href: '/#como-trabajamos' } satisfies Link,
} as const

export const HOW_WORK = {
  section: {
    id: 'como-trabajamos',
    index: '01',
    label: 'Cómo trabajamos',
    title: 'Empezamos por el problema, no por la herramienta.',
    intro: 'Todos los proyectos recorren los mismos cuatro pasos, y nada llega a tu sistema sin tu aprobación.',
  } satisfies Section,
  /**
   * Las etapas van una debajo de la otra y cada una aparece con un fundido al
   * entrar en la ventana. Cuerpos con lead-in y una figura 3D line art
   * (DESIGN.md §4, `scene/figures/how-work.ts`). `figure` es su cuadro en
   * reposo, de 640 × 427, para la capa semántica.
   */
  steps: [
    {
      title: 'Entendemos tu operación',
      body: 'Primero, escuchamos. Vemos cómo se hace hoy, dónde se pierde el tiempo y con qué sistemas trabajas.',
      figure: '/figures/como-trabajamos-1.webp',
    },
    {
      title: 'Lo dividimos en hitos',
      body: 'Hitos claros. Antes de construir, acordamos contigo qué entrega cada hito.',
      figure: '/figures/como-trabajamos-2.webp',
    },
    {
      title: 'Construimos con verificación',
      body: 'Nada sin verificar. Cada cambio pasa por tests automáticos y por una revisión independiente.',
      figure: '/figures/como-trabajamos-3.webp',
    },
    {
      title: 'Lo apruebas tú',
      body: 'Tú tienes la última palabra. Cada hito llega con un reporte de evidencia, y solo con tu ok pasa a tu sistema.',
      figure: '/figures/como-trabajamos-4.webp',
    },
  ] satisfies (Item & { figure: string })[],
} as const

export interface Person {
  /** Ancla de la persona en la capa semántica y en su modal. */
  id: string
  name: string
  role: string
  /** Bio corta: de dónde viene y qué hace en Tres Medusas. */
  bio: string
  /** Foto cuadrada en `static/founders/` (512 px, sin metadatos); sin ella se dibujan las iniciales. */
  photo?: string
}

export const ABOUT = {
  section: {
    id: 'nosotros',
    index: '02',
    label: 'Nosotros',
    // TODO: copy definitivo.
    title: 'Tres fundadores. Un equipo que construye contigo.',
    intro: 'Hablas con quien construye. Entendemos tu proceso y construimos tu sistema, de la primera llamada a la entrega.',
  } satisfies Section,
  foundersLabel: 'Fundadores',
  /** La card de cada fundador y su modal («Conocer a …»). */
  card: {
    label: 'Fundador',
    /** Con el nombre de pila: entra en el pie de la card. */
    cta: (name: string) => `Conocer a ${name.split(' ')[0]}`,
    close: 'Cerrar',
  },
  // TODO: bios reales. El equipo actual no se muestra por ahora.
  // Cada bio abre con una oración corta (2 a 6 palabras) que hace de lead-in.
  founders: [
    { id: 'sofia-dome', name: 'Sofia Dome', role: 'Sr Designer', bio: 'Bio por definir. De dónde viene y qué hace en Tres Medusas.', photo: '/founders/sofia-dome.jpg' },
    { id: 'uriel-rivero', name: 'Uriel Rivero', role: 'Sr Software Engineer', bio: 'Bio por definir. De dónde viene y qué hace en Tres Medusas.', photo: '/founders/uriel-rivero.jpg' },
    { id: 'matias-caballero', name: 'Matias Caballero', role: 'Sr Software Engineer', bio: 'Bio por definir. De dónde viene y qué hace en Tres Medusas.', photo: '/founders/matias-caballero.jpg' },
  ] satisfies Person[] as readonly Person[],
} as const

export const CONTACT_SECTION = {
  section: {
    id: 'contacto',
    index: '03',
    label: 'Contacto',
    title: 'Cuéntanos tu proceso.',
    intro: 'Una llamada corta basta. Escríbenos qué se hace hoy a mano y vemos si podemos ayudarte.',
  } satisfies Section,
  primary: WRITE_US,
  secondary: { label: CONTACT.email, href: `mailto:${CONTACT.email}` } satisfies Link,
  tertiary: { label: 'LinkedIn', href: CONTACT.linkedin } satisfies Link,
} as const

/** Escenas de la home, en orden. */
export const HOME_SCENES = [HERO.id, HOW_WORK.section.id, ABOUT.section.id, CONTACT_SECTION.section.id] as const

// ── Showcase ─────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  client: string
  /** Qué tipo de trabajo fue: «Integración», «Sistema interno». */
  tags: readonly string[]
  problem: string
  solution: string
  /** Imagen 16:10 en `static/`; sin ella se dibuja un panel de la marca. */
  image?: string
}

export const SHOWCASE = {
  section: {
    id: 'showcase',
    index: '',
    label: 'Showcase',
    title: 'Lo que ya construimos.',
    intro: 'Cada proyecto empezó con un proceso que se hacía a mano.',
  } satisfies Section,
  title: 'Showcase — Tres Medusas',
  description: 'Proyectos de software a medida e integraciones construidos por Tres Medusas.',
  problemLabel: 'El problema',
  solutionLabel: 'Lo que hicimos',
  // TODO: proyectos reales (sin métricas que no estén medidas).
  projects: [
    {
      id: 'proyecto-1',
      name: 'Proyecto de ejemplo 1',
      client: 'Cliente por definir',
      tags: ['Integración'],
      problem: 'Descripción breve del proceso que se hacía a mano.',
      solution: 'Descripción breve de lo que construimos y cómo se usa hoy.',
    },
    {
      id: 'proyecto-2',
      name: 'Proyecto de ejemplo 2',
      client: 'Cliente por definir',
      tags: ['Sistema interno'],
      problem: 'Descripción breve del proceso que se hacía a mano.',
      solution: 'Descripción breve de lo que construimos y cómo se usa hoy.',
    },
    {
      id: 'proyecto-3',
      name: 'Proyecto de ejemplo 3',
      client: 'Cliente por definir',
      tags: ['Reportes'],
      problem: 'Descripción breve del proceso que se hacía a mano.',
      solution: 'Descripción breve de lo que construimos y cómo se usa hoy.',
    },
  ] satisfies Project[] as readonly Project[],
  closing: {
    section: {
      id: 'siguiente',
      index: '',
      label: 'Tu proyecto',
      title: '¿El próximo es el tuyo?',
      intro: 'Cuéntanos qué proceso te quita tiempo.',
    } satisfies Section,
    primary: WRITE_US,
    secondary: { label: 'Volver al inicio', href: '/' } satisfies Link,
  },
} as const

/** Escenas del showcase, en orden. */
export const SHOWCASE_SCENES = [SHOWCASE.section.id, ...SHOWCASE.projects.map((p) => p.id), SHOWCASE.closing.section.id] as const

// ── Términos y condiciones ───────────────────────────────────────

/** TODO: página de ejemplo; el texto legal definitivo está por escribirse. */
export const TERMS = {
  section: {
    id: 'terminos',
    index: '',
    label: 'Legal',
    title: 'Términos y condiciones.',
    intro: 'Página de ejemplo. El texto definitivo está en preparación.',
  } satisfies Section,
  title: 'Términos y condiciones — Tres Medusas',
  description: 'Términos y condiciones de uso del sitio y de los servicios de Tres Medusas.',
  items: [
    {
      title: 'Uso del sitio',
      body: 'Texto de ejemplo. Aquí van las condiciones para usar este sitio y su contenido.',
    },
    {
      title: 'Servicios',
      body: 'Texto de ejemplo. Aquí va el alcance de los servicios y cómo se acuerda cada proyecto.',
    },
    {
      title: 'Privacidad',
      body: 'Texto de ejemplo. Aquí va cómo tratamos los datos que nos compartes al escribirnos.',
    },
  ] satisfies Item[] as readonly Item[],
} as const

/** Escenas de la página de términos: una sola. */
export const TERMS_SCENES = [TERMS.section.id] as const

export type Page = 'home' | 'showcase' | 'terms'

/** Qué página del deck es una ruta. */
export function pageOf(path: string): Page {
  const clean = path.replace(/\/$/, '')
  return clean === '/showcase' ? 'showcase' : clean === '/terminos' ? 'terms' : 'home'
}

/** Escenas de cada página, por ruta. */
export function scenesOf(path: string): readonly string[] {
  return { home: HOME_SCENES, showcase: SHOWCASE_SCENES, terms: TERMS_SCENES }[pageOf(path)]
}

/** Pie de todas las páginas: logo y términos arriba; copyright y «Powered by Essentia» abajo. */
export const FOOTER = {
  terms: { label: 'Términos y condiciones', href: '/terminos' } satisfies Link,
  /** El año sale del build: el sitio se prerenderiza. */
  copyright: (year: number) => `Copyright © ${year}`,
  poweredBy: 'Powered by',
  essentia: 'Essentia',
} as const

/** Iniciales de un nombre, para el avatar sin foto: «Fundador Uno» → «FU». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
