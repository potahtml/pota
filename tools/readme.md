# tools

Build, development, and test utilities. None of these are part of the
published package.

## Files

| Path                  | Role                                                  |
| --------------------- | ----------------------------------------------------- |
| `watch.js`            | Dev watcher — spawns all `watch:*` npm scripts        |
| `generate.js`         | Generates `generated/docs/importmap.json` and `types.json` for the docs site |
| `release.js`          | Version bump, git tag, and npm publish script         |
| `utils.js`            | Shared file system helpers used by other tools        |
| `babel-preset/`       | Rollup configs and Puppeteer tests for the Babel preset builds |
| `test-runner/`        | Custom Puppeteer browser test runner                  |

## One-shot vs watch

Each build task and the browser test runner have two script variants:

| One-shot (exits when done)   | Watch (stays alive, rebuilds on changes) |
| ---------------------------- | ---------------------------------------- |
| `npm run build:ts`           | `npm run watch:ts`                       |
| `npm run build:babel-preset` | `npm run watch:babel-preset`             |
| `npm run build:generate`     | `npm run watch:generate`                 |
| `npm run test:api`           | `npm run watch:test`                     |

Use `build:*` to regenerate artifacts once (e.g. verify a change
compiled correctly). Use `watch:*` (via `npm run dev`) during
active development.

## Typecheck scripts

Three scoped typecheck scripts, each with a watch variant:

| One-shot                       | Watch                          | Config                       |
| ------------------------------ | ------------------------------ | ---------------------------- |
| `npm run test:ts`              | `npm run watch:ts`             | `tsconfig.json` (`src/`)     |
| `npm run test:ts-tests`        | `npm run watch:ts-tests`       | `tests/tsconfig.json`        |
| `npm run test:ts-babel-preset` | `npm run watch:ts-babel-preset` | `babel-preset/tsconfig.json` |

Only `test:ts` emits — into `generated/types/`. The other two are
typecheck-only (`noEmit`).

`test:ts` and `build:ts` are the same `tsc` invocation; the alias
exists so `test:types` can group the three typechecks under one
name. `test:types` chains them sequentially and is the first stage
of `npm test`. All three tsconfigs set `preserveWatchOutput: true`
so their diagnostics don't wipe the shared `npm run dev` console.

## Full verification

`npm test` runs the whole suite: `test:types` → `test:api` →
`test:babel-preset`. That's what `npm run release` chains in front
of `tools/release.js`.

## watch.js

Spawns every `watch:*` script listed in `package.json` as a child
process. Watches `package.json` for changes — newly added `watch:*`
scripts are started automatically and removed ones are stopped. If any
watcher exits unexpectedly the whole process stops.

```
node tools/watch.js        # spawns all watch:* scripts
npm run dev                # clean generated/ then watch
```

## generate.js

Reads `src/use/` and `src/lib/` to produce:

- `generated/docs/importmap.json` — import map for the docs site
- `generated/docs/types.json` — type definitions for Monaco editor

Watch mode debounces file changes with a 5-second delay before
regenerating.

```
node tools/generate.js      # run once and exit
node tools/generate.js -w   # watch mode (run on file changes)
npm run watch:generate      # same as -w, via npm
```

## release.js

Bumps the patch version, writes `src/version.js`, commits, tags, and
publishes to npm. Run from the repo root.

**Before running:** update `documentation/breaking-changes.md` — its
contents become the signed git tag message (`-F
./documentation/breaking-changes.md`). The tag is signed (`-s -a`),
so a GPG key must be configured.

`npm run release` chains `npm test` in front of `release.js` (which
covers types, browser tests, and the babel-preset smoke suite), so a
failing suite aborts before the version bump — no commit, tag, or
push.

```
npm run release
```

## utils.js

Shared helpers used by `generate.js`, `release.js`, `watch.js`, and
the test runner. Not a public API. Three groups:

- **Filesystem helpers** (read/write with change-detection,
  recursive listing, copy/move/remove, directory watching).
- **Process**: `$` (execSync alias) and `spawn`.
- **ANSI color helpers** for terminal output.

## babel-preset/

Rollup build configs for:

- `generated/babel-preset.cjs` — CJS build of the Babel preset for Node consumers
- `generated/babel-preset-standalone.js` — IIFE bundle of `@babel/standalone` + pota preset for browser use

Also contains Puppeteer tests for the standalone bundle. See
`tools/babel-preset/readme.md` for details.

## test-runner/

Custom Puppeteer test runner that transforms `.jsx`/`.tsx` files
on the fly via the local Babel preset, serves them over HTTP, and runs
them in a real Chromium browser. See `tools/test-runner/readme.md` for
details.
