# pota

pota is a small, pluggable, yet fully-featured Reactive Web Renderer,
designed to work with `html` and `xml`.

It includes a Babel preset for transforming `JSX` into fast and
compact partials inspired by
[dom-expressions](https://github.com/ryansolid/dom-expressions). pota
can also be compiler-less, allowing you to use it with an `xml`
function. You may still use `transform-react-jsx` or `tsc`, as
transformation needs no "magic".

### Philosophy

The API and Core components, draw significant inspiration from
[SolidJS](https://www.solidjs.com/), albeit things differ to an extent
based on personal preferences. It can be said that this project is
what I wish client-side-solid to be.

pota prioritizes simplicity, consistency, usage, and is subjectively
easy to understand. It's driven by developer needs, and wont
compromise these for benchmarks. It is
[still fast](https://krausest.github.io/js-framework-benchmark/current.html)
while respecting the core philosophy.

### Considerations

This is mostly a research and personal project, subject to change,
that I use for myself and to help improve SolidJS. If you are in doubt
of using this or SolidJS, you should use SolidJS.

- TypeScript types are a work in progress and kind of messy.
- Project will reach v1.0 once I'm happy with the API shape.
- I keep notes related to this project
  [here](https://github.com/potahtml/pota/blob/master/src/release/todo.md).
- SSR is out of the scope of this project

### Links

- [Documentation](https://pota.quack.uy/) with editable live examples
  and a playground
- For getting started, check out
  [templates](https://github.com/potahtml/templates)

### See also

- https://pota.quack.uy/
- https://github.com/potahtml/
- https://github.com/potahtml/pota
- https://github.com/potahtml/templates
- https://www.npmjs.com/package/pota

Thanks to: Joe, Fabio, Ryan, Erika, kilo, Javier, Paty, bigmistqke

_Bug-free till proven otherwise._

 <img src="https://pota.quack.uy/assets/logo-small.png"/>

In loving memory of Quack 🐈‍⬛ 🩵 - 2018.03.01 - 2025.07.18
