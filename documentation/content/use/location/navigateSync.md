---
title: navigateSync
subpath: pota/use/location
topic: Routing
desc:
  Synchronous navigation for tests — sets the URL and updates the
  location signal.
---

# navigateSync

`navigateSync(href, options?)` is synchronous navigation for tests: it
sets the URL and updates the location signal without going through the
async [`navigate`](/use/location/navigate) pipeline or view
transitions. Pass `{ replace: true }` to use `history.replaceState`
instead of `pushState`. Part of [`pota/use/location`](/use/location).

## Examples

### Set the URL synchronously

Updates the URL immediately so a test can assert against
[`location`](/use/location) without awaiting the async navigate
pipeline. Pass `{ replace: true }` to swap the current history entry
rather than push a new one.

```jsx
import { navigateSync } from 'pota/use/location'

navigateSync('/users/42')
navigateSync('/login', { replace: true }) // no new history entry
```
