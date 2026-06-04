---
title: isMobile
subpath: pota/use/browser
topic: Environment
desc: true when the user agent looks like a mobile device.
---

# isMobile

`isMobile` is a boolean from [`pota/use/browser`](/use/browser),
`true` when `navigator.userAgent` matches _mobile_, _iphone_, _ipod_,
_ios_, _ipad_, or _android_. It is evaluated once at module load — a
coarse UA guard, not a live signal.

## Examples

### Branch on mobile

Reads the boolean once and runs a mobile-only branch behind the guard.

```jsx
import { isMobile } from 'pota/use/browser'

if (isMobile) {
	/* ... */
}
```
