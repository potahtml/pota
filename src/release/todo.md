# TODO

## CONSIDER ALWAYS

- KEEP THE CODE READABLE, DO NOT COMPLICATE IT TOO MUCH
- CONSISTENCY ABOVE ALL
- SLOW AND SIMPLE IS BETTER THAN FAST AND HARD TO UNDERSTSAND
- TAKE IT EASY, STEP BY STEP

### documentation

- PRIORITY!! - online tests, a page full of tests
- add proper 404
- light theme
- restructure the docs and switch to mdx
- llm.txt

### mutable

- make mutable lazy
- improve reconcile by only copying whats needs to be copied
- support set, maybe weakmap and weakset
- defineProperty proxy trap

### reactivity

- when updating a signal try to patch arrays for when value comes from
  server
- figure out if other things should be wrapped in
  `createReactiveSystem`

### reactivity wishes

- figure out if top level runs the same as when owned, or make top
  level owned, even if doesnt garbage collects - I couldnt figure out
  this one out
- figure out if possible to prevent writing to signals inside effects

### transform

- inline style objects and maybe merge different style approaches
- refactor transform again !
- figure out how to make the transform standalone because esm.sh is
  driving me crazy
- avoid double wrapping functions exclusively to use with the
  transform. Ex: not for tsc, react compiler, buildless/xml

### typescript

- type components somehow
- type reactivity

### use

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

### components

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

### bench

position is the previous position or so

- v0.17.177 win - pos 31 / 10k - 75ms - 11ms / 1k - 7ms - 0.7ms
- v0.18.188 win - pos 34 / 10k - 77ms - 9ms / 1k - 7ms - 0.5ms
- v0.18.199 lin - pos Xx / 10k - 54ms - 6ms / 1k - 4.5ms - 0.4ms
- v0.19.204 lin - pos 24 / 10k - 38ms - 4ms / 1k - 4ms - 0.25ms
- v0.19.206 lin - pos 21 / 10k - 38ms - 4ms / 1k - 3ms - 0.25ms
