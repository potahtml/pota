# tools/test-runner — minimal browser test runner

A tiny, purpose-built test runner using Puppeteer. No framework, no
HMR, no coverage — just "transform, serve, run in a real browser,
report pass/fail."

## Architecture

```
tools/test-runner/
  runner.js     — CLI entry: scan, puppeteer, report
  serve.js      — HTTP server: serves transformed files + test harness
  transform.js  — Babel transform + import rewriting + mtime cache
  test.js       — browser-side test harness (wraps pota/use/test)
```

## Flow

1. **Scan** — `filesRecursive` from `tools/utils.js` collects
   test files matching configured extensions.
2. **Serve** — a local HTTP server that:
   - transforms `.jsx`/`.tsx` via Babel with `pota/babel-preset`
   - strips TypeScript from `.ts`/`.tsx` via
     `@babel/preset-typescript`
   - rewrites bare `pota/*` and `#test` imports to local `src/` paths
   - caches transforms keyed by path + mtime
   - serves everything else as static files from repo root
3. **Run** — for each test file, opens a Puppeteer tab that loads a
   minimal HTML harness importing the test as a module.
4. **Report** — prints pass/fail per file with timing and debug URLs.

## Config

All options live in `package.json` under the `"test"` key:

| Key           | Default                   | Description                      |
| ------------- | ------------------------- | -------------------------------- |
| `dir`         | `"tests/api/"`            | test directory (relative to cwd) |
| `port`        | `7357` (watch mode only)  | server port in watch mode; one-shot runs always use a random port |
| `timeout`     | `5000`                    | per-file timeout (ms)            |
| `concurrency` | `10`                      | parallel browser tabs            |
| `extensions`  | `[".jsx", ".tsx", ".ts"]` | file extensions to test          |
| `ignore`      | `[]`                      | path substrings to exclude       |

CLI flags: `--watch` / `-w` (enable watch mode), `--bail` (stop on
first failure), `--quiet` / `-q` (hide passing tests and suppress
console clears), positional filter substring.

## Usage

```
npm test                            # run once, all files
npm run watch:test                  # watch mode
npm test -- --bail                  # stop on first failure
npm test -- route                   # filter by name
```

## Import rewriting

Bare specifiers are rewritten to local paths via a Babel plugin:

| Import             | Rewritten to                             |
| ------------------ | ---------------------------------------- |
| `pota`             | `/src/exports.js`                        |
| `pota/components`  | `/src/components/@main.js`               |
| `pota/store`       | `/src/lib/store.js`                      |
| `pota/xml`         | `/src/core/xml.js`                       |
| `pota/jsx-runtime`     | `/src/jsx/jsx-runtime.js`                |
| `pota/jsx-dev-runtime` | `/src/jsx/jsx-runtime.js`                |
| `pota/use/*`       | `/src/use/*.js` (dynamic pattern match)  |
| `colorjs.io`       | `/node_modules/colorjs.io/dist/color.js` |
| `#test`            | `/tools/test-runner/test.js`             |

All other imports (relative paths, third-party packages, etc.) pass
through unchanged and are served as-is by the HTTP server.

## Test file contract

Test files import from `#test`:

- `test(title, fn)` — registers a test. `fn` receives `expect` from
  `pota/use/test` (supports `toBe`, `toEqual`, `not.*`).
- `body()` — `document.body.innerHTML.trim()`
- `head()` — `document.head.innerHTML.trim()`
- `childNodes(node?)` — child node count (defaults to body)
- `microtask()` — one microtask turn (`Promise.resolve()`)
- `macrotask()` — one macrotask turn (`setTimeout(0)`)
- `sleep(ms)` — delay (defaults to 0)
- `$(selector, node?)` — `querySelector` shorthand
- `$$(selector, node?)` — `querySelectorAll` shorthand
- `run()` — flush and report all registered tests; the harness
  calls this automatically after the test module loads — test
  modules do not need to call it themselves

## Dependencies

- `puppeteer` — browser automation
- `@babel/core` — transforms (peer dep of pota)
- `@babel/preset-typescript` — TypeScript strip (dev dep)
- `pota/babel-preset` — JSX transform (local)
