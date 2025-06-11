CONSIDER ALWAYS

- KEEP THE CODE READABLE, DO NOT COMPLICATE IT TOO MUCH
- CONSISTENCY ABOVE ALL
- SLOW AND SIMPLE IS BETTER THAN FAST AND HARD TO UNDERSTSAND

some day

- improve the tracker
- need to type the remaining `use:` such `use:clipboard`
- addEvent vs eventAdd - be consistent !!

- restructure the docs
- page full of tests ASAP

documentation

- PRIORITY - online tests, a page full of tests
- PRIORITY - the attributes page is out of date
- PRIORITY - the documentation is out of date, restore publishing
- add proper 404
- light theme

tools

- rethink the dev tools
- mdx

mutable

- PRIORITY - support a readonly
- PRIORITY - improve the tracker
- figure out a whitelist vs blacklist! use a whitelist
- support set, maybe weakmap and weakset
- defineProperty proxy trap

typescript

reactivity

- PRIORITY - use internally runWithOwner more
- PRIORITY - try to remove `options` object from root/memo/effects
- recheck use of untrack / add forbidden signal read
- figure out if possible to prevent writing to signals inside effects
- derived/light signals (make signals easier to use)
- diff array for when value comes and doesnt come from server
- simplify the classes
- maybe at compile time wrap in owned anything bellow a `await`, do
  similar to promises?
- figure out if other things should be wrapped in
  `createReactiveSystem`
- figure out if top level runs the same as when owned, or make top
  level owned, even if doesnt garbage collects

use / probably never

- drag element
- emitter
- ensure resize on bounds
- forms
- on-element-drag.js
- put dom stuff into use/dom.js
- input, keyboard + mouse + controller
- favicon
- audio/media
- animations/animationFrame
- storage
- performance
- debugging!
- tooltip
- timer
- colors library
- socket webrtc
- handle/listen postMessage/MessageChannel

components:

- color picker
- tabs
- linkify
- uploads
- record audio, video
- splitter
- Error component
- maybe make a <WithDocument document={document}/> so stuff stops
  breaking with popups
- web components slots
- web components WIP

bench

- v0.17.177 - position 31 / 10k - 75ms 11ms / 1k - 7ms 0.7ms
- v0.18.184 - position X / 10k - 86ms 9ms / 1k - 7ms 0.5ms

typescript errors

- 73 non-strict / 497 strict
