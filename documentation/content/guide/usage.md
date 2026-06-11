---
title: Usage
subpath: guide
topic: Getting started
desc:
  Install pota, wire up the Babel preset (or go compiler-less), and
  ship your first sketch.
---

# Usage

Install pota, wire up the Babel preset (or go compiler-less), and ship
your first sketch. Starter templates live in the
[pota-templates](https://github.com/potahtml/templates) repo — PRs
welcome. The recommended template is **rollup**; a **vite** template
is also available.

## Rollup (recommended)

Very customizable, you are in control.

```bash
npx degit potahtml/templates/rollup-js pota-rollup-js-project
cd pota-rollup-js-project
npm install --include=dev
npm run dev
npm run serve
```

## Vite (JavaScript)

```bash
npx degit potahtml/templates/vite-js pota-vite-js-project
cd pota-vite-js-project
npm install --include=dev
npm run dev
```

## Babel preset

pota provides an optimized and customized Babel preset for
transforming JSX in a _better_ way, inspired by
[dom-expressions](https://github.com/ryansolid/dom-expressions), but
you may use `tsc`, `transform-react-jsx`, or any transform that
somewhat follows `react-transform`.

```json
{ "babel": { "presets": [["pota/babel-preset"]] } }
```

## Compiler-less

No build step? Use the [`xml`](/xml/xml) tagged-template API — it
parses HTML-like markup at runtime and produces JSX-equivalent
components.

## Entry points

The importable subpaths, in one place. Handy as a map when wiring
bundler aliases or vendoring pota. Each `pota/use/*` module is one
subpath per file under `src/use/`.

```js
import 'pota' // reactive primitives, renderer, prop helpers
import 'pota/components' // built-in UI and routing components
import 'pota/components/Linkify' // Linkify ships as its own subpath
import 'pota/store' // reactive store helpers
import 'pota/xml' // compiler-less XML tagged template
import 'pota/jsx-runtime' // JSX runtime (pota/jsx-dev-runtime mirrors it)
import 'pota/babel-preset' // the JSX → partials transform

// composables — one subpath per file under src/use/
import 'pota/use/clickoutside'
import 'pota/use/css'
import 'pota/use/form'
import 'pota/use/location'
// …and the rest of pota/use/*
```

## Examples

### First sketch

A minimal counter. Native elements use `on:click`; pass the reader
method `count.read` (not `count.read()`) as a child so the renderer
re-runs it on every change, and `update` bumps from the previous
value.

```jsx
import { render, signal } from 'pota'

function App() {
	const count = signal(0)

	return (
		<main>
			<p>Count: {count.read}</p>
			<button on:click={() => count.update(n => n + 1)}>+1</button>
		</main>
	)
}

render(App)
```

### Compiler-less with xml

Skip the build step entirely: the [`xml`](/xml/xml) tagged template
parses markup at runtime, so the same counter runs straight in the
browser. Markup is parsed as XML, so it must be well-formed — quote
every attribute value (including interpolated handlers) and close
every tag.

```jsx
import { render, signal } from 'pota'
import { xml } from 'pota/xml'

function App() {
	const count = signal(0)

	return xml`
		<main>
			<p>Count: ${count.read}</p>
			<button on:click="${() => count.update(n => n + 1)}">+1</button>
		</main>
	`
}

render(App)
```
