# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for
the multi-line history.

## 2026-05-06 13:51:29 — pota 0.20.232 (dirty) @ 531d54e

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1091 KB                      |
| 10k rows attached                   | 7475 KB                      |
| empty heap (post-clear, GC)         | 1126 KB                      |
| **per-row retained**                | **654 bytes**                |
| retained leak after clear           | 34 KB                        |
| **10k**                             | **`63.26ms` clear `8.35ms`** |
| **1k**                              | **`4.42ms` clear `0.64ms`**  |
| unique deopts (warmup + 1 measured) | 10                           |
| total deopts                        | 11                           |
| chrome                              | Chrome/147.0.7727.57         |

### deopts

- 2× `dispose :: wrong map` @ `/pages/benchmark/dev/main.js:459:17, /pages/benchmark/dev/main.js:394:13`
- 1× `mapper :: Insufficient type feedback for generic named access` @ `/pages/benchmark/dev/main.js:1865:15`
- 1× `runUpdates :: Insufficient type feedback for generic named access` @ `/pages/benchmark/dev/main.js:1090:43`
- 1× `update :: wrong map` @ `/pages/benchmark/dev/main.js:444:13`
- 1× `disposeOwned :: wrong map` @ `/pages/benchmark/dev/main.js:398:27`
- 1× `doCleanups :: wrong map` @ `/pages/benchmark/dev/main.js:407:30`
- 1× `doRead :: wrong map` @ `/pages/benchmark/dev/main.js:317:28`
- 1× `clear :: Insufficient type feedback for generic named access` @ `/pages/benchmark/dev/main.js:1789:12`
- 1× `rowInit :: wrong call target` @ `/pages/benchmark/dev/main.js:1664:24`
- 1× `cb :: wrong call target` @ `/pages/benchmark/dev/main.js:1813:39`
