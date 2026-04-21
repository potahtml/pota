# tools/test-runner — minimal browser test runner

A tiny, purpose-built test runner using Puppeteer. No framework, no
HMR — just "transform, serve, run in a real browser, report
pass/fail." Coverage is opt-in via `--coverage` (see below).

## Architecture

```
tools/test-runner/
  runner.js     — CLI entry: scan, puppeteer, report
  serve.js      — HTTP server: serves transformed files + test harness
  transform.js  — Babel transform + import rewriting + mtime cache
  test.js       — browser-side test harness (wraps pota/use/test)
  coverage.js   — optional V8 coverage collection → c8 report
```

## Flow

1. **Scan** — `filesRecursive` from `tools/utils.js` collects test
   files matching configured extensions.
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

All options live in `package.json` under the `"test"` key (read it for
the current default values):

| Key           | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `dirs`        | test directories (relative to cwd) — array, scanned in order      |
| `port`        | server port in watch mode; one-shot runs always use a random port |
| `timeout`     | per-file timeout (ms)                                             |
| `concurrency` | parallel browser tabs                                             |
| `extensions`  | file extensions to test                                           |
| `ignore`      | path substrings to exclude                                        |
| `watch`       | directories to watch in `--watch` mode for re-run triggers        |

`timeout` and `concurrency` have built-in fallbacks if the keys are
missing from `package.json`; the shipped `package.json` overrides both
anyway.

CLI flags:

| Flag             | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `--watch` / `-w` | enable watch mode (re-run on changes)                    |
| `--bail`         | stop on first failing file                               |
| `--quiet` / `-q` | hide passing tests and suppress console clears           |
| `--no-clear`     | suppress console clears only (passing tests still shown) |
| `--log`          | show captured `console.log` from passing tests           |
| `--warn`         | show captured `console.warn` from passing tests          |
| `--error`        | show captured `console.error` from passing tests         |
| `--coverage`     | collect V8 coverage for `src/` and render a c8 report    |
| _positional_     | filter — only run files whose path contains it           |

On failure, `console.error` and `console.warn` auto-show even without
their flags; `console.log` still needs `--log`.

## Usage

```
npm run test:api                    # run once, all files
npm run watch:test                  # watch mode
npm run test:api -- --bail          # stop on first failure
npm run test:api -- route           # filter by name
npm run test:coverage               # run once with coverage
```

`npm test` also runs this suite, but chains `test:types` and
`test:babel-preset` around it. Use `test:api` when you only want the
browser tests or need to pass flags/filters to the runner.

## Import rewriting

Bare specifiers are rewritten to local paths via a Babel plugin:

| Import                 | Rewritten to                             |
| ---------------------- | ---------------------------------------- |
| `pota`                 | `/src/exports.js`                        |
| `pota/components`      | `/src/components/@main.js`               |
| `pota/store`           | `/src/lib/store.js`                      |
| `pota/xml`             | `/src/core/xml.js`                       |
| `pota/jsx-runtime`     | `/src/jsx/jsx-runtime.js`                |
| `pota/jsx-dev-runtime` | `/src/jsx/jsx-runtime.js`                |
| `pota/use/*`           | `/src/use/*.js` (dynamic pattern match)  |
| `colorjs.io`           | `/node_modules/colorjs.io/dist/color.js` |
| `#test`                | `/tools/test-runner/test.js`             |

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
- `run()` — flush and report all registered tests; the harness calls
  this automatically after the test module loads — test modules do not
  need to call it themselves

## Per-test cleanup

`tools/test-runner/test.js` clears `document.body`, `document.head`,
and `document.adoptedStyleSheets` before each test and asserts the
same cleanliness after. Renderer changes that leave nodes around will
fail this check, so it doubles as a disposal-leak detector.

## Cross-boundary serialization

Test results, console output, and uncaught errors all originate in the
browser and have to reach Node intact. The harness uses two helpers
for this:

- `pack()` (in `serve.js`'s injected harness) converts error-like
  objects (anything with `.stack` or `.message`) into plain
  serializable `{ __error, message, stack, cause }` markers, and DOM
  events (`ErrorEvent`, `PromiseRejectionEvent`) into
  `{ __event, ... }` markers. Everything else passes through
  untouched.
- `unpack()` (in `report.js`) reverses `__error` markers back to stack
  strings on the Node side, and forwards everything else to Node's
  native `console.log/warn/error`, so objects, arrays, and primitives
  format using Node's built-in inspector.

`test.js` writes results to a shared `window.__pota_results__` object
— assertion failures are packed via `packError()` preserving
`{ expected, value }` shapes. Uncaught errors and unhandled rejections
caught by the harness's `error` / `unhandledrejection` listeners are
written there too.

On the Node side, assertion failures are displayed via the
`console.error` output that `pota/use/test` emits (which already
includes colored diffs); the raw `{ title, expected, value }`
rejections in `results.errors` are skipped to avoid duplication.
Uncaught errors and unhandled rejections are shown straight from
`results.errors` since they have no matching console output.

`tests/api/console-formatting.jsx` exercises the full pipeline: all
console methods with mixed types, error objects with cause chains,
assertion failure shapes, `ErrorEvent`, and `PromiseRejectionEvent`.

## Coverage

`--coverage` (one-shot only — ignored with `--watch`) hooks Puppeteer's
V8 `startJSCoverage({ includeRawScriptCoverage: true })` around each
page. Per-page raw coverage is rewritten to `file://` URLs and written
as `NODE_V8_COVERAGE`-shaped JSON under `generated/coverage/tmp/`,
including the served transformed source and its inline source map in
`source-map-cache` so c8 maps back to the original `src/` lines. Only
URLs under the served `/src/` prefix are recorded (tests and node
modules are skipped).

After the run, `c8 report` renders both a text summary on stdout and
an HTML report at `generated/coverage/index.html`. Everything under
`generated/` is gitignored.

## Dependencies

- `puppeteer` — browser automation
- `@babel/core` — transforms (peer dep of pota)
- `@babel/preset-typescript` — TypeScript strip (dev dep)
- `c8` — coverage report rendering (dev dep; only needed for `--coverage`)
- `pota/babel-preset` — JSX transform (local)
