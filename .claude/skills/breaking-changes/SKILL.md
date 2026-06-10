---
name: breaking-changes
description:
  Migrate a pota app (code that uses pota) across pota's breaking
  changes — update an app when bumping the pota dependency or when it
  calls a removed, renamed, or changed API. Use when upgrading pota,
  fixing errors after a pota bump, or modernizing old pota usage
  (signal tuples, use:* behavior plugins, @static, the
  pota/web→pota/components renames, attribute-first props). When a
  migration here is unclear or missing, the installed pota source in
  node_modules/pota is the ground truth.
---

# Migrating a pota app across versions

Use this when updating code that **uses** pota — bumping the
dependency, or fixing an app that calls an API pota removed, renamed,
or changed. It collects the migrations you're most likely to hit; when
something here is unclear or missing, the installed pota source is the
ground truth (see the end).

**Scope it:** find the pota version the app is on and the one it's
moving to, then apply every change below tagged with a version in that
range. The big, every-app migrations follow.

## Signals — tuple form removed (0.20.234)

`signal()` returns a single object, not a destructurable tuple.

```js
// before
const [read, write, update] = signal(0)

// after
const count = signal(0)
count.read()
count.write(1)
count.update(n => n + 1)
```

Types: `SignalObject<T>` → `Signal<T>`; `SignalTuple<T>` is gone.

## `use:*` behavior plugins → `use:ref` factories (0.20.234)

The built-in `use:clickoutside`, `use:clipboard`, `use:fullscreen`,
`use:prevent-enter`, `use:click-selects-all`,
`use:click-focus-children-input`, `use:enter-focus-next`,
`use:size-to-input`, and `use:clickoutsideonce` directives are gone.
Import the matching factory from `pota/use/*` and pass it through the
single `use:ref`:

```jsx
// before
<div use:clickoutside={handler}/>
<button use:clipboard="copy"/>
<input use:prevent-enter={true}/>

// after
import { clickOutside } from 'pota/use/clickoutside'
import { clipboard } from 'pota/use/clipboard'
import { preventEnter } from 'pota/use/form'

<div use:ref={clickOutside(handler)}/>
<button use:ref={clipboard('copy')}/>
<input use:ref={preventEnter}/>
```

- `use:clickoutsideonce` → `clickOutside(handler, { once: true })`.
- Parameterized helpers (`clickOutside`, `clipboard`, `fullscreen`)
  are factories — call them. Parameterless ones (`preventEnter`,
  `clickSelectsAll`, `enterFocusNext`, …) are the ref directly.
- Compose several with an array:
  `use:ref={[clickOutside(h), preventEnter]}`.
- `use:ref`, `use:connected`, `use:disconnected`, `use:css`, and
  `use:bind` are unchanged.

## `@static` JSX marker removed (0.20.234)

Just delete the comment — the expression compiles the same.

```jsx
// before
<div prop:value={/* @static */ compute()} />
// after
<div prop:value={compute()} />
```

## Removed / moved exports (0.20.234, 0.20.233)

- `Linkify` is no longer re-exported from `pota/components` — import
  it from `pota/components/Linkify`.
- `propsPlugin` / `propsPluginNS` are no longer exported; for
  per-element behavior use a `use:ref` factory from `pota/use/*`.
- `firewall` removed from `pota/store`; `validatePassword` removed
  from `pota/use/string` (both were placeholders).
- `Derived.run()` removed — store the dependency in a signal and write
  to that signal instead.

## Boolean children no longer render as text (0.20.228)

`<p>{true}</p>` now renders nothing (matching React/Solid). So
`{cond && <X/>}` renders nothing when `cond` is falsy instead of
printing `"false"`. To show a boolean as text, wrap it:
`{String(value)}`.

## The rename wave (0.18.184)

If the app predates 0.18.184, expect a broad sweep:

| before                                  | after                          |
| --------------------------------------- | ------------------------------ |
| `ref=`                                  | `use:ref=`                     |
| `css=`                                  | `use:css=`                     |
| `onMount`                               | `use:connected`                |
| `onUnmount`                             | `use:disconnected`             |
| `import … 'pota/web'`                   | `'pota/components'`            |
| `import … 'pota/html'`                  | `'pota/xml'`                   |
| `html` tagged template                  | `xml`                          |
| `Router`                                | `Route`                        |
| `location.query`                        | `location.searchParams`        |
| `pota/plugin` / `pota/plugin/useFoo.js` | `pota/use` / `pota/use/foo.js` |
| `onLoaded` (async fns)                  | `onLoad`                       |

Same release made DOM **attribute-first**, so several properties now
need the `prop:` namespace:

- `innerHTML` → `prop:innerHTML`
- `textContent` → `prop:textContent`
- `srcObject` → `prop:srcObject`
- `indeterminate` → `prop:indeterminate` (on a checkbox)
- `<textarea value={v}/>` → `<textarea>{v}</textarea>`

## Behavior changes that may need no code edit

These changed runtime behavior rather than syntax — check assumptions
instead of swapping calls:

- **Duplicate attributes** — last wins: `<div class="1" class="2"/>`
  yields `class="2"` (0.19.211).
- **Spreads** behave like JavaScript now — multiple spreads or a mix
  of attrs and spreads merge into one object, later keys win
  (0.19.207).
- **`Collapse`** no longer renders a `<pota-collapse>` custom element;
  it wraps children in a plain `<div>`. Re-target any `pota-collapse`
  query (0.20.230).
- **Rejected promises** in bare promise children, `derived`, and
  `action` chains now route to the nearest `Errored` / `catchError`
  boundary instead of becoming unhandled rejections (0.20.229,
  0.20.228).

## Workflow

Grep the app for the old pattern, replace per above, then run the
app's type-check and tests.

**When in doubt, read the installed source.** The pota the app
actually runs lives in `node_modules/pota/`, and it is the ground
truth for that exact installed version — trust it over any summary,
this skill included. Check there before assuming an API's shape:

- **Exact version** — `node_modules/pota/package.json` `"version"`.
- **Real source** — follow that file's `"exports"` map to the module
  (`pota` → `src/exports.js`, `pota/components` →
  `src/components/@main.js`, `pota/store` → `src/lib/store.js`, …) and
  read the actual signature; types sit under `typescript/` and
  `generated/types/`.

(Maintainers: how to add an entry to this skill when you ship a
breaking change lives in `.claude/rules/release.md`, not in this
consumer-facing body.)
