# TODO

## CONSIDER ALWAYS

- KEEP THE CODE READABLE, DO NOT COMPLICATE IT TOO MUCH
- CONSISTENCY ABOVE ALL
- SLOW AND SIMPLE IS BETTER THAN FAST AND HARD TO UNDERSTAND
- TAKE IT EASY, STEP BY STEP

### documentation

- add proper 404
- light theme
- restructure the docs and switch to mdx

### mutable

- make mutable lazy
- improve reconcile by only copying whats needs to be copied
- need to make sure we do not track when adding our mutable stuff
- ownKeys in defineProperty wth

### transform

- inline style objects and maybe merge different style approaches
- refactor transform again !

### for terminator

- maybe ask for coverage reporting
- get rid of colorsio dependency (I only use 1 function I think)

### reactivity

- figure out if possible to prevent writing to signals inside effects

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
- linkify
- uploads
- record audio, video
- splitter
- maybe make a `<WithDocument document={document}/>` so stuff stops
  breaking with popups

### tools

- rethink the dev tools

### bench

position is the previous position or so

- v0.17.177 win - pos 31 / 10k - 75ms - 11ms / 1k - 7ms - 0.7ms
- v0.18.188 win - pos 34 / 10k - 77ms - 9ms / 1k - 7ms - 0.5ms
- v0.18.199 lin - pos Xx / 10k - 54ms - 6ms / 1k - 4.5ms - 0.4ms
- v0.19.204 lin - pos 24 / 10k - 38ms - 4ms / 1k - 4ms - 0.25ms
- v0.19.206 lin - pos 21 / 10k - 38ms - 4ms / 1k - 3ms - 0.25ms
- v0.20.224 lin - pos 18 / 10k - 41ms - 4ms / 1k - 3ms - 0.25ms
- v0.20.227 lin - pos 18 / 10k - 51ms - 7ms / 1k - 6ms - 0.6ms
