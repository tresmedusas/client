/**
 * Contenido de la landing. Es la única fuente: la capa semántica
 * (`routes/+page.svelte`, el HTML que indexan los buscadores y que se lee sin
 * WebGL) y la escena del canvas (`lib/scene/*`) dibujan lo mismo desde acá.
 *
 * Reglas de comunicación de Tres Medusas que este texto respeta:
 * - se vende la solución, no la tecnología (la IA y la automatización no son el titular);
 * - nada de «calidad garantizada» ni métricas que no estén medidas;
 * - Solutions es la arista principal; Sites va aparte y solo si entra en el alcance estándar;
 * - tono claro y directo, sin jerga.
 */

/** Contacto. TODO: reemplazar por el dominio y la página de empresa reales cuando existan. */
export const CONTACT = {
  email: 'hola@tresmedusas.com',
  linkedin: 'https://www.linkedin.com/company/tres-medusas',
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

/** Links de la navegación fija: anclas a las secciones. */
export const NAV: readonly Link[] = [
  { label: 'Qué resolvemos', href: '#que-resolvemos' },
  { label: 'Cómo entregamos', href: '#como-entregamos' },
  { label: 'Contacto', href: '#contacto' },
]

export const HERO = {
  eyebrow: 'Software a medida e integraciones',
  // Frase de posicionamiento vigente, aún por decidir.
  title: 'Resolvemos operaciones manuales y procesos fragmentados.',
  lead: 'Construimos el software y las integraciones que conectan lo que hoy se hace a mano, para que tu equipo deje de copiar datos entre sistemas.',
  primary: { label: 'Cuéntanos tu proceso', href: `mailto:${CONTACT.email}` } satisfies Link,
  secondary: { label: 'Cómo entregamos', href: '#como-entregamos' } satisfies Link,
} as const

export interface Item {
  title: string
  body: string
}

export interface Section {
  id: string
  /** Número de la sección, como se muestra: «01». */
  index: string
  label: string
  title: string
  intro?: string
}

export const PROBLEMS = {
  section: {
    id: 'que-resolvemos',
    index: '01',
    label: 'Qué resolvemos',
    title: 'Empezamos por el problema, no por la herramienta.',
    intro: 'Estos son los que más vemos. Si el tuyo no está en la lista, cuéntanoslo igual.',
  } satisfies Section,
  items: [
    {
      title: 'Datos que se copian a mano entre sistemas',
      body: 'Conectamos tus herramientas para que la información pase de una a otra sin volver a capturarla.',
    },
    {
      title: 'Procesos que viven en hojas de cálculo y correos',
      body: 'Los llevamos a un sistema propio, con pasos claros y un registro de quién hizo qué y cuándo.',
    },
    {
      title: 'Reportes que se arman a mano cada semana',
      body: 'Los generamos a partir de los datos que ya tienes, cuando los necesitas.',
    },
    {
      title: 'Sistemas que no hablan entre sí',
      body: 'Integramos tu ERP, CRM, tienda en línea o lo que uses, con integraciones hechas para tu operación.',
    },
  ] satisfies Item[],
} as const

export const DELIVERY = {
  section: {
    id: 'como-entregamos',
    index: '02',
    label: 'Cómo entregamos',
    title: 'Nada llega a tu sistema sin tu aprobación.',
    intro: 'Cada cambio recorre los mismos cuatro pasos antes de tocar tu operación.',
  } satisfies Section,
  steps: [
    { title: 'Lo escribe nuestro sistema de desarrollo', body: 'Cada cambio parte de lo que acordamos para el hito.' },
    { title: 'Lo verifican los tests', body: 'Las pruebas automáticas corren en cada cambio.' },
    { title: 'Lo revisa una segunda pasada', body: 'Una revisión independiente antes de seguir.' },
    { title: 'Lo aprueba una persona', body: 'Solo con ese ok llega a tu sistema.' },
  ] satisfies Item[],
  note: 'Tus datos no salen del proyecto.',
  evidence: {
    title: 'Un reporte de evidencia por hito',
    body: 'Al cerrar cada hito recibes un reporte con lo que se hizo y la evidencia que lo respalda: las pruebas que corrieron, las revisiones y las aprobaciones.',
  } satisfies Item,
} as const

/** Sites: complemento de Solutions, solo para lo que entra en el alcance estándar. */
export const SITES = {
  section: {
    id: 'sites',
    index: '03',
    label: 'Tres Medusas Sites',
    title: '¿Solo necesitas una web?',
    intro:
      'Hacemos webs y landings con un alcance estándar y definido de antemano. Si tu proyecto entra en ese alcance, es el camino más directo; si no, lo vemos como un proyecto a medida.',
  } satisfies Section,
  action: { label: 'Pregúntanos por Sites', href: `mailto:${CONTACT.email}?subject=Sites` } satisfies Link,
} as const

export const CONTACT_SECTION = {
  section: {
    id: 'contacto',
    index: '04',
    label: 'Contacto',
    title: 'Cuéntanos qué proceso te quita tiempo.',
    intro: 'Escríbenos con una descripción breve de cómo lo hacen hoy. Te respondemos por correo para agendar una llamada.',
  } satisfies Section,
  primary: { label: CONTACT.email, href: `mailto:${CONTACT.email}` } satisfies Link,
  secondary: { label: 'LinkedIn', href: CONTACT.linkedin } satisfies Link,
} as const

export const FOOTER = {
  tagline: 'Software a medida e integraciones.',
  /** El año sale del build: el sitio se prerenderiza. */
  copyright: (year: number) => `© ${year} Tres Medusas`,
} as const
