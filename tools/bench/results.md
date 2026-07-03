# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for the
multi-line history.

## 2026-07-03 18:10:21 — pota 0.22.235 (dirty) @ 375ca01f

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1094 KB                      |
| 10k rows attached                   | 7260 KB                      |
| empty heap (post-clear, GC)         | 1121 KB                      |
| **per-row retained**                | **631 bytes**                |
| retained leak after clear           | 27 KB                        |
| **10k**                             | **`47.50ms` clear `4.77ms`** |
| **1k**                              | **`3.30ms` clear `0.43ms`**  |
| unique deopts (warmup + 1 measured) | 10                           |
| total deopts                        | 12                           |
| chrome                              | Chrome/150.0.7871.46         |

### deopts

- 3× `dispose :: wrong map` @ `/main.js:346:18, /main.js:278:14`
- 1× `mapper :: Insufficient type feedback for generic named access` @
  `/main.js:1436:16`
- 1×
  `runUpdates :: Insufficient type feedback for generic named access`
  @ `/main.js:840:44`
- 1× `update :: wrong map` @ `/main.js:331:14`
- 1× `disposeOwned :: wrong map` @ `/main.js:282:29`
- 1× `doCleanups :: wrong map` @ `/main.js:291:31`
- 1× `doRead :: wrong map` @ `/main.js:204:29`
- 1× `clear :: Insufficient type feedback for generic named access` @
  `/main.js:1373:13`
- 1× `rowInit :: wrong call target` @ `/main.js:1299:27`
- 1× `cb :: wrong call target` @ `/main.js:1389:40`
