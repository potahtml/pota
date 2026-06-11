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
hints. Note that iOS user agents also contain _mac_ ("like Mac OS X"),
so `isMac` is `true` on iPhone and iPad too — pair it with
[`isMobile`](/use/browser/isMobile) when you mean desktop macOS.

## Examples

### Branch on macOS

Reads the boolean once and runs macOS-only code behind the guard.

```jsx
import { isMac } from 'pota/use/browser'

if (isMac) {
	/* ... */
}
```
