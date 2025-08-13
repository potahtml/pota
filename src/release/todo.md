# TODO

## CONSIDER ALWAYS

- KEEP THE CODE READABLE, DO NOT COMPLICATE IT TOO MUCH
- CONSISTENCY ABOVE ALL
- SLOW AND SIMPLE IS BETTER THAN FAST AND HARD TO UNDERSTSAND
- TAKE IT EASY, STEP BY STEP

## some day

### documentation

- PRIORITY - online tests, a page full of tests
- add proper 404
- light theme
- restructure the docs

### mutable

- make mutable lazy
- improve reconcile by only copying whats needs to be copied
- support set, maybe weakmap and weakset
- defineProperty proxy trap

### typescript

- type components somehow
- type reactivity
- importing from types folder mess up stuff (error TS5055)
- 22 non-strict / 497 strict

### reactivity

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

### render

### transform

- setAttribute to setProperty when node.prop /
  getBooleanProperty(value)
- `getValue` when using @static may not be needed
- figure out how to make the transform standalone because esm.sh is
  driving me crazy

### use / probably never

- drag element
- ensure resize on bounds
- forms
- on-element-drag.js
- input, keyboard + mouse + controller
- favicon
- audio/media
- animations/animationFrame
- storage
- performance
- tooltip
- timer
- colors library
- socket webrtc
- handle/listen postMessage/MessageChannel
- orientation is creating a root, figure out if this can be abstracted

### components:

- color picker
- tabs
- linkify
- uploads
- record audio, video
- splitter
- Error component
- maybe make a `<WithDocument document={document}/>` so stuff stops
  breaking with popups
- web components slots
- web components WIP

### tools

- rethink the dev tools
- mdx

### bench

- v0.17.177 win - pos 31 / 10k - 75ms - 11ms / 1k - 7ms - 0.7ms
- v0.18.188 win - pos 34 / 10k - 77ms - 9ms / 1k - 7ms - 0.5ms
- v0.18.199 lin - pos Xx / 10k - 54ms - 6ms / 1k - 4.5ms - 0.4ms
- v0.19.200 lin - pos Xx / 10k - 38ms - 4ms / 1k - 4ms - 0.25ms
