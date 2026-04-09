# tools/test — minimal browser test runner

A tiny, purpose-built test runner using Puppeteer. No framework, no
HMR, no coverage — just "transform, serve, run in a real browser,
report pass/fail."

## Architecture

```
tools/test/
  runner.js     — CLI entry: scan, puppeteer, report
  serve.js      — HTTP server: serves transformed files + test harness
  transform.js  — Babel transform + import rewriting + mtime cache
  test.js       — browser-side test harness (wraps pota/use/test)
```

## Flow

1. **Scan** — `filesRecursive` from `src/release/utils.js` collects
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
| `port`        | `0` (random)              | server port                      |
| `timeout`     | `5000`                    | per-file timeout (ms)            |
| `bail`        | `false`                   | stop on first failure            |
| `watch`       | `true`                    | watch mode on by default         |
| `concurrency` | `10`                      | parallel browser tabs            |
| `extensions`  | `[".jsx", ".tsx", ".ts"]` | file extensions to test          |

CLI flags: `--no-watch`, `--no-bail`, positional filter substring.

## Usage

```
npm test                            # watch + bail (defaults)
npm run test:all                    # no bail
npm run test:once                   # no watch
npm run test -- route               # filter by name
```

## Import rewriting

Bare specifiers are rewritten to local paths via a Babel plugin:

| Import             | Rewritten to               |
| ------------------ | -------------------------- |
| `pota`             | `/src/exports.js`          |
| `pota/components`  | `/src/components/@main.js` |
| `pota/store`       | `/src/lib/store.js`        |
| `pota/xml`         | `/src/core/xml.js`         |
| `#test`            | `/tools/test/test.js`      |
| `pota/use/*`       | `/src/use/*.js`            |
| `pota/jsx-runtime` | `/src/jsx/jsx-runtime.js`  |

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
- `run()` — called by the harness after module evaluation

## Dependencies

- `puppeteer` — browser automation
- `@babel/core` — transforms (peer dep of pota)
- `@babel/preset-typescript` — TypeScript strip (dev dep)
- `pota/babel-preset` — JSX transform (local)
