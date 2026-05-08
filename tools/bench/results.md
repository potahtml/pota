# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for
the multi-line history.

## 2026-05-08 15:06:00 — pota 0.20.232 @ 81625e5

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1138 KB                      |
| 10k rows attached                   | 7462 KB                      |
| empty heap (post-clear, GC)         | 1174 KB                      |
| **per-row retained**                | **648 bytes**                |
| retained leak after clear           | 35 KB                        |
| **10k**                             | **`62.62ms` clear `8.79ms`** |
| **1k**                              | **`4.17ms` clear `0.67ms`**  |
| unique deopts (warmup + 1 measured) | 10                           |
| total deopts                        | 12                           |
| chrome                              | Chrome/147.0.7727.57         |

### deopts

- 3× `dispose :: wrong map` @ `/pages/benchmark/dev/main.js:469:17, /pages/benchmark/dev/main.js:394:13`
- 1× `mapper :: Insufficient type feedback for generic named access` @ `/pages/benchmark/dev/main.js:1916:15`
- 1× `runUpdates :: Insufficient type feedback for generic named access` @ `/pages/benchmark/dev/main.js:1123:43`
- 1× `update :: wrong map` @ `/pages/benchmark/dev/main.js:454:13`
- 1× `disposeOwned :: wrong map` @ `/pages/benchmark/dev/main.js:398:27`
- 1× `doCleanups :: wrong map` @ `/pages/benchmark/dev/main.js:407:30`
- 1× `doRead :: wrong map` @ `/pages/benchmark/dev/main.js:317:28`
- 1× `clear :: Insufficient type feedback for generic named access` @ `/pages/benchmark/dev/main.js:1840:12`
- 1× `rowInit :: wrong call target` @ `/pages/benchmark/dev/main.js:1739:26`
- 1× `cb :: wrong call target` @ `/pages/benchmark/dev/main.js:1864:39`
