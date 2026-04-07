# Pota: A Reactive UI Library

## Signals

### Destructuring

- Signals provide three methods:
  `const [read, write, update] = signal()`. Only `update` receives the
  previous value.
- Recommended destructuring order: `[read, write, update]`. Avoid
  two-element destructuring like
  `const [read, updateSignal] = signal()`.

### Methods

- Use `write` (second slot) to set/replace a value directly. It does
  **not** receive the previous value: `write(newValue)`.
- Use `update` (third slot) for updaters needing the previous value:
  `update(prev => newValueOrDerived(prev))`.

### Deriving Values

- Use `memo` to derive values or create computations from signals.

### Object-Style Usage

- When a signal is already available (e.g., from context or passed as
  argument), use object style: `signal.read()`, `signal.write()`,
  `signal.update()`.
- Only destructure signals when creating them locally:
  `const [read, write, update] = signal()`.

## DOM Integration

### Event Handlers

- For native HTML elements, use `on:click={handler}`.
- For component props (custom components), use camelCase:
  `onClick={handler}`.

### Reactive Rendering

- In JSX, pass the signal itself for reactivity:
  `<b>{signalName}</b>`, **NOT** `<b>{signalName()}</b>`.

### Attributes

- Use `class=` instead of `className=` for CSS classes in JSX.

## Best Practices

- Always derive values instead of manual synchronization via effects.
- Effects are anti-patterns; prefer derivation.

## Typescript and types

- do not add `any` to workaround missing types
- do not ignore errors with comments such `// @ts-ignore` or similar
- in jsdoc, when in need to force a type use
  `(/* @type {type here} value)*/` instead of
  `/* @type {type here} value*/`
- when dealing with type errors, do not add code to avoid the error

## Reference

### Exports from src/exports.js

- `version: string` - Library version string.
- `action<T>(fn: () => T): () => T` - Creates an action that can be
  triggered.
- `asyncEffect<T>(fn: (prev?: T) => T | (() => void)): void` - Runs an
  effect asynchronously.
- `batch<T>(fn: () => T): T` - Batches multiple updates.
- `cleanup(fn: () => void): void` - Registers cleanup functions.
- `context<T>(): { id: symbol; defaultValue?: T }` - Manages context
  values.
- `derived<T>(fn: () => T): () => T` - Creates a derived signal.
- `effect<T>(fn: (prev?: T) => T | (() => void)): void` - Runs side
  effects reactively.
- `isResolved<T>(value: T | Promise<T>): value is T` - Checks if a
  promise is resolved.
- `map<T, U>(list: () => T[], mapFn: (item: T, index: () => number) => U): () => U[]` -
  Maps over reactive arrays.
- `memo<T>(fn: () => T, equal?: (a: T, b: T) => boolean): () => T` -
  Memoizes computed values.
- `on<T>(deps: () => T[], fn: () => void): () => void` - Reacts to
  changes in dependencies.
- `owned<T>(fn: () => T): T` - Manages ownership of reactive values.
- `ref<T>(value?: T): { current: T }` - Creates a reference.
- `resolve<T>(value: T | Promise<T>): T` - Resolves reactive values.
- `root<T>(fn: () => T): T` - Creates a root context.
- `signal<T>(value?: T, options?: SignalOptions<T>): SignalTuple<T>` -
  Creates a reactive signal.
- `syncEffect<T>(fn: (prev?: T) => T | (() => void)): void` - Runs
  synchronous effects.
- `untrack<T>(fn: () => T): T` - Untracks reactive dependencies.
- `withValue<T, U>(value: T, fn: () => U): U` - Provides a value in a
  scope.
- `isComponent(value: any): boolean` - Checks if a value is a
  component.
- `makeCallback<T>(fn: T): T` - Creates a callback function.
- `markComponent<T extends Function>(fn: T): T` - Marks a function as
  a component.
- `addEvent<T>(node: Element, type: string, handler: (e: T) => void): void` -
  Adds an event listener.
- `removeEvent<T>(node: Element, type: string, handler: (e: T) => void): void` -
  Removes an event listener.
- `Component: typeof Component` - Base component class.
- `insert(parent: Element, accessor: any, marker?: Node): void` -
  Inserts elements into the DOM.
- `render(code: () => any, parent?: Element): () => void` - Renders
  components.
- `toHTML(code: () => any): string` - Converts to HTML string.
- `ready(): boolean` - Checks if DOM is ready.
- `readyAsync(): Promise<void>` - Asynchronous DOM ready check.
- `setAttribute(node: Element, name: string, value: Accessor<string | boolean>): void` -
  Sets DOM attributes.
- `setProperty(node: Element, name: string, value: unknown): void` -
  Sets DOM properties.
- `setStyle(node: DOMElement, value: StyleAttribute): void` - Sets
  element styles.
- `setClass(node: Element, value: object | string | ArrayLike<any>): void` -
  Sets element classes.
- `setClassList(node: Element, value: object | string | ArrayLike<any>): void` -
  Manages class lists.
- `propsPlugin: object` - Plugin for props handling.
- `propsPluginNS: object` - Namespaced props plugin.
- `externalSignal<T>(read: () => T, write: (v: T) => void): SignalTuple<T>` -
  Wraps an external getter/setter pair as a signal.
- `unwrap<T>(value: T): T` - Unwraps a reactive value to its raw form.
- `Pota` - Base class used internally by the renderer for component
  instances.
- `getValue(item: any): any` - Retrieves the value of a reactive item.

### Subpath exports

These are imported from subpaths, not the main `pota` entry:

- **`pota/components`** — Built-in components: `Collapse`, `Dynamic`,
  `For`, `Head`, `Portal`, `Range`, `Route` (also `A`, `load`,
  `Navigate`), `Show`, `Suspense`, `Switch` (also `Match`), `Tabs`,
  `Normalize`, `CustomElement`, `customElement`.
- **`pota/store`** — Reactive store (`src/lib/store.js`):
  - `signalify(target, keys?)` — transforms object properties into
    signals via get/set in place; not recursive.
  - `mutable(value, clone?)` — recursively proxies objects, arrays, and
    maps for reactive mutation tracking.
  - `merge(target, source, keys?)` — merges source into target,
    optionally keyed to preserve references.
  - `replace(target, source, keys?)` — like merge but removes keys from
    target not present in source.
  - `reset(target, source)` — resets target properties to values defined
    in source.
  - `updateBlacklist(window)` — extends internal blacklists with
    constructors/symbols from a target window.
  - `firewall(fn)` — wraps a function to prevent store mutations from
    leaking out.
  - `project(value)` — copy-on-write projection; uses its own proxy
    store so one projection does not affect another.
  - `copy(object)` — deep-copies an object leaving native/built-ins
    intact.
  - `readonly(value)` — prevents an object from being writable.
- **`pota/xml`** — Compiler-less XML API (`src/core/xml.js`):
  - `xml` — default instance; tagged template that parses XML and
    returns renderable children via the same renderer pipeline as JSX.
  - `xml.define(components)` — registers custom components by tag name
    for use inside `xml` templates.
  - `xml.components` — the current component registry (seeded with
    built-in components like `Show`, `For`, `Route`, etc.).
  - `XML()` — factory that creates a new independent `xml` instance
    with its own component registry.
- **`pota/use/*`** — Composable modules (e.g. `pota/use/animate`,
  `pota/use/css`, `pota/use/form`, `pota/use/scroll`, etc.). Each file
  under `src/use/` is a separate subpath export.
- **`pota/jsx-runtime`** / **`pota/jsx-dev-runtime`** — JSX runtime
  for bundlers (`src/jsx/jsx-runtime.js`).
