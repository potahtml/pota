# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for the
multi-line history.

## 2026-06-09 05:05:41 — pota 0.20.233 (dirty) @ 2b5594e0

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1097 KB                      |
| 10k rows attached                   | 7335 KB                      |
| empty heap (post-clear, GC)         | 1122 KB                      |
| **per-row retained**                | **639 bytes**                |
| retained leak after clear           | 25 KB                        |
| **10k**                             | **`60.61ms` clear `5.77ms`** |
| **1k**                              | **`4.42ms` clear `0.40ms`**  |
| unique deopts (warmup + 1 measured) | 10                           |
| total deopts                        | 12                           |
| chrome                              | Chrome/149.0.7827.55         |

### deopts

- 3× `dispose :: wrong map` @ `/main.js:331:18, /main.js:263:14`
- 1× `mapper :: Insufficient type feedback for generic named access` @
  `/main.js:1345:16`
- 1×
  `runUpdates :: Insufficient type feedback for generic named access`
  @ `/main.js:781:44`
- 1× `update :: wrong map` @ `/main.js:316:14`
- 1× `disposeOwned :: wrong map` @ `/main.js:267:29`
- 1× `doCleanups :: wrong map` @ `/main.js:276:31`
- 1× `doRead :: wrong map` @ `/main.js:191:29`
- 1× `clear :: Insufficient type feedback for generic named access` @
  `/main.js:1286:13`
- 1× `rowInit :: wrong call target` @ `/main.js:1212:27`
- 1× `cb :: wrong call target` @ `/main.js:1302:40`
