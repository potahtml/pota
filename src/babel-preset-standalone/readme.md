# babel-preset-standalone

All-in-one browser bundle that makes pota run in the browser without
Node and without a build step. Includes `@babel/standalone` + pota's
Babel preset + TypeScript/TSX support in a single file.

## Usage

```html
<script src="index.iife.js"></script>
<!-- Babel.transform(code, { presets: ['pota'] }) is ready -->
<!-- Handles JSX, TSX, and TypeScript in one preset -->
```

## How it works

`index.js` imports the pota preset from `../babel-preset/index.js`,
composes it with standalone's built-in TypeScript preset
(`isTSX: true, allExtensions: true`), and registers the result via
`Babel.registerPreset('pota', ...)`.

Rollup bundles the preset, then prepends `@babel/standalone/babel.js`
as a banner. The result is a single IIFE file (`index.iife.js`) with
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

| File               | Role                                        |
| ------------------ | ------------------------------------------- |
| `index.js`         | Entry: composes pota + TS preset, registers |
| `rollup.config.js` | Build config (shim plugin + banner)         |
| `index.iife.js`    | Build output (gitignored)                   |
| `test/runner.js`   | Puppeteer runner                            |
| `test/checks.js`   | Test assertions (8 checks)                  |
| `test/index.html`  | Test page (loads index.iife.js)             |

## Commands

```
npm run build:standalone   # rollup → index.iife.js
npm run test:standalone    # puppeteer: 8 tests
```

## devDependencies added

- `@rollup/plugin-node-resolve`
- `@rollup/plugin-commonjs`
- `@babel/standalone`
