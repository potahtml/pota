---
paths:
  - 'src/components/**'
  - 'src/use/**'
---

# Built-in components and `use/*` modules

- Components ship under the `pota/components` export; composables
  under `pota/use/*` per `package.json` `"exports"`.
- Match patterns used in sibling files: naming, prop handling, and how
  signals / store interact with the renderer.
- Adding a new `use/*` module usually requires a matching declaration
  under the `generated/types/use/` layout (via tsc) and an export map
  entry—follow existing pairs.
- Tests for components live under `tests/api/components/` (Puppeteer).
  Run `npm test` to verify behavior.
- Run `npm run build:ts` (or `watch:ts` during dev) after API-visible
  changes.
- Docs and examples should follow pota JSX conventions: native
  elements use `on:*` event props and `class=`; custom components use
  camelCase event props (e.g. `onClick`). See
  `documentation/AGENTS.md` (Library Semantics → JSX and DOM).

## Ref factories over `use:<name>` directives

The element-attached side of every new `use/*` plugin must be a **ref
factory** consumed via `use:ref`, not a custom `use:<name>`
propsPlugin. `use:ref` is the single registered lifecycle attribute;
`propsPlugin` registrations for new directive names are deprecated.

```js
// ✅ ship a ref factory: opts → (node: Element) => void
export const clickOutside = handler => node => {
	/* … */
}

// at the call site:
;<div use:ref={clickOutside(handler)} />
```

Concretely:

- Don't call `propsPlugin('use:foo', ...)` for new plugins. Existing
  factories (`visible`, `clickOutside`, `scrollIntoView`, `lazyImage`,
  etc.) already follow the pattern — match them.
- Don't add new `'use:<name>'?` slots to
  `typescript/jsx/namespace.d.ts`. The existing `'use:ref'`,
  `'use:connected'`, `'use:disconnected'`, plus the grandfathered
  `'use:bind'`, are enough.
- Multiple refs on one element compose via array:
  `use:ref={[clickOutside(h), preventEnter]}`.

### Exception: `bind`

`bind` is the one intentional holdout. It ships as a
`propsPlugin('use:bind', …)` and `bind(initial)` itself returns a
`SignalFunction` — so a single call covers both the cell and the
directive value:

```jsx
const value = bind('hello')   // SignalFunction
<input use:bind={value}/>
```

Don't migrate `bind` to a ref factory and don't introduce new plugins
that copy its dual-purpose shape; this pattern is grandfathered for
`bind` only.
