# Trampas conocidas

Detalles no obvios que ya costaron tiempo. Sumá uno solo cuando lo descubras de verdad, con la fecha si depende de algo externo, y borralo cuando deje de aplicar.

## Formato de una entrada

```md
- **Síntoma, como se ve desde afuera (al DD/MM/AAAA, librería x.y).** Causa en una o dos frases. Qué hace el código para evitarlo, con el archivo o la función donde está el arreglo. Qué revisar cuando se actualice la librería.
```

- **El título es el síntoma,** no la causa: quien llega acá busca lo que está viendo ("un cambio de prop no se ve", "el build falla con X").
- **Fecha y versión** cuando depende de algo externo (navegador, librería, servicio): así se sabe cuándo volver a probar.
- **Apuntá al código** que ya lo resuelve, para que nadie lo "simplifique".
- **Una sección por área** (escena, capa semántica), y una final para toolchain.

## Escena (three, Threlte, Essentia)

<!-- Vacío hasta que aparezca la primera. -->

## Capa semántica y SvelteKit

<!-- Vacío hasta que aparezca la primera. -->

## Toolchain

<!-- Vacío hasta que aparezca la primera. -->

## Convenciones con contradicciones heredadas

Cuando una guía vieja o parte del código dice una cosa y la regla vigente es otra, anotalo acá con la regla que vale y el enlace a la guía.

- **Commits en español y sin tipo (hasta el 27/11/2026).** El historial anterior a estas guías usa una frase en español (`Página de cada caso y transición al abrirla desde el showcase`). Desde esa fecha vale Conventional Commits en inglés ([`git.md`](./git.md#commits)). El historial no se reescribe.
