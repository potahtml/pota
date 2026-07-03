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

- [x] **`splice` stores raw values.** The handler wrapped inserted
      items into a discarded local (`items = args.slice(2).map(…)`)
      and applied the original raw `args` — breaking the
      stored-proxies invariant every other write path keeps:
      `indexOf`/`includes` missed spliced-in items, iteration yielded
      raws. Found 2026-07-03 in the full proxies audit (todo.md
      note). **Fixed:** `args` items wrapped in place, like
      `toSpliced`.
      Test: `tests/api/confirmations/store-array-splice-raw.jsx`

- [x] **Array search and positional reads undertrack.** `slice`
      subscribed only to the key range (growth appended keys it never
      saw); `indexOf`/`lastIndexOf` tracked only the found slot —
      nothing at all on a miss, and an earlier occurrence appearing
      went unseen; `at`/`with` resolved negative indices against
      `length` without tracking it, and `with` tracked one slot
      though its result copies the whole array. From the same audit.
      **Fixed:** `slice` also reads `length`; the search methods and
      `with` use the coarse `valuesRead`; `at` tracks `length` for
      negative/missing indices plus the undefined-state for absent
      slots (the now-unused `trackKey` helper is gone).
      Test: `tests/api/confirmations/store-array-read-tracking.jsx`

- [x] **Set composition methods untracked; generators lack per-yield
      subscriptions.** The ES2025 composition methods (`union`,
      `intersection`, `difference`, `symmetricDifference`,
      `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`) were missing
      from `setMethods` — they fell through the generic apply with no
      tracking. The `values`/`keys`/`entries` generators subscribed
      only after full iteration, so a `break` left zero
      subscriptions. From the same audit. **Fixed:** composition
      methods subscribe via `valuesRead` (a proxied set-like argument
      tracks through its own traps); generators do a per-element
      `keyRead` at each yield, matching the Map generators' design.
      Test: `tests/api/confirmations/store-set-methods-tracking.jsx`

- [x] **Map keys never normalized.** Wrap-time keys stayed raw while
      values were proxied, and the keyed methods didn't `mutable()`
      the key argument (Set normalizes everywhere) — `has`/`get` with
      the proxy of a raw wrap-time key missed the entry. From the
      same audit. **Fixed** (maintainer decision — normalize, not
      document): keys wrapped at wrap time (entries rebuilt to
      preserve insertion order) and in `has`/`get`/`set`/`delete` and
      the upsert methods; `keys()` now yields proxies, consistent
      with values.
      Test: `tests/api/confirmations/store-map-key-identity.jsx`

- [x] **Map `getOrInsert`/`getOrInsertComputed` fall through
      untracked.** On engines shipping the ES2026 upsert methods the
      insert went unnotified and stored the raw value unwrapped. From
      the same audit. **Fixed:** both delegate write bookkeeping to
      the `set` handler (computed value wins even when the callback
      inserts the key, per spec) and subscribe to the key's value
      like `get`; the handlers are inert on engines without the
      methods.
      Test: `tests/api/confirmations/store-map-get-or-insert.jsx`

- [x] **`Object.prototype.propertyIsEnumerable` is untracked** on
      plain-object proxies (only `hasOwnProperty` is intercepted in
      `objectMethods`). Minor — rare in app code; found in the same
      audit, recorded for completeness. **Fixed:** intercepted with
      the same key-presence tracking as `hasOwnProperty`;
      enumerability-only transitions ride on `defineProperty`'s
      `keysWrite`.
      Test: `tests/api/store/mutable.jsx`.

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

- [x] **`asyncEffect` crashes when `fn` returns a non-promise.**
      `resolved(fn(…), onDone)` (`src/lib/reactive.js:151`) calls
      `.then` on the return value; a sync `fn` returning `undefined`
      throws. Guard with `isPromise` or document the contract.
      **Fixed:** guarded with `isPromise` — a non-thenable return
      completes the run synchronously (`onDone()` right away), so
      re-runs never wait on a sync run; `resolved` keeps its
      promise-only contract.
      Test: `tests/api/confirmations/async-effect-sync-fn-crash.jsx`

- [x] **`toDiff` fast-clear breaks on falsy prev slots** — two
      symptoms, one root cause: the short branch assumed every `prev`
      slot is a node. (1) Leading falsy slot: the parent lookup
      `prev[0] && prev[0].parentNode` (`src/use/dom.js:312`) went
      falsy, the branch returned as if the parent left the document,
      and the per-item removal loop below was skipped — real nodes
      after the falsy slot were never removed on clear. (2) Mid-array
      falsy slot: `prev.length + 1 === parent.childNodes.length`
      counted falsy slots as nodes, so the heuristic could
      coincidentally match and the `textContent = ''` wipe destroyed
      sibling nodes that were never part of the reactive child. Found
      2026-07-03 while pinning edges for the `flatToArray` perf item.
      **Fixed:** the branch scans `prev` once for the first real node
      (falsy slots say nothing about the parent) and counts only real
      nodes for the whole-content heuristic; all-falsy returns early,
      everything else falls through to the guarded removal loop.
      Test: `tests/api/confirmations/todiff-leading-falsy-skips-removal.jsx`

- [x] **`externalSignal.write` matches id-less items with each
      other.** `stale.find(before => before.id === after.id)`
      (`src/lib/reactive.js:182`) pairs any two items whose `id` is
      `undefined`.
      **Resolved by documenting the contract** (2026-07-03,
      maintainer decision): behavior unchanged; the `externalSignal`
      JSDoc now states items are matched by `id` and id-less items
      get no reliable reference reuse. The confirmation test pins the
      documented behavior.
      Test: `tests/api/confirmations/external-signal-idless-match.jsx`

---

## Performance / algorithmic improvements

### Reactive core (`src/lib/solid.js`)

- [x] **Indexed loops on the hottest paths.** `_markObservers`
      (:104), the `Updates` flush (:966), `runEffects` (:1003),
      `upstream` (:1019), `downstream` (:1040) all use `for…of` over
      plain arrays — per-call iterator allocation and generic
      `next()` calls in the tightest loops of the system. Convert to
      `for (let i = 0; i < arr.length; i++)` (re-reading `length`
      preserves visit-appended semantics for the flush loop).
      **Fixed:** all five (plus the catch-path flush copy) converted,
      hoisting the array reference — matching `for…of`'s
      captured-array semantics — with a live `length` read so
      computations queued during the flush are still visited; the
      cold error-recovery reset keeps `for…of`. Bench-neutral within
      run noise (10k 45.2 baseline vs 46.4/51.6ms across after-runs;
      per-row 625B and deopts 10/12 unchanged) — the removed
      iterator work sits below this bench's noise floor.

- [ ] **(skipped 2026-07-03, maintainer decision — revisit later;
      highest-risk area, payoff unmeasurable with current bench
      noise)**
      **`doRead`/`doWrite` call sites are polymorphic across
      `SignalNode` / `Memo` / `Derived`.** The EMPTY sentinel fixed
      the slot types but the three hidden classes remain at the
      `o.observers`/`o.observerSlots` ICs, and the `Listener` side
      spans Effect/SyncEffect/Memo/Derived. Options: keep
      observer-link fields first and in identical order on every
      observable shape; or extract the link state
      (`observers`/`observerSlots`, `sources`/`sourceSlots`) into one
      dedicated monomorphic node object shared by all kinds, so the
      subscribe/unsubscribe loops only ever see one map.

- [ ] **(skipped 2026-07-03, maintainer decision — revisit later)**
      **Three closures per signal.** `SignalNode` allocates
      `read`/`write`/`update` as instance arrows (:606-620). Via
      `Track#prop`, a fully-tracked store key costs up to 4 signals =
      12 closures. `update` is rarely used detached — make it lazy
      (own-property getter that binds on first access) or give the
      tracker a leaner internal signal without `update`/options
      support.

- [ ] **(skipped 2026-07-03, maintainer decision — revisit later)**
      **`Derived` construction cost.** `assign(callable, this)`
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

- [x] **Avoid `toEntries` for arrays.** Both the replaced-all
      pre-scan (:386) and the main loop (:400) allocate an `[index,
      item]` tuple per item per run — 2n allocations per update on
      big lists. Use an indexed loop for arrays; keep the entries
      path for objects/Maps.
      **Fixed:** `mapper` hoists `isArray` once per run; arrays
      iterate positions directly (zero tuples), non-arrays
      materialize `toEntries` once and share the same indexed loop.
      Alongside (own commit): `toEntries` gained real plain-object
      support — `Object.entries` fallback for non-iterable objects
      (previously `<For each={obj}>` silently rendered nothing) and
      an `isFunction` guard so a data property named `entries`
      doesn't break iteration. Bench-neutral timing (transient
      allocations; 10k 46.9ms in-band, per-row 623B, deopts 10/12).
      Tests: `tests/api/components/for.jsx` (object/Map/Set
      coverage).

- [x] **Removal pass is O(n²).** `removeFromArray(prev, prev[i--])`
      (:450) does `indexOf` + `splice` per removed row. Replace with
      a single write-index compaction pass.
      **Fixed:** write-index compaction — one pass, O(n) regardless
      of how many rows leave; same dispose order and survivor order.
      Edge-case tests were added first and pinned against the old
      implementation (removal from every position, scattered/bulk,
      duplicates, cleanup counts, node reuse, reactiveIndex
      re-indexing), then the swap confirmed identical output.
      Tests: `tests/api/components/for.jsx` (removal / shrinking
      section).

- [x] **Swap-phase membership scans are O(n²).**
      `unsort.includes(...)` / `sorted.includes(...)` (:485-507) are
      linear scans inside the per-usort loop. Use runId-style marks
      on `Row` (`row.sortMark = runId`) for O(1) membership, as
      `runId` already does for liveness.
      **Fixed:** `unsortMark`/`sortedMark` run-scoped stamps on
      `Row`, set at the same push sites (arrays and placement logic
      untouched — pushes stay as the source of truth, marks mirror
      them). Permutation tests (reverse, rotations, shuffles, mixed
      add/remove/reorder, repeated reorders, duplicates,
      reactiveIndex) were pinned green against the `includes`
      version first. Cost: the two fields retain ~8B/row (bench
      623→631B); timing in-band (10k 43.9ms), deopts 10/12
      unchanged.
      Tests: `tests/api/components/for.jsx` (permutation section).

- [ ] **(skipped 2026-07-03, maintainer decision — revisit together
      with the skipped null-row `nodesForRow` bug as one
      span-tracking redesign; ~1-2 small walks per row per reorder,
      caching costs another `Row` field)**
      **`nodesForRow()` allocates and walks siblings on every call**
      (:279-292) and is invoked repeatedly by the sort loops for the
      same row within a run. Cache per run, or track contiguous spans
      so a move is one `before()` of a cached slice.

- [x] **`externalSignal.write` is O(n²) with deep-equals.**
      `stale.find` per fresh item plus `equals(before, after)`
      (:180-186). Index `stale` by `id` in a `Map` first; that also
      bounds the deep-equal calls to id-matched pairs.
      **Fixed:** one first-wins `Map` per write (first occurrence
      kept, so duplicate-id and the documented id-less first-match
      contract behave exactly as `find` did), O(1) lookups,
      deep-equal only on the id-matched pair. Gate: the id-less
      contract confirmation test + reactivity suite.

### Renderer (`src/core/renderer.js`)

- [ ] **(skipped 2026-07-03, maintainer decision — revisit in a
      dedicated xml-path perf pass: the preset hoists
      `createComponent` per type, plain fns self-cache via the
      `$isComponent` stamp, and the xml per-render props churn
      dwarfs the factory closure)**
      **Cache `Factory(value)`.** Every `Component()` /
      `createComponent()` call rebuilds the factory closure and
      re-marks it (:107-169, :298-306). Cache per value (Map for tag
      strings, WeakMap for functions/classes/elements) so the
      jsx-runtime path stops allocating identical wrappers per
      element instantiation.

- [x] **`freeze(props)` on every component creation** (:119, :303)
      is pure guard-rail cost on creation-heavy paths; consider
      DEV-only freezing.
      **Fixed:** dev-mode flag (`src/lib/dev.js`, off by default) —
      the four renderer freeze sites are gated behind `DEV`. Enabled
      via `import 'pota/dev'` (new subpath) or automatically by
      `pota/jsx-dev-runtime` (now its own module). Consumer-facing
      change documented in the breaking-changes skill (0.22.236).
      Test: `tests/api/jsx/dev-mode.jsx`.

- [ ] **(skipped 2026-07-03, maintainer decision — revisit later)**
      **`toDiff` membership is O(n·m)** (`src/use/dom.js:339`):
      `next.includes(item)` per prev item. Build a `Set` from `next`
      above a small length threshold. Matters for large non-keyed
      reactive children (the `map()` path has its own removal).

- [x] **`flatToArray` boxes every update.** The effect diff path
      (:465-481) calls `flatToArray` per re-run; single-node children
      pay `[arr]` + the `isArray` checks, arrays pay
      `flat(Infinity)` even when already flat. Fast-path the common
      single-node and already-flat cases.
      **Fixed:** an already-flat array is returned as-is (one
      nested-array scan; `.flat(Infinity)` only when actually
      nested) — safe because `createChildren`'s array returns are
      fresh per run and `toDiff` neither mutates nor retains beyond
      returning `next`; the aliasing contract is documented on the
      JSDoc and pinned by an identity test. Non-array boxing stays
      (`toDiff` wants arrays). Pinning edges for this exposed the
      `toDiff` falsy-slot fast-clear bug above (fixed together).
      Bench-neutral (10k 49.1ms in-band, per-row 631B, deopts 10/12).
      Tests: `tests/api/dom/reactive-children.jsx`
      (nested/flat/single/empty switching, shrink-to-empty),
      `tests/api/std.jsx`.

### Props pipeline (`src/core/props/`)

- [x] **`plugins` / `pluginsNS` as raw `Map`s.** `assignProp` goes
      through the `DataStore` closure with its unused-defaults branch
      on every prop of every element; a plain `Map.get` is direct.
      Micro, but it's the entry to the whole pipeline.
      **Fixed:** both are plain `new Map()`s
      (`src/core/props/plugin.js`) — only `plugin.js` (`.set`) and
      `@main.js` (`.get`) ever touched them, and neither used the
      `DataStore` defaults argument or iterator. Bench-neutral (10k
      50.9ms in-band, per-row 631B, deopts 10/12); gate was the full
      suite (props dispatch is exercised everywhere).

- [x] **`setCSS` cache growth is unbounded** for dynamic CSS strings
      (global Map keyed by full text, never evicted) — couple this
      with the per-document bug fix above.
      **Resolved by documenting the contract** (2026-07-03,
      maintainer decision): behavior unchanged — a real fix means
      refcounted sheet lifecycle (bounding only the Map wouldn't
      release the adopted sheets, which are the actual growth), and
      dynamic CSS text is better served by CSS custom properties.
      Documented in the `setCSS` JSDoc and the `use:css` docs page
      (`documentation/content/guide/jsx/use:css.md`).

### Store (`src/lib/store/`)

- [x] **Cache method wrappers in `returnFunction`.** Every function
      property read allocates a fresh `(...args) => batch(…)` closure
      (`base.js:126-140`, `array.js:159-173`, `map.js:57-78`,
      `set.js:55-76`) — hot for any loop calling array/map methods,
      and it breaks identity (`proxy.push !== proxy.push`). Cache per
      handler keyed by property key, invalidating when the underlying
      function identity changes.
      **Fixed:** `returnFunction` lives once on the base handler as
      the cached entry point (lazy per-handler `Map` of
      `key → { value, wrapper }`, safe because handlers are 1:1 with
      targets); the four former bodies became `makeFunction`
      overrides. Method identity is now stable
      (`proxy.push === proxy.push`) and a property swapped to a
      different function invalidates by `value` identity. Bench
      neutral (10k 47.5ms in-band, 631B, deopts 10/12).
      Tests: `tests/api/store/mutable.jsx` (identity + invalidation).

- [x] **`isProxyValueReturnInvariant` allocates a descriptor per
      object-valued read.** `reflectGetOwnPropertyDescriptor`
      (`std.js:786-789` via `base.js:121-124`) runs on every `get`
      that returns an object. Non-configurable own props are rare:
      track "target has any non-configurable key" once per handler
      (the `defineProperty` trap sees all later definitions) and skip
      the descriptor fetch on the common path.
      **Fixed:** per-handler `hasFrozenProps` flag — scanned once at
      wrap, kept current by both `defineProperty` traps (re-fetching
      the resulting descriptor, since partial descriptors default new
      props to frozen); `returnValue` skips the invariant check while
      the flag is off. The flag and the helper now use the actual
      [[Get]] invariant condition (non-configurable AND non-writable
      — the helper was looser than its own JSDoc), which is what
      keeps the flag off for arrays despite `length` being
      non-configurable. Freezing the raw target behind the proxy's
      back is not observable — that stays the engine's invariant
      error (documented on the flag). `projection.js` still uses the
      (tightened) helper per read — different target semantics, out
      of scope. Bench in-band (10k 49.5ms, 632B, deopts 10/12).
      Tests: `tests/api/store/mutable.jsx` ([[Get]] invariant at wrap
      time and post-wrap define).

- [x] **Don't signalify prototype data properties.**
      `getPropertyDescriptors` walks the proto chain to catch
      inherited accessors, but `signalifyObject` then hoists
      inherited *methods* onto each instance as accessor wrappers
      (`signalify.js:144-146` only skips functions when `wrapper ===
      identity`). Skip data descriptors sourced from prototypes:
      keeps methods shared, avoids per-instance accessors and
      spurious tracked reads on method access.
      **Fixed:** one guard in `signalifyObject`'s loop — function-
      valued data descriptors not own to the target are skipped;
      methods resolve through the proxy's cached `returnFunction`
      instead. Inherited accessors and non-function proto data props
      keep the per-instance signalify, and explicit
      `signalify(obj, keys)` is untouched. Traded away: reading a
      method *itself* is no longer a reactive dependency (a
      per-instance method swap still works via wrapper-cache
      invalidation, it just doesn't wake effects that read the
      method). Bench neutral (10k 51.9ms in-band, 631B, deopts
      10/12).
      Tests: `tests/api/store/mutable.jsx` (shared methods, tracked
      inherited getter, tracked proto data prop).

- [x] **Tracker storage for array indices is a null-proto dictionary**
      (`tracker.js:74`); numeric keys as strings force dictionary
      mode. A `Map` (like the identity path) is likely faster for
      index-heavy arrays — measure with the bench.
      **Resolved by measurement — keeping the object storage**
      (2026-07-03): headless micro-bench (10k indices × 200 passes of
      trap-style string reads + numeric reads + numeric writes,
      real `signal()`s) puts the current null-proto object at ~90-105ms
      vs ~207ms for a `Map` — the premise was wrong, V8 keeps
      integer-like keys in the elements backing store (not dictionary
      mode), which beats Map hashing, and the Map variant must also
      pay number↔string normalization since proxy traps pass strings
      while `trackDiff`/`trackKeysRange`/`push` pass numbers. The main
      bench couldn't have measured this either way (its rows are
      plain signal arrays, not store arrays).

- [ ] **(skipped 2026-07-03, maintainer decision — revisit later)**
      **Array `set` trap always runs the `length` signal write**
      (`array.js:96`) even when length didn't change; the equality
      check absorbs it but still pays `#prop` lookup + write
      machinery per element write. Skip when `key !== 'length'` and
      `target.length` is unchanged.

### Scheduler (`src/core/scheduler.js`)

- [ ] **(skipped 2026-07-03, maintainer decision — unmeasurable win,
      keeps `reset()` trivially correct; the swap would also lean on
      `owned()` guaranteeing no throw-out of `call()` so buckets
      always get cleared)**
      **Bucket arrays are reallocated every flush cycle.** `reset()`
      (:17-20) builds 7 fresh arrays per microtask batch. Keep two
      pre-allocated bucket sets and swap (`run` already captures the
      old set before reset, so double-buffering is safe).
