---
title: isMac
subpath: pota/use/browser
topic: Environment
desc: true when the user agent contains "mac".
---

# isMac

`isMac` is a boolean from [`pota/use/browser`](/use/browser), `true`
when the user agent contains _mac_. Evaluated once at module load —
prefer feature detection where you can, and reserve this for genuine
macOS-specific branches, such as showing ⌘ instead of Ctrl in keyboard
hints.

## Examples

### Branch on macOS

Reads the boolean once and runs macOS-only code behind the guard.

```jsx
import { isMac } from 'pota/use/browser'

if (isMac) {
	/* ... */
}
```
