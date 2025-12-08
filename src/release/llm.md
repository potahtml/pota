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

- Use `write` (second slot) to set/replace values that need the prev
  value. It does not receive the previous value.
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
  `<b>{signalName}</b>`, not `<b>{signalName()}</b>`.

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
- `getValue(item: any): any` - Retrieves the value of a reactive item.
