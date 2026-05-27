# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for the
multi-line history.

## 2026-05-27 04:16:19 — pota 0.20.233 (dirty) @ 1b2cb84

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1139 KB                      |
| 10k rows attached                   | 7469 KB                      |
| empty heap (post-clear, GC)         | 1167 KB                      |
| **per-row retained**                | **648 bytes**                |
| retained leak after clear           | 28 KB                        |
| **10k**                             | **`45.53ms` clear `6.35ms`** |
| **1k**                              | **`4.20ms` clear `0.50ms`**  |
| unique deopts (warmup + 1 measured) | 10                           |
| total deopts                        | 12                           |
| chrome                              | Chrome/147.0.7727.57         |

### deopts

- 3× `dispose :: wrong map` @
  `/pages/benchmark/dev/main.js:474:17, /pages/benchmark/dev/main.js:399:13`
- 1× `mapper :: Insufficient type feedback for generic named access` @
  `/pages/benchmark/dev/main.js:1902:15`
- 1×
  `runUpdates :: Insufficient type feedback for generic named access`
  @ `/pages/benchmark/dev/main.js:1112:43`
- 1× `update :: wrong map` @ `/pages/benchmark/dev/main.js:459:13`
- 1× `disposeOwned :: wrong map` @
  `/pages/benchmark/dev/main.js:403:27`
- 1× `doCleanups :: wrong map` @ `/pages/benchmark/dev/main.js:412:30`
- 1× `doRead :: wrong map` @ `/pages/benchmark/dev/main.js:322:28`
- 1× `clear :: Insufficient type feedback for generic named access` @
  `/pages/benchmark/dev/main.js:1826:12`
- 1× `rowInit :: wrong call target` @
  `/pages/benchmark/dev/main.js:1725:26`
- 1× `cb :: wrong call target` @
  `/pages/benchmark/dev/main.js:1850:39`
