---
title: isFirefox
subpath: pota/use/browser
topic: Environment
desc: true when the user agent contains "firefox".
---

# isFirefox

`isFirefox` is a boolean from [`pota/use/browser`](/use/browser),
`true` when the user agent contains _firefox_. Evaluated once at
module load — prefer feature detection where you can, and reserve this
for genuine Firefox-specific branches.

## Examples

### Branch on Firefox

Reads the boolean once and runs Firefox-only code behind the guard.

```jsx
import { isFirefox } from 'pota/use/browser'

if (isFirefox) {
	/* ... */
}
```
