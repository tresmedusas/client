<script lang="ts">
  import { untrack } from 'svelte'
  import type { Person } from '$lib/content.js'
  import { FONT, PALETTE } from '$lib/tokens.js'
  import Avatar from './avatar.svelte'
  import MeasuredText from './measured-text.svelte'

  /**
   * Texto de una persona. `card`: retrato arriba y bio debajo (fundadores);
   * `row`: retrato chico a la izquierda, nombre y rol al lado (equipo).
   */
  interface Props {
    person: Person
    variant: 'card' | 'row'
    /** Esquina de arriba a la izquierda. */
    x: number
    y: number
    width: number
    /** z: 1.01 sobre un panel de vidrio, 0 sin panel. */
    z?: number
    onmeasure: (height: number) => void
  }

  let { person, variant, x, y, width, z = 1.01, onmeasure }: Props = $props()

  const card = $derived(variant === 'card')
  const avatar = $derived(card ? 64 : 44)
  const textX = $derived(card ? x : x + avatar + 14)
  const textWidth = $derived(card ? width : width - avatar - 14)

  let nameHeight = $state(0)
  let roleHeight = $state(0)
  // Los props no cambian de contenido: la ausencia de bio se fija al montar.
  let bioHeight = $state(untrack(() => (person.bio && variant === 'card' ? 0 : -1)))

  const nameY = $derived(card ? -(avatar + 18) : -Math.max(0, (avatar - nameHeight - 2 - roleHeight) / 2))
  const roleY = $derived(nameY - nameHeight - 2)
  const bioY = $derived(roleY - roleHeight - 12)

  $effect(() => {
    if (nameHeight === 0 || roleHeight === 0 || bioHeight === 0) return
    onmeasure(bioHeight > 0 ? -bioY + bioHeight : Math.max(avatar, -roleY + roleHeight))
  })
</script>

<Avatar {person} size={avatar} {x} {y} {z} />
<MeasuredText
  text={person.name}
  fontSize={card ? 20 : 16}
  color={PALETTE.ink}
  font={FONT.bold}
  lineHeight={1.25}
  maxWidth={textWidth}
  x={textX}
  y={y + nameY}
  {z}
  onmeasure={(_, h) => (nameHeight = h)}
/>
<MeasuredText
  text={person.role}
  fontSize={card ? 14 : 13}
  color={card ? PALETTE.brandInk : PALETTE.muted}
  font={card ? FONT.bold : FONT.regular}
  lineHeight={1.35}
  maxWidth={textWidth}
  x={textX}
  y={y + roleY}
  {z}
  onmeasure={(_, h) => (roleHeight = h)}
/>
{#if person.bio && card}
  <MeasuredText
    text={person.bio}
    fontSize={15}
    color={PALETTE.muted}
    lineHeight={1.55}
    maxWidth={textWidth}
    x={textX}
    y={y + bioY}
    {z}
    onmeasure={(_, h) => (bioHeight = h)}
  />
{/if}
