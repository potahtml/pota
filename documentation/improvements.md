# Improvements — temporal working list

Scope: `src/` excluding `src/use/` (except `toDiff`, which is the
renderer's diff and lives in `src/use/dom.js`). Produced by a full
read of the reactive core, renderer, scheduler, props pipeline, store
layer, and built-in components (2026-07-02). Items marked
**verified** were reproduced headless in node against
`src/lib/solid.js`; the rest are from reading the code and need a
regression test before fixing.

Every bug item links a confirmation test under
`tests/api/confirmations/`. The tests assert the **current buggy
behavior**, so they pass while the bug exists (running one proves the
bug is real) and the suite stays green. Each buggy assertion carries a
`FIXED:` comment with the expected assertion — when a fix lands, the
test fails, and the assertions get flipped, turning the file into the
regression test for the fix.

---

## Possible bugs

### Reactive core

- [x] **Effects die permanently when an exception escapes `batch()` /
      `root()`** — verified. `runUpdates`'s catch discards the queued
      `Updates`/`Effects` (`src/lib/solid.js:982-988`) but the queued
      nodes keep `state = STALE`. `_markObservers`
      (`src/lib/solid.js:105`) only re-queues `CLEAN` observers, so
      every later write to their sources skips them: the effect never
      runs again. Memos self-heal on read; effects are zombies. Repro:
      `batch(() => { s.write(1); throw x })` → catch → `s.write(2)`
      never re-runs the observing effect. **Fixed:** the catch path
      flushes the discarded memo queue (writes before the throw are
      already committed, so a plain `CLEAN` reset would leave memos
      serving stale values) and `CLEAN`-resets the discarded effects,
      which miss the failed batch and recover on the next write.
      Test: `tests/api/confirmations/batch-throw-kills-effects.jsx`

- [x] **`withValue` array: terminal callback never re-fires** —
      verified. In the array branch (`src/lib/solid.js:1200-1236`),
      `--pending === 0` can only be true once; when a reactive item's
      `syncEffect` re-runs later, `pending` goes negative and `fn` is
      never called again. Any array value containing a function
      (`setAttribute`/`setProperty`/`setStyle` values, `derived`
      resolving an array) renders once and then goes permanently
      stale. **Fixed** together with the mutation bug below: the
      array branch resolves items into a copy with a per-slot `done`
      guard; once all slots resolve, any reactive item change
      re-fires `fn` with the updated copy. A pure memo is not viable
      because items can be promises.
      Test: `tests/api/confirmations/with-value-array-stale.jsx`

- [x] **`withValue` array mutates the caller's array in place** —
      verified. `value[i] = item` (`src/lib/solid.js:1221`) replaces
      the user's functions/promises with resolved snapshots. A shared
      or reused array (module-level constant passed to two elements)
      arrives at the second consumer pre-resolved and inert.
      **Fixed** by the copy-based redesign above — the caller's array
      is never touched, and the `resolved` bookkeeping parameter
      (whose only job was routing the mutated array back to the
      terminal branch) is gone.
      Test: `tests/api/confirmations/with-value-array-mutates-input.jsx`

- [x] **`await derived` hangs forever on rejection.** `Derived.then`
      (`src/lib/solid.js:528-539`) ignores its `reject` argument and
      `thenCallbacks` are only drained on successful commit; a
      rejected promise routes through `routeError` but never settles
      awaiting consumers, and `resolved()` stays false. **Fixed:**
      `withValue` gained an internal `onReject` hook; `Derived.write`
      uses it (token-gated against stale rejections) to reject queued
      awaiters and remember the failure in `rejectedWith` until a
      newer attempt starts, so late awaiters settle too. Sync throws
      in the derived's fn settle awaiters the same way via `update()`'s
      catch. Errors still route to the boundary; `resolved()` still
      reports false after a failure.
      Test: `tests/api/confirmations/derived-rejection-hangs.jsx`

- [x] **Memo discards a successful recompute after an error** —
      inherited Solid quirk, confirm intent. After `update()` throws,
      `updatedAt = time + 1`; a read in the same tick re-runs `fn`,
      and if it now succeeds the guard `updatedAt <= time`
      (`src/lib/solid.js:389`) skips the write — the memo ends `CLEAN`
      holding the stale value until some source fires again.
      **Fixed** (intentional divergence from Solid 1.x): Memo tracks
      `errored`; a successful recompute after an error always commits.
      The `time + 1` stamp stays, so upstream/runTop suppression
      within the failing flush is unchanged.
      Test: `tests/api/confirmations/memo-discards-recompute-after-error.jsx`

- [ ] **(skipped 2026-07-02, maintainer decision — revisit later)**
      **`context` Provider with `value={undefined}` renders the
      context value instead of children.** `useContext(newValue, fn)`
      dispatches on `newValue === undefined`
      (`src/lib/solid.js:1080`), so `Provider` falls into read mode,
      returns the current context object as JSX, and never calls the
      children thunk.
      Test: `tests/api/confirmations/context-provider-undefined-value.jsx`

- [ ] **(skipped 2026-07-02, maintainer decision — revisit later)**
      **`root()` / `render()` return `undefined` on setup error.**
      `runWithOwner` catches and routes (`src/lib/solid.js:783-789`),
      so `render()`'s `dispose` can be `undefined` →
      `cleanup(undefined)` is registered and later throws (caught,
      but noisy) inside `doCleanups`.
      Test: `tests/api/confirmations/root-returns-undefined-on-error.jsx`

### `map()` / For

- [ ] **(skipped 2026-07-02, maintainer decision — revisit later;
      preferred direction if fixed: substitute an empty text node as
      the row anchor at materialization, matching how component rows
      already get placeholders)**
      **Rows that render no DOM node crash removal and reorder.** A
      callback returning `null`/`undefined` gives `Row.nodes =
      undefined`; `begin()`/`end()` cache `undefined` and
      `nodesForRow()` (`src/lib/reactive.js:279-292`) returns
      `[undefined]` → `node.remove()` throws on dispose, and
      `.end().after(...)` throws in the sort phase. Mixed arrays with
      a trailing `null` can also infinite-walk `nextSibling`. Tests
      cover `each={null}` but not null row output.
      Test: `tests/api/confirmations/map-null-row-crash.jsx`

- [ ] **(skipped 2026-07-02, maintainer decision — revisit later)**
      **`mapper()` with `fallback` but no `fn` crashes.** The
      fallback path calls `fn(fallback)` unconditionally
      (`src/lib/reactive.js:437`); only `<For>`'s effect passes `fn`.
      Direct `map(list, cb, false, fallback)` usage throws when the
      list empties.
      Test: `tests/api/confirmations/map-fallback-without-fn.jsx`

### Store

- [x] **Map proxy `set` stores the raw value, not the mutable
      proxy.** `mapMethods.set` computes `val = mutable(args[1])` but
      applies the original `args` (`src/lib/store/proxies/map.js:115`)
      — should be `[key, val]`. Consequences: entries added through
      the proxy hold raws while initialization stores proxies;
      `forEach`/`values`/`entries` yield untracked raw objects for
      post-init entries (nested mutations invisible); the no-op check
      `target.get(key) === val` (map.js:103) can never match for
      object values, so same-value sets always fire `valuesWrite`.
      **Fixed:** `set` applies `[key, val]`; the no-op path returns
      the target without re-applying (the old code re-set the raw
      there, clobbering the stored proxy).
      Test: `tests/api/confirmations/store-map-set-stores-raw.jsx`

- [x] **`trackDiff` off-by-one drops the `has` write for the first
      grown index.** `key > oldLength`
      (`src/lib/store/proxies/array.js:200`) should be `>=`:
      `oldLength` is the previous length, so index `oldLength` is the
      first new key. After `unshift`/`splice`/`fill` growth, `key in
      arr` / `hasOwn` tracking for that index never fires (`push` has
      its own correct path). **Fixed:** `>=`.
      Test: `tests/api/confirmations/store-array-trackdiff-off-by-one.jsx`

- [x] **`slice(x, 0)` over-tracks the whole array.** The end
      normalization `end > 0 ? end : end < 0 ? … : target.length`
      (`src/lib/store/proxies/array.js:423`) maps an explicit `0` to
      `target.length`. Subscription-only issue, no wrong values.
      **Fixed:** the normalization dispatches on `end === undefined`.
      Test: `tests/api/confirmations/store-array-slice-zero-end.jsx`

- [x] **`deleteProperty` fires deletion tracking for prototype-only
      keys.** The guard `!(key in target)`
      (`src/lib/store/proxies/base.js:35`) includes the prototype
      chain; deleting a key that exists only on the proto "succeeds"
      without changing anything, yet writes `keyWrite(key, false)` +
      `delete` signals — spurious wakes and a `has` signal that
      disagrees with `key in proxy`. **Fixed:** guard uses `hasOwn`.
      Test: `tests/api/confirmations/store-delete-prototype-key.jsx`

- [x] **Projections can't delete.** `Projection`
      (`src/lib/store/projection.js:62`) has no `deleteProperty`
      trap: `delete proj.k` deletes from the copy-on-write target,
      but `has`/`get`/`ownKeys` keep projecting the source, so the
      key resurrects immediately. Needs a tombstone or explicit trap.
      **Fixed:** lazy per-projection tombstone `Set` — delete makes
      the key absent (overridden keys too, no revert-to-source), a
      later `set` resurrects, `get`/`has`/`ownKeys`/descriptor stop
      projecting tombstoned keys; source untouched.
      Test: `tests/api/confirmations/store-projection-delete.jsx`

### Props / components

- [x] **Functions inside `class` arrays throw.**
      `setClassList`'s array branch passes the raw items to
      `classList.add` (`src/core/props/class.js:47`); a function
      stringifies with spaces → `InvalidCharacterError`. Inconsistent
      with attribute values, where `withValue` resolves array items.
      **Fixed:** the array branch resolves items via `withValue`
      (reactive items re-fire; nested arrays flattened; falsy items
      dropped), snapshots the applied names per run, and registers a
      cleanup — which also fixed the array→object cross-type
      transition leaving stale classes (object→array still has the
      pre-existing limitation).
      Test: `tests/api/confirmations/class-array-function-throws.jsx`

- [x] **`setCSS` corrupts CSS containing `class` as a substring.**
      `value.replace(/class/g, '.' + id)`
      (`src/core/props/css.js:33`) rewrites `.classic`,
      `[class*=…]`, `content: "class"`, etc. Needs a real token match
      (e.g. `/\bclass\b/` at selector positions) or a different
      placeholder. **Fixed:** token match with lookarounds — skips
      longer words (`.classic`, `class-name`, `my-class`), literal
      `.class`/`#class`/`[class` references, and quote-opened
      strings. Residual (documented in the regex comment): `class` as
      a bare word inside a longer quoted string would need a CSS
      tokenizer.
      Test: `tests/api/confirmations/use-css-corruption-and-cache.jsx`

- [x] **`setCSS` cache is keyed globally by CSS string, so a second
      document never gets the stylesheet.** `addAdoptedStyleSheet`
      runs only inside the cache-miss factory
      (`src/core/props/css.js:29-35`); the same CSS used later in a
      shadow root / other document gets the class name but no sheet.
      Cache should be per-document (and is also unbounded for dynamic
      strings — see performance). **Fixed:** the cache holds
      `{ id, sheet }` and adoption runs on every call —
      `addAdoptedStyleSheet` is idempotent per document. Cache growth
      for dynamic strings remains unbounded (see performance).
      Test: `tests/api/confirmations/use-css-corruption-and-cache.jsx`

- [x] **`Switch` with primitive children crashes the default
      fallback.** `matches().find(match => !('when' in match))`
      (`src/components/Switch.js:23`) applies `in` to strings/numbers
      → TypeError when no match matches and `fallback` is nullish.
      **Fixed:** both finders guard with `isObject` — a primitive
      child acts as the fallback content itself, and `null` children
      no longer crash either finder. Regressing the fallback→match
      transition exposed the detached-`prev` renderer bug (next
      item).
      Test: `tests/api/confirmations/switch-primitive-children-crash.jsx`

- [x] **A reactive child going string → function → string renders
      into a detached node.** The function-child branch's cleanup
      removes its placeholder on the next re-run
      (`src/core/renderer.js:465`), but the effect still passes it as
      `prev`; the string branch's `prev instanceof Text` fast path
      (`src/core/renderer.js:388`) then writes into the detached node
      — the text never reaches the document. Trigger: `Switch` losing
      its match content after showing the default fallback.
      **Fixed:** `prev` is reused only while it has a `parentNode`
      (not `isConnected`, so text in detached fragments — `toHTML` —
      keeps the fast path).
      Test: `tests/api/confirmations/renderer-detached-prev-text-reuse.jsx`

- [ ] **`asyncEffect` crashes when `fn` returns a non-promise.**
      `resolved(fn(…), onDone)` (`src/lib/reactive.js:151`) calls
      `.then` on the return value; a sync `fn` returning `undefined`
      throws. Guard with `isPromise` or document the contract.
      Test: `tests/api/confirmations/async-effect-sync-fn-crash.jsx`

- [ ] **`externalSignal.write` matches id-less items with each
      other.** `stale.find(before => before.id === after.id)`
      (`src/lib/reactive.js:182`) pairs any two items whose `id` is
      `undefined`.
      Test: `tests/api/confirmations/external-signal-idless-match.jsx`

---

## Performance / algorithmic improvements

### Reactive core (`src/lib/solid.js`)

- [ ] **Indexed loops on the hottest paths.** `_markObservers`
      (:104), the `Updates` flush (:966), `runEffects` (:1003),
      `upstream` (:1019), `downstream` (:1040) all use `for…of` over
      plain arrays — per-call iterator allocation and generic
      `next()` calls in the tightest loops of the system. Convert to
      `for (let i = 0; i < arr.length; i++)` (re-reading `length`
      preserves visit-appended semantics for the flush loop).

- [ ] **`doRead`/`doWrite` call sites are polymorphic across
      `SignalNode` / `Memo` / `Derived`.** The EMPTY sentinel fixed
      the slot types but the three hidden classes remain at the
      `o.observers`/`o.observerSlots` ICs, and the `Listener` side
      spans Effect/SyncEffect/Memo/Derived. Options: keep
      observer-link fields first and in identical order on every
      observable shape; or extract the link state
      (`observers`/`observerSlots`, `sources`/`sourceSlots`) into one
      dedicated monomorphic node object shared by all kinds, so the
      subscribe/unsubscribe loops only ever see one map.

- [ ] **Three closures per signal.** `SignalNode` allocates
      `read`/`write`/`update` as instance arrows (:606-620). Via
      `Track#prop`, a fully-tracked store key costs up to 4 signals =
      12 closures. `update` is rarely used detached — make it lazy
      (own-property getter that binds on first access) or give the
      tracker a leaner internal signal without `update`/options
      support.

- [ ] **`Derived` construction cost.** `assign(callable, this)`
      copies every own field per derived plus 4–5 arrow fields;
      `_unwrap()` allocates per then-fire. Fine if deriveds are rare;
      worth revisiting if they appear in hot lists.

- [x] **`withValue` array path** allocates
      `wroteValue`/`resolved`/per-item closures and is broken (see
      bugs); redesign as memo-based per-item resolution rather than
      patching `pending`. **Done** with the bug fixes: `resolved` is
      deleted; per-item closures and the lazy `wroteValue` remain
      (promise items preclude a pure memo).

### `map()` / For reconciliation (`src/lib/reactive.js`)

- [ ] **Avoid `toEntries` for arrays.** Both the replaced-all
      pre-scan (:386) and the main loop (:400) allocate an `[index,
      item]` tuple per item per run — 2n allocations per update on
      big lists. Use an indexed loop for arrays; keep the entries
      path for objects/Maps.

- [ ] **Removal pass is O(n²).** `removeFromArray(prev, prev[i--])`
      (:450) does `indexOf` + `splice` per removed row. Replace with
      a single write-index compaction pass.

- [ ] **Swap-phase membership scans are O(n²).**
      `unsort.includes(...)` / `sorted.includes(...)` (:485-507) are
      linear scans inside the per-usort loop. Use runId-style marks
      on `Row` (`row.sortMark = runId`) for O(1) membership, as
      `runId` already does for liveness.

- [ ] **`nodesForRow()` allocates and walks siblings on every call**
      (:279-292) and is invoked repeatedly by the sort loops for the
      same row within a run. Cache per run, or track contiguous spans
      so a move is one `before()` of a cached slice.

- [ ] **`externalSignal.write` is O(n²) with deep-equals.**
      `stale.find` per fresh item plus `equals(before, after)`
      (:180-186). Index `stale` by `id` in a `Map` first; that also
      bounds the deep-equal calls to id-matched pairs.

### Renderer (`src/core/renderer.js`)

- [ ] **Cache `Factory(value)`.** Every `Component()` /
      `createComponent()` call rebuilds the factory closure and
      re-marks it (:107-169, :298-306). Cache per value (Map for tag
      strings, WeakMap for functions/classes/elements) so the
      jsx-runtime path stops allocating identical wrappers per
      element instantiation.

- [ ] **`freeze(props)` on every component creation** (:119, :303)
      is pure guard-rail cost on creation-heavy paths; consider
      DEV-only freezing.

- [ ] **`toDiff` membership is O(n·m)** (`src/use/dom.js:339`):
      `next.includes(item)` per prev item. Build a `Set` from `next`
      above a small length threshold. Matters for large non-keyed
      reactive children (the `map()` path has its own removal).

- [ ] **`flatToArray` boxes every update.** The effect diff path
      (:465-481) calls `flatToArray` per re-run; single-node children
      pay `[arr]` + the `isArray` checks, arrays pay
      `flat(Infinity)` even when already flat. Fast-path the common
      single-node and already-flat cases.

### Props pipeline (`src/core/props/`)

- [ ] **`plugins` / `pluginsNS` as raw `Map`s.** `assignProp` goes
      through the `DataStore` closure with its unused-defaults branch
      on every prop of every element; a plain `Map.get` is direct.
      Micro, but it's the entry to the whole pipeline.

- [ ] **`setCSS` cache growth is unbounded** for dynamic CSS strings
      (global Map keyed by full text, never evicted) — couple this
      with the per-document bug fix above.

### Store (`src/lib/store/`)

- [ ] **Cache method wrappers in `returnFunction`.** Every function
      property read allocates a fresh `(...args) => batch(…)` closure
      (`base.js:126-140`, `array.js:159-173`, `map.js:57-78`,
      `set.js:55-76`) — hot for any loop calling array/map methods,
      and it breaks identity (`proxy.push !== proxy.push`). Cache per
      handler keyed by property key, invalidating when the underlying
      function identity changes.

- [ ] **`isProxyValueReturnInvariant` allocates a descriptor per
      object-valued read.** `reflectGetOwnPropertyDescriptor`
      (`std.js:786-789` via `base.js:121-124`) runs on every `get`
      that returns an object. Non-configurable own props are rare:
      track "target has any non-configurable key" once per handler
      (the `defineProperty` trap sees all later definitions) and skip
      the descriptor fetch on the common path.

- [ ] **Don't signalify prototype data properties.**
      `getPropertyDescriptors` walks the proto chain to catch
      inherited accessors, but `signalifyObject` then hoists
      inherited *methods* onto each instance as accessor wrappers
      (`signalify.js:144-146` only skips functions when `wrapper ===
      identity`). Skip data descriptors sourced from prototypes:
      keeps methods shared, avoids per-instance accessors and
      spurious tracked reads on method access.

- [ ] **Tracker storage for array indices is a null-proto dictionary**
      (`tracker.js:74`); numeric keys as strings force dictionary
      mode. A `Map` (like the identity path) is likely faster for
      index-heavy arrays — measure with the bench.

- [ ] **Array `set` trap always runs the `length` signal write**
      (`array.js:96`) even when length didn't change; the equality
      check absorbs it but still pays `#prop` lookup + write
      machinery per element write. Skip when `key !== 'length'` and
      `target.length` is unchanged.

### Scheduler (`src/core/scheduler.js`)

- [ ] **Bucket arrays are reallocated every flush cycle.** `reset()`
      (:17-20) builds 7 fresh arrays per microtask batch. Keep two
      pre-allocated bucket sets and swap (`run` already captures the
      old set before reset, so double-buffering is safe).
