# pota bench — latest run

Overwritten on each `npm run bench`. See `results-short.md` for the
multi-line history.

## 2026-07-02 22:10:24 — pota 0.22.235 (dirty) @ 53ff2cd4

| metric                              | value                        |
| ----------------------------------- | ---------------------------- |
| empty heap (post-warmup, GC)        | 1093 KB                      |
| 10k rows attached                   | 7360 KB                      |
| empty heap (post-clear, GC)         | 1115 KB                      |
| **per-row retained**                | **642 bytes**                |
| retained leak after clear           | 22 KB                        |
| **10k**                             | **`46.89ms` clear `4.97ms`** |
| **1k**                              | **`3.10ms` clear `0.40ms`**  |
| unique deopts (warmup + 1 measured) | 10                           |
| total deopts                        | 12                           |
| chrome                              | Chrome/150.0.7871.46         |

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
