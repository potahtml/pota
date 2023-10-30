# pota

pota is a small Reactive Web Renderer for Reactive Libraries.

Although its compiler-less, it includes a babel preset for
transforming JSX. Its abstracted API and components, allow you to
switch between reactive libraries at any time. Supported libraries
include: solid-js, oby, and flimsy.

The API and core components, draw significant inspiration from Solid,
albeit things differ to an extent based on personal preferences.

pota prioritizes consistency and is subjectively easy to understand.
Its driven by developer needs, not benchmarks.

## Key Points

- Reactivity that is easy to understand. If something is a function,
  it can be reactive; if it is not a function, it's not reactive
- Doesn't use prop getters, or any getters; you may use destructuring
- Renders any kind of XML, including custom namespaces
- Provides a `defineProp` function for using custom props on any
  element, think defining your own htmx stuff
- Includes a `removeEventListener` function and properly cleans up
  delegated events
- `addEventListener` can accept the same type of event multiple times
  on the same element.
- Allows multiple callbacks on components like `Show` and `For`
- Functions are tracked, regardless of nesting depth
- Renders objects, promises, maps, sets, etc
- Supports class components with automatic registration of `onReady`
  and `onCleanup` methods
- `Portal` does not wrap children in a `div`
- Full featured simple to use `Route` component
- Does not include server-side rendering (SSR)
- Does not include stores

Usage and documentation can be found on the website:
https://pota.quack.uy/
