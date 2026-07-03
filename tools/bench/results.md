# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for the
multi-line history.

## 2026-07-03 18:33:26 — pota 0.22.235 (dirty) @ 6fe4a270

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1094 KB                      |
| 10k rows attached                   | 7262 KB                      |
| empty heap (post-clear, GC)         | 1122 KB                      |
| **per-row retained**                | **632 bytes**                |
| retained leak after clear           | 28 KB                        |
| **10k**                             | **`49.48ms` clear `4.73ms`** |
| **1k**                              | **`3.26ms` clear `0.45ms`**  |
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
