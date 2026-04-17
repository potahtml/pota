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
| `timeout`     | `8000`                    | per-file timeout (ms)            |
| `concurrency` | `16`                      | parallel browser tabs            |
| `extensions`  | `[".jsx", ".tsx", ".ts"]` | file extensions to test          |
| `ignore`      | `[]`                      | path substrings to exclude       |

The runner falls back to built-in defaults (`5000`, `10`) if the keys
are missing from `package.json`, but the shipped `package.json`
overrides both.

CLI flags:

| Flag                  | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `--watch` / `-w`      | enable watch mode (re-run on changes)          |
| `--bail`              | stop on first failing file                     |
| `--quiet` / `-q`      | hide passing tests and suppress console clears |
| `--no-clear`          | suppress console clears only (passing tests still shown) |
| `--log`               | show captured `console.log` from passing tests |
| `--warn`              | show captured `console.warn` from passing tests |
| `--error`             | show captured `console.error` from passing tests |
| *positional*          | filter — only run files whose path contains it |

On failure, `console.error` and `console.warn` auto-show even without
their flags; `console.log` still needs `--log`.

## Usage

```
npm run test:api                    # run once, all files
npm run watch:test                  # watch mode
npm run test:api -- --bail          # stop on first failure
npm run test:api -- route           # filter by name
```

`npm test` also runs this suite, but chains `test:types` and
`test:babel-preset` around it. Use `test:api` when you only want
the browser tests or need to pass flags/filters to the runner.

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
