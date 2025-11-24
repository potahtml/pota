# pota v0.20.214

- `writable` has been renamed to `derived`
- removed `save` option from signal

# pota v0.19.211

- When an element has duplicated attributes only the last one is used
  `<div class="1" class="2"/>` yields `<div class="2"/>`
- `writable` and `bind` will also unwrap promises and functions
  recursively.

# pota v0.19.207

- when using `@static`, value do calls `getValue` so that way
  everything just works. This pretty much undo change from last
  version. I aim to make things consistent and this was an
  inconsistent change.
- spreads work the same as native JavaScript now! This is a breaking
  change because multiple spreads or a mix of attributes and spreads
  used to be applied separately. Now it creates a big object with
  every attribute and spread expressions, and spreads adds, aligning
  with how JavaScript works.

# pota v0.19.206

- when using `@static`, value no longer calls `getValue`, if its a
  function you will need to call it

# pota v0.19.203

- remove `propsSplit` utility as its not needed
- remove `proxy` utility, not needed

# pota v0.19.201

- use:ref no longer runs when node is already mounted, it runs before
  its mounted
- transform: inline props when possible

# pota v0.18.184

- renamed `onMount` to `use:connected` as
  `<div use:connected={node=>{}}/>`
- renamed `onUnmount` to `use:disconnected` as
  `<div use:disconnected={node=>{}}/>`
- renamed `ref` to `use:ref`
- renamed `css` to `use:css`
- renamed `pota/web` to `pota/components`
- renamed `pota/html` to `pota/xml`
- renamed `html` to `xml` because prettier breaks the case of
  components names and props
- renamed `onLoaded` in async functions to `onLoad`
- defaults to attributes instead of properties
- - use `prop:innerHTML` instead of `innerHTML`
- - use `prop:textContent` instead of `textContent`
- - use `prop:srcObject` instead of `srcObject`
- - use `prop:indeterminate` instead of `indeterminate` for
    `<input type="checkbox"/>`
- - use `<textarea>{value}</textarea>` instead of
    `<textarea value="${value}"/>` (textareas don't have an attribute
    named value)
- renamed `Router` to `Route`
- renamed `location.query` to `location.searchParams`
- moved `useLocation.Navigate` to `pota/components`
- renamed `pota/plugin` to `pota/use`
- renamed `pota/plugin/use$Name.js` to `pota/use/$name.js`
- it no longer exports 'pota/std'
