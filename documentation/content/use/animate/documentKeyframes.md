---
title: documentKeyframes
subpath: pota/use/animate
topic: Animation
desc: Map every @keyframes rule in the document by name.
---

# documentKeyframes

`documentKeyframes()` walks both `document.styleSheets` and
`document.adoptedStyleSheets` and returns a map of every `@keyframes`
rule keyed by name, the value being its `CSSRuleList` of steps.
Cross-origin stylesheets are skipped silently (reading their
`cssRules` throws). Intended for inspection / tooling — not for
runtime hot paths. Part of [`pota/use/animate`](/use/animate).

## Arguments

Takes no arguments.

**Returns:** an object mapping each `@keyframes` name to its
`CSSRuleList` (the keyframe steps).

## Examples

### List the document's keyframes

Collects every `@keyframes` declared on the page and renders their
names. The `<style>` block contributes the rules `documentKeyframes`
finds.

```jsx
import { render } from 'pota'
import { documentKeyframes } from 'pota/use/animate'

function App() {
	return (
		<>
			<style>{`
				@keyframes fade-in { from { opacity: 0; } }
				@keyframes pulse   { 50% { transform: scale(1.3); } }
			`}</style>

			{/* the function child runs after the style is in the
			    document, so the new rules are visible to the walk */}
			<ul>
				{() =>
					Object.keys(documentKeyframes()).map(name => (
						<li>{name}</li>
					))
				}
			</ul>
		</>
	)
}

render(App)
```
