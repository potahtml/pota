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

Each build task and the test runner have two script variants:

| One-shot (exits when done)   | Watch (stays alive, rebuilds on changes) |
| ---------------------------- | ---------------------------------------- |
| `npm run build:typescript`   | `npm run watch:typescript`               |
| `npm run build:babel-preset` | `npm run watch:babel-preset`             |
| `npm run build:generate`     | `npm run watch:generate`                 |
| `npm test`                   | `npm run watch:test`                     |

Use `build:*` to check output once (e.g. verify a change compiled
correctly). Use `watch:*` (via `npm run dev`) during active development.

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

`npm run release` chains `npm test && npm run test:babel-preset` in
front of `release.js`, so a failing suite aborts before the version
bump — no commit, tag, or push.

```
npm run release
```

## utils.js

Shared helpers used by `generate.js`, `release.js`, `watch.js`, and
the test runner. Not a public API. Exports:

| Export          | Description                                      |
| --------------- | ------------------------------------------------ |
| `read`          | Read a UTF-8 file                                |
| `write`         | Write a file only when content changed           |
| `exists`        | Check whether a path exists                      |
| `append`        | Append to a file                                 |
| `isDirectory`   | Check whether a path is a directory              |
| `remove`        | Remove a file or directory tree                  |
| `move`          | Move a file or directory                         |
| `copy`          | Copy a file                                      |
| `mkdir`         | Ensure a directory exists; return the path       |
| `files`         | Direct children of a directory (absolute paths) |
| `readdir`       | Directory entry names                            |
| `filesRecursive`| Recursive file list (absolute paths)             |
| `watch`         | Watch a directory tree for changes               |
| `$`             | `execSync` alias for shell commands              |
| `spawn`         | `child_process.spawn`                            |
| `red`           | ANSI red color                                   |
| `green`         | ANSI green color                                 |
| `dim`           | ANSI dim color                                   |
| `white`         | ANSI white color                                 |

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
