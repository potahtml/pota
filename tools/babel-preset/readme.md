# tools/babel-preset

All-in-one browser bundle of pota's Babel preset. Makes pota run in
the browser without Node and without a build step, bundling
`@babel/standalone` + pota's Babel preset + TypeScript/TSX support
into a single file.

## Usage

```html
<script src="/generated/babel-preset-standalone.js"></script>
<!-- Babel.transform(code, { presets: ['pota'] }) is ready -->
<!-- Handles JSX, TSX, and TypeScript in one preset -->
```

## How it works

`babel-preset/babel-preset-standalone.js` imports the pota preset from
`./babel-preset.js`, composes it with standalone's
built-in TypeScript preset
(`isTSX: true, allExtensions: true`), and registers the result via
`Babel.registerPreset('pota', ...)`.

Rollup bundles the preset, then prepends `@babel/standalone/babel.js`
as a banner. The result is a single IIFE file (`babel-preset-standalone.js`) with
zero dependencies.

### Shim plugin

The preset source imports from `@babel/core`, `@babel/types`, etc. A
rollup virtual plugin shims these to read from `globalThis.Babel` (set
up by `@babel/standalone`), avoiding duplicate bundling:

| Import                     | Shimmed to                                     | Why                                     |
| -------------------------- | ---------------------------------------------- | --------------------------------------- |
| `@babel/core`              | `Babel.packages.{types,template}`              | ~800 KB; already in `@babel/standalone` |
| `@babel/types`             | `Babel.packages.types` (syntheticNamedExports) | ~3 MB; already in `@babel/standalone`   |
| `@babel/plugin-syntax-jsx` | `Babel.availablePlugins['syntax-jsx']`         | Already registered in standalone        |
| `assert`                   | Tiny polyfill                                  | Node built-in; no browser equivalent    |

Everything else is bundled inline: `@babel/helper-plugin-utils`,
`@babel/helper-module-imports`, `parse5`.

### Key details

- `@babel/standalone` exposes internals at `Babel.packages.*`, **not**
  `Babel.types` / `Babel.template` (those are undefined).
- The `@babel/types` shim uses rollup's `syntheticNamedExports` so CJS
  consumers can destructure from it without 1355 named re-exports.

## Files

| File                            | Role                                        |
| ------------------------------- | ------------------------------------------- |
| `babel-preset/babel-preset.js`            | Preset source (input to rollup CJS build)   |
| `babel-preset/babel-preset-standalone.js` | Entry: composes pota + TS preset, registers |
| `tools/babel-preset/rollup.config.js`     | Merged build config: preset CJS + standalone IIFE |
| `tools/babel-preset/test/runner.js`       | Puppeteer runner                            |
| `tools/babel-preset/test/checks.js`       | Test assertions                             |
| `tools/babel-preset/test/index.html`      | Test page (loads the built IIFE)            |
| `generated/babel-preset.cjs`              | CJS build output (gitignored)               |
| `generated/babel-preset-standalone.js`    | IIFE bundle output (gitignored)             |

## Commands

```
npm run watch:babel-preset    # rollup watch → generated/babel-preset.cjs + generated/babel-preset-standalone.js
npm run test:babel-preset    # puppeteer assertions over the standalone bundle
```

## devDependencies added

- `@rollup/plugin-node-resolve`
- `@rollup/plugin-commonjs`
- `@babel/standalone`
