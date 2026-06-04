---
title: setFaviconBadge
subpath: pota/use/favicon
topic: Browser
desc: One-shot favicon badge; returns a Promise.
---

# setFaviconBadge

Draws the favicon badge once. Pass a string or number to draw it; pass
`null` / `undefined` / empty string to redraw the icon without one. It
returns a promise that resolves once the icon swap is applied, so you
can `await` it when sequencing UI feedback. See
[`pota/use/favicon`](/use/favicon) for how the redraw works; for
reactive updates use
[`useFaviconBadge`](/use/favicon/useFaviconBadge).

## Arguments

| name       | type                                      | description                                                           |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `badge?`   | `string \| number \| null \| undefined`   | text to draw on the badge; falsy redraws the icon without a badge     |
| `options?` | `{ background?: string; color?: string }` | badge fill color (default `'red'`) and text color (default `'white'`) |

**Returns:** `Promise<void>` — resolves once the favicon has been
redrawn (or immediately when it is a no-op).

## Examples

### Draw, recolor, and clear

Sets an unread count, overrides the badge colors, then clears it. Each
call rewrites the favicon's `link.href`.

```jsx
import { setFaviconBadge } from 'pota/use/favicon'

await setFaviconBadge(3) // "3" on a red dot
await setFaviconBadge(3, { background: '#0a84ff', color: 'white' })
await setFaviconBadge(null) // back to the plain icon
```
