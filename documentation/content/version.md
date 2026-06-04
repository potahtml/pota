---
title: version
subpath: pota
topic: Utilities
desc: The version string of the running pota package.
---

# version

`version` is a string export — the version of the running `pota`
package. Handy for footer credits, debug overlays, and version-gated
feature checks.

## Examples

### Footer credit

Reads the `version` string straight into the rendered output.

```jsx
import { render, version } from 'pota'

function App() {
	return (
		<footer>
			powered by pota <code>v{version}</code>
		</footer>
	)
}

render(App)
```
