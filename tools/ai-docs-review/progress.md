# Docs content normalization — progress

Generated checklist for every `.md` under `documentation/content/`
(**327 files**). One pass, one consistent standard. **Resumable** —
see below.

## How to resume (READ THIS FIRST)

This file is the single source of truth for the docs normalization
pass. Work is **synchronous, file-by-file, no subagents** (subagents
silently die at the session limit). If a session ends, a fresh one
resumes with zero context loss by following these steps:

1. Scan the checklists below top-to-bottom. **The first unchecked
   `- [ ]` box is where to resume.**
2. Per-file boxes are grouped by source module. For the group
   containing the next unchecked file, open its **source** (listed in
   the group header) and read it fully — then verify each unchecked
   file in that group against the Spec, fixing in place.
3. Tick a file `- [x]` the moment it is fully verified+fixed, with a
   short note: `✓ clean` or `✓ fixed: <what>` or `⚑ flagged`. A box is
   "done" ONLY once it is ticked here.
4. Global checks (completeness, overview links, topics.js, build) have
   their own boxes near the bottom — do them after (or alongside) the
   per-file pass as noted.
5. Append every substantive fix to **Fixes applied** and every
   uncertainty to **Flags for maintainer**. Never delete a flag
   without resolving it.
6. NEVER commit. The maintainer reviews diffs in their own git client.

## Spec — the standard every page must meet

Ticking a file's box asserts ALL of the following were verified for it
(and fixed in place where needed). **Accuracy is #1**: read the source
module listed for the group before judging; every statement, argument
name/type, return value, option, and behavior MUST match the actual
code. Never document a method/option that does not exist; never omit a
load-bearing one.

1. **Format** — frontmatter has exactly: `title` (KEEP verbatim —
   referenced by topics.js), `subpath`, `topic`, `desc` (REQUIRED, one
   short plain-text sentence ≤120 chars). `kind: component` ONLY on
   capitalized-component pages; no other `kind`. No
   `bucket`/`exports`/`tagline`. Body order: `# H1` → 1–3¶ lede (first
   sentence mirrors `desc`; link related exports as markdown links) →
   `## Arguments`/`## Attributes` table (types match the real
   signature; `**Returns:**` when meaningful) or `## Exports`
   link-list for overview pages → optional `## Section` explanations →
   `## Examples`.
2. **Example 1-liners** — every `### example` under `## Examples`
   opens with a leading one-line prose description (a clear, simple
   statement of what the example shows) BEFORE the code fence. A
   `## Section` that merely mirrors an example is forbidden — fold it
   into the example's 1-liner and delete the stray heading.
3. **Accurate desc** — the `desc` and lede are an accurate, clear,
   simple description of what the export actually is/does, matching
   source.
4. **Idiomatic examples** — native `on:click` / component `onClick`;
   `class=` not `className`; reactive child/prop is the READER fn
   `{count.read}` / `{() => …}` / `<Show when={flag.read}>` (never
   `{signal}` as a child; `{signal.read()}` only for a deliberate
   static snapshot); signal API `.read()`/`.write(v)` (no prev
   arg)/`.update(prev=>next)`; inline style keys KEBAB-CASE; `use/*`
   plugins via `use:ref={factory(opts)}` (compose
   `use:ref={[a(),b()]}`); prefer derivation (memo/derived/resolve)
   over effects; runnable examples are SELF-CONTAINED ending in
   `render(App)`; relative imports include the file extension; tabs,
   single quotes, no semicolons.

Hard constraints: NEVER change a `title` or `subpath` value. Do not
touch `src/`, the parser, or the runtime. Edit content `.md` files
(and `topics.js`) in place. For anything genuinely ambiguous (a
behavior you can't confirm from source), do NOT guess — add it to
**Flags for maintainer** below instead of editing.

---

## Global checks

- [x] **G1 — Mechanical format + example-1-liner validation** — ✓
      validate.mjs final run after all edits — 327/327 compliant, 0
      issues
- [x] **G2 — Completeness** — ✓ completeness.mjs — no genuine gaps.
      All MISSING-eponymous-export reports are the documented-on-index
      pattern (verified per-file during the pass); Emitter-pair
      orphans (focus/fullscreen/orientation/resize/visibility) are the
      checker not parsing export const { on:, use: } destructuring;
      top-level isComponent/addEvent/owner are a comment-parsing
      artifact in exports.js; Linkify ships under its own
      pota/components/Linkify subpath (package.json), which page +
      tests use
- [x] **G3 — Overview/index pages** — ✓ overview.mjs — all index pages
      link every sub-page
- [x] **G4 — topics.js** — ✓ topics-check.mjs — comprehensive, no More
      bucket, 5 intentional duplications listed
- [x] **G5 — `npm run build` (vite)** — ✓ npm run build green (~2s;
      chunk-size warning informational); spot-checked this segment's
      edits present in dist chunks (isExternal, onDocumentVisible,
      uploadFile)
- [x] **G6 — Internal-link integrity** — ✓ links.mjs — 0 broken
      internal links on final run
- [x] **G7 — Example type-check** — ✓ typecheck.mjs — 409/409 fences
      type-clean, 0 failing, 10 intentional. Fixed my paginate.md
      regression (Promise<unknown> from new Promise → async fn
      returning the typed slice). Encoded the 4 known-inherent
      failures in the ALLOW map with per-code comments (load.md TS2307
      app-local lazy imports; updateBlacklist TS2345 window vs
      globalThis; toHTML TS2345 ChildNode union; pasteText TS2339
      textarea members on Element) so future runs only surface real
      regressions

---

## Per-file checklist (grouped by source module)

### reactive — source: `src/lib/reactive.js (+ src/lib/solid.js)` (30)

- [x] `Pota.md` — ✓ clean (createClass: freeze-merge of props field +
      JSX props, ready/cleanup auto-registered — all verified)
- [x] `action.md` — ✓ fixed: lede said returned functions are read
      reactively — resolve() uses a run-once track(), stages never
      re-run on signal change; now says unwrapped, one-shot
- [x] `addEvent.md` — ✓ clean (off() return, cleanup registration,
      object-handler-as-options all match source)
- [x] `asyncEffect.md` — ✓ clean (prev = second-to-last queued
      promise, undefined when none pending; resolved() marks done —
      matches)
- [x] `batch.md` — ✓ clean (batch=runUpdates; handlers/cleanups
      already batched via runWithOwner; reads stay fresh in-batch)
- [x] `catchError.md` — ✓ clean (syncEffect boundary, untracked fn,
      returns undefined on throw — matches; root() in example is
      harmless isolation)
- [x] `cleanup.md` — ✓ fixed: DOM-removal-ordering claim was wrong —
      cleanups run BEFORE the scope nodes detach (verified
      empirically; For rows are the opposite); reworded para + example
      one-liner
- [x] `context.md` — ✓ clean (replace-not-merge, Provider value, walk
      parent-chain, functional override return — all match source;
      stale carried flag resolved)
- [x] `derived.md` — ✓ fixed: isResolved flips false on every pending
      re-run (not just before first commit); per-stage re-run wording
      aligned with source; Errored reset note corrected (state
      recreated, id back to 1)
- [x] `effect.md` — ✓ fixed (second pass): "scheduled, not
      synchronous" was wrong — effects drain at end of the current
      batch, synchronously; void return + useTimeout owner-aware claim
      verified against use/time.js
- [x] `externalSignal.md` — ✓ fixed: id type in table widened to
      string | number (matches @template); deep-equal claim verified
      (std equals is fast-deep-equal)
- [x] `isComponent.md` — ✓ clean (isFunction + $isComponent check;
      renderer.js:153 uses same check; example idioms verified)
- [x] `isResolved.md` — ✓ fixed: latch wording (resolved at least
      once) → pending-window semantics; desc/lede/Returns reworded;
      noted resolved() tracks
- [x] `listener.md` — ✓ clean (returns Listener or undefined;
      untrack/owner distinction accurate; event-handler demo verified
      against ownedEvent semantics)
- [x] `makeCallback.md` — ✓ clean (untracked-marked/tracked-plain
      matches source; Show/Switch/For/Errored usage confirmed)
- [x] `map.md` — ✓ fixed: callback-runs claim (only new entries, not
      removed); fallback/reactiveIndex example was inert — added
      reverse+clear buttons
- [x] `markComponent.md` — ✓ fixed: example used <A/> position where
      Factory marks anyway — rewritten to child position (tracked vs
      marked), the case the mark exists for
- [x] `memo.md` — ✓ fixed: layered-memos closing claim was muddled —
      now states the memo propagation boundary; laziness claim
      verified (Memo ctor never runs fn; Show children are lazy thunks
      via createPartial)
- [x] `on.md` — ✓ fixed: fn row now notes the initial run (effect runs
      once on creation); rest verified vs solid.js on()
- [x] `owned.md` — ✓ fixed: onCancel example could never cancel
      (nothing disposed) — now a Show-unmount demo exercising both
      paths; semantics verified vs solid.js owned()
- [x] `owner.md` — ✓ fixed: lede said undefined outside a tracked
      scope (tracking≠ownership, the page's own distinction) — now
      reactive scope
- [x] `ref.md` — ✓ clean (signalFunction shape; setRef runs sync at
      creation via propsPlugin('use:ref', setRef, false); array
      composition; ready() for connection — all verified)
- [x] `removeEvent.md` — ✓ clean (returns re-attaching on(); off/on
      round-trip example starts detached as stated; types match
      source)
- [x] `resolve.md` — ✓ clean (memo-in-memo, caller-owned tracking
      boundary, unwrap instantiates thunks — all verified; caching
      example demonstrates the point)
- [x] `root.md` — ✓ fixed: desc/lede said tracking scope (it creates
      an owner with no listener); example 1 now registers cleanup()
      inside the root instead of a hand-rolled teardown wrapper
- [x] `signal.md` — ✓ clean (bound methods, write→boolean, untracked
      update, equals options, all examples idiomatic and verified)
- [x] `syncEffect.md` — ✓ fixed: next-scheduler-tick contrast was
      wrong (effects drain synchronously at batch end —
      tests/api/reactivity/sync-effect.jsx) — now documents immediate
      creation run + ahead-of-user-effects phase
- [x] `untrack.md` — ✓ clean (clears Listener keeps Owner; update()
      untrack note matches SignalNode)
- [x] `unwrap.md` — ✓ fixed: one-level flatten claim → nested arrays
      flatten fully (recursion + spread); console-only example
      appropriate for non-visual helper
- [x] `withValue.md` — ✓ clean (tracking via syncEffect, recursive
      promise/array resolution, ref-factory example matches the
      use:ref pattern)

### renderer — source: `src/core/renderer.js` (5)

- [x] `Component.md` — ✓ clean (preset/override shallow merge,
      factory-without-props path, Factory value handling — all match
      renderer.js)
- [x] `Fragment.md` — ✓ clean (props => props.children; both forms
      shown)
- [x] `insert.md` — ✓ fixed: parent type now includes DocumentFragment
      (ShadowRoot) per source JSDoc
- [x] `render.md` — ✓ fixed: tracking-scope wording → owner scope;
      parent type now includes DocumentFragment (its own shadow-root
      example needs it)
- [x] `toHTML.md` — ✓ clean (fragment materialization, single-node vs
      NodeList return, reactivity-preserved claim verified)

### scheduler — source: `src/core/scheduler.js` (2)

- [x] `ready.md` — ✓ fixed: dropped phantom onRef scheduler phase
      (refs are sync at creation); fn type tightened;
      connected→onMount ordering verified in lifecycle.js
- [x] `readyAsync.md` — ✓ fixed: fn type tightened; counter
      semantics + stay-queued behavior verified vs asyncTracking

### props — source: `src/core/props/{attribute,property,style,class}.js` (5)

- [x] `setAttribute.md` — ✓ clean (withValue unwrap,
      false/null/undefined removal, true→empty string — all match
      attribute.js)
- [x] `setClass.md` — ✓ clean (public setClass = setElementClass(node,
      name, value) via exports.js rename — 3-arg toggle, reactive via
      withPrevValue; both examples correct)
- [x] `setClassList.md` — ✓ fixed: string branch adds tokens
      (tokenList→classList.add), it does not replace wholesale
- [x] `setProperty.md` — ✓ clean (null/undefined→null property write,
      withValue unwrap — matches property.js)
- [x] `setStyle.md` — ✓ clean (public setStyle = setElementStyle via
      exports.js rename — single-property setter, null/undefined/false
      removeProperty)

### std — source: `src/lib/std.js` (1)

- [x] `getValue.md` — ✓ clean (while-isFunction unwrap loop matches
      std.js)

### version — source: `src/version.js` (1)

- [x] `version.md` — ✓ clean (string export verified)

### guide — source: `src/core/props/* + src/core/renderer.js + JSX semantics (documentation/jsx.md)` (11)

- [x] `guide/attributes-properties.md` — ✓ fixed: Children section was
      wrong — children attr on a native element compiles to a literal
      HTML attribute (verified via preset output); on components
      explicit children win via duplicate key; Component() factory
      honors children prop
- [x] `guide/jsx/class:__.md` — ✓ fixed: namespace-undefined example
      claimed keeps orange — plain undefined removes it (verified with
      scratch browser test); added reactive-init-guard line +
      object-removal in table
- [x] `guide/jsx/on:__.md` — ✓ clean (case-sensitivity,
      handleEvent+options object, array handlers — match
      setEvent/addEvent)
- [x] `guide/jsx/prop:__.md` — ✓ clean (null/undefined→null + progress
      rationale; textarea contrast example correct)
- [x] `guide/jsx/style:__.md` — ✓ clean (all five forms + no-sweep
      caveat verified against style.js)
- [x] `guide/jsx/use:connected.md` — ✓ clean (onMount bucket, before
      ready, array values, ref-signal compatibility)
- [x] `guide/jsx/use:css.md` — ✓ fixed: sheet is cached+kept (no
      unmount removal in setCSS), not adopted-while-mounted;
      child-CSSStyleSheet removal claim verified correct (renderer
      registers cleanup)
- [x] `guide/jsx/use:disconnected.md` — ✓ clean (cleanup-registered,
      fires before nodes detach, both examples verified)
- [x] `guide/jsx/use:ref.md` — ✓ fixed: before-children-exist claim —
      static children are cloned in before the ref runs (verified via
      preset output); only dynamic children fill in after
- [x] `guide/typescript.md` — ✓ clean (utility-type table matches
      typescript/jsx/components.d.ts; runtime.d.ts references it so
      jsxImportSource makes them ambient)
- [x] `guide/usage.md` — ✓ fixed: subpath list claimed full but
      omitted jsx-dev-runtime and components/Linkify — both added,
      claim softened

### components — source: `src/components/* (one source file per page)` (21)

- [x] `components/A.md` — ✓ fixed: absolute-href definition (hash
      hrefs resolve relative — that IS hash routing; protocol =
      scheme://, not just http); resolve/replaceParams verified
- [x] `components/Collapse.md` — ✓ fixed: documented the
      display:contents wrapper div (real DOM shape); rest verified
- [x] `components/CustomElement.md` — ✓ clean (shadow+adopt order,
      html setter string/Component/falsy→slot, emit — all match
      source)
- [x] `components/Dynamic.md` — ✓ clean (read-once component prop,
      rest forwarded, component stripped)
- [x] `components/Errored.md` — ✓ clean (all five examples verified
      against Errored contract: sync/reactive/derived/promise catches,
      reset semantics, fallback shapes)
- [x] `components/For.md` — ✓ clean (map delegation, restoreFocus
      queue/onFixes save-restore, reactiveIndex overloads)
- [x] `components/Head.md` — ✓ clean (dedup table matches insertNode
      head branch exactly: title/meta name|property/link canonical)
- [x] `components/Linkify.md` — ✓ clean (props, markers, media
      handling, object-URL revoke, reactive-wrapper idiom — match
      linkify sources)
- [x] `components/Match.md` — ✓ clean (identity component;
      default-branch semantics match Switch's no-when lookup)
- [x] `components/Navigate.md` — ✓ fixed: scroll defaults to true
      (optional() treats undefined as true) — table said nothing,
      implying opt-in
- [x] `components/Normalize.md` — ✓ clean (single fn child → one
      effect, join, empty→null)
- [x] `components/Portal.md` — ✓ fixed: added missing children row to
      Attributes; insert-based ownership verified
- [x] `components/Range.md` — ✓ fixed: stop is INCLUSIVE (unlike
      Python's range the lede invoked) + overshoot note; step input
      clamped (0 froze the page via infinite generator)
- [x] `components/Route.md` — ✓ fixed: fallback renders on path
      mismatch too (when: show() && optional(when)) — table said
      unused without when; scroll order corrected (hash → selectors →
      top)
- [x] `components/Show.md` — ✓ fixed: fallback-wrapped-in-lazy-memo
      claim was mechanically wrong — reworded to
      instantiate-while-shown; resolve reuse example verified (unwrap
      calls the component once)
- [x] `components/Splitter.md` — ✓ clean (defaults, persist
      read-at-create/write-on-dragend, orientation/aria,
      imperative-children example valid)
- [x] `components/Suspense.md` — ✓ clean (context isEmpty fast-path,
      nested boundaries independent, plain-promise children tracked)
- [x] `components/Switch.md` — ✓ clean (first-truthy match, implicit
      no-when default only without fallback prop, matched-value
      accessor)
- [x] `components/Tabs.md` — ✓ fixed: hidden hides the tab button only
      (panel unselectable, not hidden) — initial selected pointing at
      a hidden tab would still show its panel
- [x] `components/customElement.md` — ✓ clean (define-once
      idempotence)
- [x] `components/load.md` — ✓ clean (9 retries @5s, owned across
      async boundary, readyAsync scroll, marked-component return)

### store — source: `src/lib/store.js + src/lib/store/*` (10)

- [x] `store/copy.md` — ✓ fixed — getter-snapshot claim corrected
      (only OWN accessors snapshot; class/prototype getters stay
      live), added own-getter snapshot example, reconcilers list now
      includes reset
- [x] `store/merge.md` — ✓ fixed — boolean JSX child renders as
      nothing; wrapped comparison in String()
- [x] `store/mutable.md` — ✓ fixed — overstated identity claim (===
      fails, includes/indexOf normalize their arg), signalify is not
      own-keys-only (gathers inherited accessors), String() around
      boolean children
- [x] `store/project.md` — ✓ fixed — example relied on
      projection-write reactivity that does not exist for mutable
      sources (verified by scratch test); reworked example, documented
      eager array seeding
- [x] `store/readonly.md` — ✓ fixed — garbled strict-mode sentence,
      freeze scope precision (enumerable-property graph; Map/Set
      entries not covered). Allowlisted rejected-write example left
      untouched
- [x] `store/replace.md` — ✓ fixed — String() around boolean child;
      Returns now carries the T & U approximation caveat from the
      source JSDoc
- [x] `store/reset.md` — ✓ fixed — documented the
      empty-object-resets-wholesale rule (the defaults example relies
      on it via timeline: {})
- [x] `store/signalify.md` — ✓ fixed — own-properties claim corrected
      (prototype-chain accessors ARE gathered; that is what makes
      class getters work); added no-proxy caveat: unsignalified keys
      assigned later are not tracked
- [x] `store/store.md` — ✓ verified vs store.js — accurate; removed a
      confusing hand-duplicated initial signal value in the
      batched-writes example (the effect first run writes it)
- [x] `store/updateBlacklist.md` — ✓ verified vs blacklist.js —
      constructor/prototype/symbol blacklist mechanics and the
      tracked-constructors carve-out all accurate; allowlisted example
      fence untouched

### xml — source: `src/core/xml.js` (2)

- [x] `xml/XML.md` — ✓ verified vs src/core/xml.js — registry
      isolation, define-before-compile constraint, members table and
      examples all accurate
- [x] `xml/xml.md` — ✓ fixed — context example output corrected to
      12321 (verified in browser; whitespace-only text drops per JSX
      rules), added define-before-first-compile note + uppercase-miss
      warning, multi-root templates return an array, dropped wrong
      just-like-JSX parenthetical on the children attribute note

### use/animate — source: `src/use/animate.js` (6)

- [x] `use/animate.md` — ✓ fixed — example could hang: .idle
      transition shows up in getAnimations() but transitions fire
      transitionend, not animationend; example now uses canonical
      swaps (no reactive class= fighting the API) and demonstrates the
      immediate-resolve path
- [x] `use/animate/animateClassTo.md` — ✓ fixed — same hang removed;
      how-it-works no longer claims transitions are safe (added
      explicit transition caution); slide-back keyframes gained the
      missing from so the return leg actually animates
- [x] `use/animate/animatePartTo.md` — ✓ fixed — example styled a
      light-DOM div with ::part() (matches nothing; no shadow root
      existed); now builds a real shadow tree via use:ref; added the
      transition caveat
- [x] `use/animate/documentKeyframes.md` — ✓ fixed — dropped no-op
      resolve/memo indirection around the non-reactive DOM read;
      deferred child function explained
- [x] `use/animate/stopAnimations.md` — ✓ fixed — example prose
      attributed the re-fire failure to the missing cancel; actually
      the remove+reflow+add dance restarts keyframes, the cancel
      covers WAAPI/transitions
- [x] `use/animate/useAnimationFrame.md` — ✓ verified vs
      src/use/animate.js — controller shape, no autostart, dispose
      auto-stop, schedule-before-invoke cancel semantics all accurate

### use/bind — source: `src/use/bind.js` (1)

- [x] `use/bind.md` — ✓ verified vs src/use/bind.js; fixed boolean
      mirror + flat-array claim; added non-HTMLElement note

### use/browser — source: `src/use/browser.js` (4)

- [x] `use/browser.md` — ✓ verified vs src/use/browser.js — exports
      complete, module-load semantics accurate
- [x] `use/browser/isFirefox.md` — ✓ regex match accurate
- [x] `use/browser/isMac.md` — ✓ added iOS like-Mac-OS-X caveat with
      isMobile pairing
- [x] `use/browser/isMobile.md` — ✓ all six regex alternates listed
      accurately

### use/cached — source: `src/use/cached.js` (1)

- [x] `use/cached.md` — ✓ verified vs src/use/cached.js — layers,
      defaults, dedup/retry semantics, all 3 examples accurate

### use/clickoutside — source: `src/use/clickoutside.js` (2)

- [x] `use/clickoutside.md` — ✓ verified vs src — fixed once semantics
      (native, fires on any pointerdown) and portal note (portaled
      content counts as outside)
- [x] `use/clickoutside/escape.md` — ✓ verified — keydown on document,
      key check, node passed to handler all accurate

### use/clipboard — source: `src/use/clipboard.js` (3)

- [x] `use/clipboard.md` — ✓ verified vs src — value shapes accurate;
      noted innerText is trimmed
- [x] `use/clipboard/pasteFiles.md` — ✓ verified — files-only firing +
      preventDefault accurate; prose drop zone → focused target
- [x] `use/clipboard/pasteText.md` — ✓ verified — interception, both
      insertion branches, handler-skips-insertion accurate (example
      fence is the known typecheck allowlist entry)

### use/color — source: `src/use/color.js` (12)

- [x] `use/color.md` — ✓ exports list complete (6 own + 5 re-exports),
      descriptions accurate
- [x] `use/color/alpha.md` — ✓ sets alpha [0,1], #RRGGBBAA return
      verified (format = formatHEXA)
- [x] `use/color/blend.md` — ✓ opaque result, gamma semantics, 4-arg
      example all match color-bits
- [x] `use/color/darken.md` — ✓ channels x (1-value), return format
      verified
- [x] `use/color/eyeDropper.md` — ✓ unsupported→console.error, cancel
      swallowed, sRGBHex cb all accurate
- [x] `use/color/getLuminance.md` — ✓ added [0,1] range + 3-decimal
      rounding to Returns
- [x] `use/color/lighten.md` — ✓ toward-white interpolation, return
      format verified
- [x] `use/color/scale.md` — ✓ OkLab interpolation, count default 10,
      even parameter spacing accurate
- [x] `use/color/textColor.md` — ✓ APCA white-vs-black text comparison
      direction verified
- [x] `use/color/textColorWhenBackgroundIsBlack.md` — ✓ lighten 0.05
      steps, Lc 60 target, 20-step cap, formatHEXA return
- [x] `use/color/textColorWhenBackgroundIsWhite.md` — ✓ darken mirror
      verified
- [x] `use/color/validateColor.md` — ✓ try/parse/return-original
      semantics exact

### use/css — source: `src/use/css.js` (9)

- [x] `use/css.md` — ✓ all 9 exports listed accurately; use:css prop
      dependency confirmed (props/css.js imports
      sheet+addAdoptedStyleSheet)
- [x] `use/css/CSSStyleSheet.md` — ✓ window.CSSStyleSheet re-export,
      fresh-vs-cached guidance accurate
- [x] `use/css/addAdoptedStyleSheet.md` — ✓ idempotent includes-check
      push verified
- [x] `use/css/addStyleSheetExternal.md` — ✓ http-prefix fetch vs
      sheet() parse, per-text cache, async adoption verified
- [x] `use/css/addStyleSheets.md` — ✓ mixed routing, falsy skip,
      default [] verified
- [x] `use/css/adoptedStyleSheets.md` — ✓ pre-bound live array,
      mutation claims accurate
- [x] `use/css/getAdoptedStyleSheets.md` — ✓ nullish-safe optional
      chaining accurate
- [x] `use/css/removeAdoptedStyleSheet.md` — ✓ removeFromArray
      in-place semantics verified
- [x] `use/css/sheet.md` — ✓ cache-by-string verified (withCache Map);
      fixed stale @import claim

### use/dom — source: `src/use/dom.js` (29)

- [x] `use/dom.md` — ✓ all 28 exports listed, descriptions accurate
- [x] `use/dom/DocumentFragment.md` — ✓
- [x] `use/dom/activeElement.md` — ✓ function-not-value accurate
- [x] `use/dom/addClass.md` — ✓ tokenList split + empty no-op verified
- [x] `use/dom/addPart.md` — ✓
- [x] `use/dom/cleanJSXText.md` — ✓ mirrors source JSDoc; xml usage
      verified earlier
- [x] `use/dom/createComment.md` — ✓ placeholder-anchor claim accurate
- [x] `use/dom/createElement.md` — ✓ fixed export-is-undefined wording
- [x] `use/dom/createElementNS.md` — ✓ fixed export-is-undefined
      wording
- [x] `use/dom/createTextNode.md` — ✓ fixed export-is-undefined
      wording
- [x] `use/dom/createTreeWalker.md` — ✓ fixed export-is-undefined
      wording; shared-walker note verified
- [x] `use/dom/document.md` — ✓
- [x] `use/dom/documentElement.md` — ✓
- [x] `use/dom/getDocumentForElement.md` — ✓ disconnected + shadow
      paths verified
- [x] `use/dom/getValueElement.md` — ✓ unwrap-then-Node-check accurate
- [x] `use/dom/hasAttribute.md` — ✓
- [x] `use/dom/head.md` — ✓
- [x] `use/dom/importNode.md` — ✓
- [x] `use/dom/isConnected.md` — ✓
- [x] `use/dom/isPlaying.md` — ✓ readyState>=3 heuristic matches
- [x] `use/dom/querySelector.md` — ✓ use/test $ links exist
- [x] `use/dom/querySelectorAll.md` — ✓
- [x] `use/dom/removeAttribute.md` — ✓
- [x] `use/dom/removeClass.md` — ✓
- [x] `use/dom/removePart.md` — ✓
- [x] `use/dom/setAttribute.md` — ✓
- [x] `use/dom/toDiff.md` — ✓ removal-only contract matches core rule
- [x] `use/dom/tokenList.md` — ✓ shared empty array noted
- [x] `use/dom/walkElements.md` — ✓ renderer.js:356 usage confirmed;
      includes-self-if-element accurate

### use/drag — source: `src/use/drag.js` (1)

- [x] `use/drag.md` — ✓ verified vs src/use/drag.js — DragInfo fields,
      document listeners, per-gesture rect snapshot, pointerId guard
      all accurate; both examples idiomatic

### use/emitter — source: `src/use/emitter.js` (1)

- [x] `use/emitter.md` — ✓ verified vs src/use/emitter.js — refcount
      lifecycle, initialValue seeding, teardown-at-zero,
      initial-undefined quirk all accurate

### use/event — source: `src/use/event.js` (10)

- [x] `use/event.md` — ✓ all 9 exports listed, links verified to exist
- [x] `use/event/addEventNative.md` — ✓ object-doubles-as-options
      verified
- [x] `use/event/emit.md` — ✓ bubbles/cancelable/composed default-true
      fill verified
- [x] `use/event/passiveEvent.md` — ✓ handleEvent+passive shape exact
- [x] `use/event/preventDefault.md` — ✓
- [x] `use/event/removeEventNative.md` — ✓
- [x] `use/event/stopEvent.md` — ✓ trio composition accurate
- [x] `use/event/stopImmediatePropagation.md` — ✓ array-of-handlers
      claim verified (setEvent flatForEach, ordered listeners)
- [x] `use/event/stopPropagation.md` — ✓
- [x] `use/event/waitEvent.md` — ✓ fixed dedup claim — keyed per
      element, not per element+event

### use/favicon — source: `src/use/favicon.js` (3)

- [x] `use/favicon.md` — ✓ snapshot-base redraw, 16x16, no-op
      conditions, defaults all verified
- [x] `use/favicon/setFaviconBadge.md` — ✓ falsy-clears, promise
      return, defaults accurate
- [x] `use/favicon/useFaviconBadge.md` — ✓ withValue reactive driver +
      no-clear-on-dispose accurate

### use/focus — source: `src/use/focus.js` (8)

- [x] `use/focus.md` — ✓ all 7 exports listed accurately
- [x] `use/focus/autoFocus.md` — ✓ onMount focus, bare ref usage
      accurate
- [x] `use/focus/focusNext.md` — ✓ skip-disabled wrap semantics +
      candidate selector enumerated correctly
- [x] `use/focus/focusPrevious.md` — ✓ added in-place reverse caveat
      for explicit lists
- [x] `use/focus/onDocumentFocus.md` — ✓ immediate-fire + scope
      cleanup accurate
- [x] `use/focus/selectOnFocus.md` — ✓ focus→select, array composition
      accurate
- [x] `use/focus/trapFocus.md` — ✓ boundary-wrap keydown behavior +
      self-contained claim verified
- [x] `use/focus/useDocumentFocus.md` — ✓ accessor + !document.hidden
      initial value verified

### use/form — source: `src/use/form.js` (10)

- [x] `use/form.md` — ✓ all 9 exports listed accurately
- [x] `use/form/clickFocusChildrenInput.md` — ✓ fixed misleading label
      example (native label already focuses) and hidden-input claim
      (selector skips type=hidden)
- [x] `use/form/enterFocusNext.md` — ✓
- [x] `use/form/focusNextInput.md` — ✓ no-wrap, conditional
      preventDefault semantics exact
- [x] `use/form/form2object.md` — ✓ FormData merge-to-array,
      mutate-and-return, submitter all verified
- [x] `use/form/isDisabled.md` — ✓ matches(:disabled) incl fieldset
      verified
- [x] `use/form/isEditable.md` — ✓ tag set + isContentEditable +
      null-safe verified
- [x] `use/form/object2form.md` — ✓ checkbox/radio/select branches
      accurate as documented
- [x] `use/form/preventEnter.md` — ✓ Enter+NumpadEnter codes verified
- [x] `use/form/sizeToInput.md` — ✓ input/focus grow-to-parent, blur
      ungrow, overflow hidden all verified

### use/fullscreen — source: `src/use/fullscreen.js` (7)

- [x] `use/fullscreen.md` — ✓ all 7 exports listed; ref-factory
      table + both examples verified
- [x] `use/fullscreen/exitFullscreen.md` — ✓
- [x] `use/fullscreen/isFullscreen.md` — ✓ element-or-null
      non-reactive read accurate
- [x] `use/fullscreen/onFullscreen.md` — ✓ added
      immediate-initial-call to lede (Emitter.on effect fires on
      subscribe)
- [x] `use/fullscreen/requestFullscreen.md` — ✓ promise passthrough
      accurate
- [x] `use/fullscreen/toggleFullscreen.md` — ✓ fixed Returns — async
      API means the return is the pre-toggle isFullscreen(), not the
      post-toggle element
- [x] `use/fullscreen/useFullscreen.md` — ✓ scope requirement + leak
      warning consistent with Emitter

### use/gamepad — source: `src/use/gamepad.js` (6)

- [x] `use/gamepad.md` — ✓ poll-loop architecture, lazy signal
      allocation, all 5 exports accurate
- [x] `use/gamepad/gamepadSnapshot.md` — ✓ no-poll claim +
      useAnimationFrame pairing verified
- [x] `use/gamepad/useGamepadAxis.md` — ✓ raw [-1,1] + deadzone
      guidance matches JSDoc
- [x] `use/gamepad/useGamepadButton.md` — ✓ added the missing
      .held/.idle CSS so the lights-up claim is visible
- [x] `use/gamepad/useGamepadConnected.md` — ✓ poll-derived connect
      state accurate
- [x] `use/gamepad/useGamepadTrigger.md` — ✓ 0..1 value semantics +
      digital-tracks-boolean accurate

### use/intersection — source: `src/use/intersection.js` (5)

- [x] `use/intersection.md` — ✓ shared-observer + cleanup claims
      verified
- [x] `use/intersection/lazyImage.md` — ✓ one-shot own-observer
      semantics verified; Returns line normalized
- [x] `use/intersection/onVisible.md` — ✓ FIXED two broken examples
      (same empty-ref bug) — now subscribe inside use:ref; removed
      false auto-unsubscribe claim (once only guards invocation)
- [x] `use/intersection/useVisible.md` — ✓ FIXED broken example —
      called useVisible(node()) with an empty ref (undefined node
      throws); now observes a node created up front; lede clarified
      the real-node-at-call-time requirement
- [x] `use/intersection/visible.md` — ✓ removed auto-unsubscribe
      claim; Returns line now ref function

### use/keyboard — source: `src/use/keyboard.js` (6)

- [x] `use/keyboard.md` — ✓ chord syntax, strict matching, mod alias,
      all 5 exports accurate
- [x] `use/keyboard/globalShortcut.md` — ✓ document listener + no-node
      handler accurate; Returns reworded (node ignored)
- [x] `use/keyboard/keysHeld.md` — ✓ live-set semantics + rAF pairing
      accurate
- [x] `use/keyboard/shortcut.md` — ✓ fixed dead value= on textarea (no
      value attribute; now prop:value) + Returns wording
- [x] `use/keyboard/submitOnCtrlEnter.md` — ✓ same value=→prop:value
      fix (draft.write('') now visibly clears) + Returns wording
- [x] `use/keyboard/useKeyHeld.md` — ✓ editable guard/keyup/repeat
      claims verified; example 1 cleaned (unused imports, phantom
      effect mention, missing .shifted CSS)

### use/location — source: `src/use/location.js` (5)

- [x] `use/location.md` — ✓ accessor table, static protocol/origin,
      params-getter discipline, searchParams wrapper all verified vs
      source
- [x] `use/location/addListeners.md` — ✓ once-only delegated click +
      hashchange/popstate accurate
- [x] `use/location/navigate.md` — ✓ fixed absolute-href definition
      (isAbsolute = leading slash or protocol; # is relative) and
      Navigate prop name (path, not href); scroll default-true via
      optional() verified
- [x] `use/location/navigateSync.md` — ✓ pushState/replaceState +
      signal write, no pipeline/transitions accurate
- [x] `use/location/useBeforeLeave.md` — ✓ corrected contract — any
      falsy return (incl undefined) cancels, not just false;
      prefix-based auto-clear verified

### use/mouse — source: `src/use/mouse.js` (5)

- [x] `use/mouse.md` — ✓ pointer-events backing, shared listeners,
      button map verified; rAF example now uses useAnimationFrame
      (auto-stop on dispose) instead of a raw never-cancelled loop
- [x] `use/mouse/mouseButtons.md` — ✓ live-set capture-once pattern
      accurate
- [x] `use/mouse/mousePosition.md` — ✓ added tracked-scope caveat — it
      reads a signal, so effects/memos would subscribe
- [x] `use/mouse/useMouseButton.md` — ✓ per-button reader + examples
      verified
- [x] `use/mouse/useMousePosition.md` — ✓ client-coords reader
      accurate

### use/mutation — source: `src/use/mutation.js` (4)

- [x] `use/mutation.md` — ✓ default init, first-subscriber-wins,
      last-unsubscribe disconnect all verified
- [x] `use/mutation/mutated.md` — ✓ both examples verified (childList
      via reactive list, attribute-only init)
- [x] `use/mutation/onMutations.md` — ✓ placeholder filtering +
      document.body example accurate
- [x] `use/mutation/useMutations.md` — ✓ fixed example crash —
      accessor is undefined until first batch, records().length threw
      on first effect run; Returns line documents the undefined start

### use/orientation — source: `src/use/orientation.js` (3)

- [x] `use/orientation.md` — ✓ derived-from-documentSize + Emitter
      pair accurate
- [x] `use/orientation/onOrientation.md` — ✓ immediate fire +
      flip-only dedup (signal equality) + guarded canvas example
      verified
- [x] `use/orientation/useOrientation.md` — ✓ width>=height
      classification incl square case verified

### use/overlay — source: `src/use/overlay.js` (1)

- [x] `use/overlay.md` — ✓ verified vs src/use/overlay.js — args
      table, 12 positions, naive clamp, manageFocus accurate; examples
      fixed (effect-return is not a cleanup; root attaches to Owner so
      body call suffices)

### use/paginate — source: `src/use/paginate.js` (2)

- [x] `use/paginate.md` — ✓ verified vs src/use/paginate.js + solid.js
      withValue — args, shape, clobber semantics (withValue syncEffect
      re-runs source accessor), Promise-pending = nothing sentinel;
      examples reworked
- [x] `use/paginate/paginateValues.md` — ✓ verified vs
      src/use/paginate.js — toArray(getValue(items).values()),
      numItems from length, delegates to paginate; example sound (sync
      fetch so For each={items} never sees the pending sentinel); no
      edits

### use/popover — source: `src/use/popover.js` (1)

- [x] `use/popover.md` — ✓ verified vs src/use/popover.js — controller
      methods, defaults (top/arrows true), open() no-op after dispose,
      manageFocus dialog semantics; both live examples sound;
      Controller API fence is static (only Examples fences are live
      per content-parser.js); no edits

### use/random — source: `src/use/random.js` (6)

- [x] `use/random.md` — ✓ verified vs src/use/random.js — uint32/2^32
      = [0,1), exports list accurate; fixed generator-param overclaim
      (only chance/randomBetween take one)
- [x] `use/random/chance.md` — ✓ verified — chance/100 compare,
      defaults 50/random; no edits
- [x] `use/random/randomBetween.md` — ✓ verified —
      floor(g()\*(max-min+1))+min, inclusive endpoints, defaults
      0/100/random; no edits
- [x] `use/random/randomColor.md` — ✓ verified — three
      randomBetween(min,max) channels, defaults 0/255, rgb(r,g,b)
      format; no edits
- [x] `use/random/randomId.md` — ✓ verified — BigUint64 base36, 12-13
      chars typical; no edits
- [x] `use/random/randomSeeded.md` — ✓ verified — multiplicative LCG
      m=2^35-31, mult 185852, floats in [0,1), same seed same
      sequence; no edits

### use/recorder — source: `src/use/recorder.js` (1)

- [x] `use/recorder.md` — ✓ verified vs src/use/recorder.js —
      options/controller tables, codec priority lists,
      paused-amplitude note, permission aggregation, all 4 live
      examples sound (try/catch start, object-URL audio, reactive
      style meter, pause/resume, maxDuration); no edits

### use/resize — source: `src/use/resize.js` (7)

- [x] `use/resize.md` — ✓ verified vs src/use/resize.js — Emitter
      pairs, shared RO per node, example sound; terminology fixed
      (ensureInBounds is a bare ref, resize returns a ref function)
- [x] `use/resize/documentSize.md` — ✓ verified — clientWidth/Height
      snapshot, non-tracking; no edits
- [x] `use/resize/ensureInBounds.md` — ✓ verified — onMount rect
      snapshot, syncEffect clamp vs useDocumentSize, null reset;
      example anchor fixed
- [x] `use/resize/onDocumentSize.md` — ✓ verified vs Emitter — seeded
      via getValue(initialValue)=documentSize(), on() fires
      immediately, shared resize listener; no edits
- [x] `use/resize/onElementSize.md` — ✓ verified — placeholder
      filtered, shared observer, ref-pattern example sound; no edits
- [x] `use/resize/useDocumentSize.md` — ✓ verified — shared Emitter
      accessor, seeded with current size; no edits
- [x] `use/resize/useElementSize.md` — ✓ verified — entry accessor,
      undefined placeholder; example 1 was broken and rewritten

### use/scroll — source: `src/use/scroll.js` (7)

- [x] `use/scroll.md` — ✓ verified vs src/use/scroll.js — exports list
      accurate after id-first wording fix; index-only page (no
      Examples) fine
- [x] `use/scroll/scrollIntoView.md` — ✓ verified — onMount
      scrollIntoView(opts); fixed bogus two-argument-form claim
      (legacy boolean = alignToTop) and Returns terminology
- [x] `use/scroll/scrollToElement.md` — ✓ verified — scrollTop=0 +
      scrollIntoView(true); example sound; no edits
- [x] `use/scroll/scrollToLocationHash.md` — ✓ verified — wrapper over
      scrollToSelector(location.hash), boolean passthrough return; no
      edits
- [x] `use/scroll/scrollToSelector.md` — ✓ verified — added the
      getElementById-first hash resolution (URI-decoded fragment) the
      page omitted; invalid/empty swallowed claim confirmed
- [x] `use/scroll/scrollToSelectorWithFallback.md` — ✓ verified —
      falls back to scrollToTop on miss, returns nothing; no edits
- [x] `use/scroll/scrollToTop.md` — ✓ verified — window.scrollTo top 0
      auto; no edits

### use/selection — source: `src/use/selection.js` (4)

- [x] `use/selection.md` — ✓ verified vs src/use/selection.js — three
      exports, bind.js round-trip claim confirmed (imports
      getSelection/restoreSelection); no edits
- [x] `use/selection/clickSelectsAll.md` — ✓ verified — bare ref,
      selectAllChildren on click, used-directly wording correct; no
      edits
- [x] `use/selection/getSelection.md` — ✓ verified — rangeCount guard,
      getRangeAt(0), null on empty; example sound (button click
      preserves document selection); no edits
- [x] `use/selection/restoreSelection.md` — ✓ verified —
      removeAllRanges+addRange, nullish no-op; append-based demo
      non-destructive so the saved Range stays valid; no edits

### use/selector — source: `src/use/selector.js` (3)

- [x] `use/selector.md` — ✓ verified vs src/use/selector.js —
      single-syncEffect claim, exports; no edits
- [x] `use/selector/usePrevious.md` — ✓ verified — closure previous,
      second-arg contract, undefined first call; no edits
- [x] `use/selector/useSelector.md` — ✓ verified — values()
      duck-typing (Set/Map/Array), undefined=[], refcounted per-item
      signals, prev-includes initial; examples fixed

### use/storage — source: `src/use/storage.js` (1)

- [x] `use/storage.md` — ✓ verified vs src/use/storage.js — probe
      fallback chain, syncEffect persist timing, subs fan-out,
      cross-tab storage event incl. clear()=key null revert; 3
      examples sound; no edits

### use/stream — source: `src/use/stream.js` (8)

- [x] `use/stream.md` — ✓ verified vs src/use/stream.js —
      copy=remove+clone, remove=detach not stop, stopStream
      polymorphic; no edits
- [x] `use/stream/copyAudioTracks.md` — ✓ verified — remove-first
      no-accumulation claim exact; no edits
- [x] `use/stream/copyVideoTracks.md` — ✓ verified — mirror of audio
      page; no edits
- [x] `use/stream/removeAudioTracks.md` — ✓ verified —
      detached-not-stopped; no edits
- [x] `use/stream/removeVideoTracks.md` — ✓ verified — mirror; no
      edits
- [x] `use/stream/stopStream.md` — ✓ verified — instanceof branches,
      anything-else ignored; example rewritten
- [x] `use/stream/stopTrack.md` — ✓ verified — track.stop()
      passthrough; no edits
- [x] `use/stream/stopTracks.md` — ✓ verified — stops all tracks; no
      edits

### use/string — source: `src/use/string.js` (13)

- [x] `use/string.md` — ✓ verified vs src/use/string.js — all 12
      exports listed, diff-used-by-test claim confirmed (test.js
      imports it); no edits
- [x] `use/string/capitalizeFirstLetter.md` — ✓ verified; no edits
- [x] `use/string/copyToClipboard.md` — ✓ verified —
      resolvedIgnoreError = then/catch(noop), always-resolves claim
      exact; no edits
- [x] `use/string/dashesToCamelCase.md` — ✓ verified — regex
      -([a-z0-9]) and other-dashes-stay nuance already documented; no
      edits
- [x] `use/string/diff.md` — ✓ verified — both-multiline gate,
      first-divergence ->, toString per line, passthrough; no edits
- [x] `use/string/ensureString.md` — ✓ verified — String(s || '')
      falsy quirk incl. 0/false/NaN documented; no edits
- [x] `use/string/hash.md` — ✓ verified — subtle.digest hex lowercase,
      algo param, 64/40-char comments exact; no edits
- [x] `use/string/isEmoji.md` — ✓ verified — contains-anywhere
      semantics, per-call regex literal so /g lastIndex is safe; no
      edits
- [x] `use/string/label.md` — ✓ verified — dashes/underscores to
      spaces + collapse; fixed wrong inverse-direction claim about
      dashesToCamelCase
- [x] `use/string/short.md` — ✓ verified — >40 cut + ellipsis, default
      ''; no edits
- [x] `use/string/toString.md` — ✓ verified — trim, slice, re-trim
      traced in the example comment; no edits
- [x] `use/string/validateEmail.md` — ✓ verified — toString+lowercase,
      len>=6, single-@ regex, normalized-or-false; no edits
- [x] `use/string/wholeNumber.md` — ✓ verified — added the 32-bit |0
      caveat (beyond ±2^31 wraps, Infinity becomes 0)

### use/test — source: `src/use/test.js` (12)

- [x] `use/test.md` — ✓ verified vs src/use/test.js — exports list,
      stop semantics, reset=numbering only, untrack on
      toEqual/toInclude/toThrow exactly; 3 examples sound; no edits
- [x] `use/test/$$.md` — ✓ verified — spread to real Array; no edits
- [x] `use/test/$.md` — ✓ verified — querySelector, selector tag type
      inference, override param, node default document; no edits
- [x] `use/test/body.md` — ✓ verified; no edits
- [x] `use/test/childNodes.md` — ✓ verified — childNodes.length, body
      default; no edits
- [x] `use/test/head.md` — ✓ verified; no edits
- [x] `use/test/isProxy.md` — ✓ verified — Proxy-constructor wrap,
      after-load caveat already documented; no edits
- [x] `use/test/macrotask.md` — ✓ verified; no edits
- [x] `use/test/microtask.md` — ✓ verified; no edits
- [x] `use/test/rerenders.md` — ✓ verified — animation mechanism made
      precise (per-element on (re)creation, sheet adopted on document)
      and Returns corrected to nothing (addAdoptedStyleSheet returns
      undefined)
- [x] `use/test/sleep.md` — ✓ verified; no edits
- [x] `use/test/sleepLong.md` — ✓ verified — sleep(300),
      tunable-constant rationale mirrors src; no edits

### use/time — source: `src/use/time.js` (11)

- [x] `use/time.md` — ✓ index — Exports list matches src/use/time.js
      exports; time() documented inline (HH:MM via timeWithSeconds
      slice); example correct static snapshot
- [x] `use/time/date.md` — ✓ YYYY-MM-DD zero-padded, default now() —
      matches source
- [x] `use/time/datetime.md` — ✓ date + ' ' + time composition —
      matches source
- [x] `use/time/day.md` — ✓ toLocaleDateString long weekday/month +
      numeric year/day, lang default 'en' — matches source
- [x] `use/time/measure.md` — ✓ console.time/timeEnd + optional
      timeReport(ms), returns cb's value — matches source
- [x] `use/time/now.md` — ✓ fixed formatter enumeration
- [x] `use/time/timeWithSeconds.md` — ✓ HH:MM:SS zero-padded — matches
      source
- [x] `use/time/timing.md` — ✓ performance.now() delta in ms — matches
      source
- [x] `use/time/useElapsed.md` — ✓ Unix SECONDS input (value or
      accessor), unit-boundary ticking per TICK_BOUNDARIES, syncEffect
      reflects timestamp changes immediately, falsy→0+stop,
      auto-cleans — all match source; example correct
- [x] `use/time/useStopwatch.md` — ✓ elapsed ms reader, interval
      default 1000, autoStart, stop preserves accumulated, chainable
      controls, useAnimationFrame link target exists — matches source
- [x] `use/time/useTimeout.md` — ✓ NOT auto-started, reactive delay
      restarts pending timeout via withValue, Infinity never fires,
      cleanup auto, start/stop chainable — all match source; 3
      examples sound

### use/tooltip — source: `src/use/tooltip.js` (1)

- [x] `use/tooltip.md` — ✓ singleton overlay + Emitter refcount,
      pointerenter/leave + focus/blur, position default top, arrows
      default true, reactive content — all match src/use/tooltip.js; 3
      examples sound, clickoutside import path verified

### use/upload — source: `src/use/upload.js` (3)

- [x] `use/upload.md` — ✓ index — pipeline/options/filters verified
      against src/use/upload.js; examples sound
- [x] `use/upload/dropzone.md` — ✓ depth-counter dragover,
      data-dragover attr, same UploadOptions minus clearOnUpload —
      matches source; example sound
- [x] `use/upload/uploadFile.md` — ✓ XHR progress, SHA-1 + HEAD
      existsUrl dedup, field default file, parseResponse default
      trimmed text, hash? only with existsUrl, AbortError — all match
      source

### use/url — source: `src/use/url.js` (13)

- [x] `use/url.md` — ✓ index — all 12 exports of src/use/url.js listed
      with accurate one-liners; replaceParams-in-A claim verified
      (route/link.js)
- [x] `use/url/cleanLink.md` — ✓ single trailing . , or quote stripped
      — matches /[\.,\x22]$/
- [x] `use/url/decodeURIComponent.md` — ✓ try/catch wrapper returning
      original on malformed input — matches source
- [x] `use/url/encodeURIComponent.md` — ✓ platform passthrough —
      matches source
- [x] `use/url/hasProtocol.md` — ✓ nestedProtocolOptional regex incl.
      blob:http:// — examples all check out
- [x] `use/url/isAbsolute.md` — ✓ href[0]==='/' || hasProtocol —
      examples check out
- [x] `use/url/isExternal.md` — ✓ prefix compare with trailing-slash
      guard verified
- [x] `use/url/isFileProtocol.md` — ✓ startsWith file:// — matches
      source
- [x] `use/url/isHash.md` — ✓ url[0]==='#' — matches source
- [x] `use/url/isRelative.md` — ✓ !isAbsolute — matches source
- [x] `use/url/paramsRegExp.md` — ✓ regex quoted verbatim from source
- [x] `use/url/removeNestedProtocol.md` — ✓ replace(nestedProtocol,
      dollar1//) — blob:http:// example traced through the regex
- [x] `use/url/replaceParams.md` — ✓ encodeURIComponent substitution,
      undefined keys left intact, params omitted returns href —
      examples traced

### use/visibility — source: `src/use/visibility.js` (4)

- [x] `use/visibility.md` — ✓ index — 3 exports listed,
      Emitter-pair-mirrors-fullscreen claim verified against
      src/use/fullscreen.js
- [x] `use/visibility/isDocumentVisible.md` — ✓ visibilityState ===
      'visible', fresh read, no subscription — matches source
- [x] `use/visibility/onDocumentVisible.md` — ✓ Emitter.on semantics —
      owner-registered teardown, leak without owner; example sound
- [x] `use/visibility/useDocumentVisible.md` — ✓ reactive accessor,
      refcounted shared listener, first-use attach / last-consumer
      detach, leak outside scope — matches Emitter.use; example sound

---

## Fixes applied

_(append one bullet per substantive fix: `path — what changed`)_

- action.md — corrected reactivity claim: pipeline stages are one-shot
  (track() run-once guard), functions are unwrapped not re-run
- cleanup.md — corrected disposal-ordering: cleanups run while the
  scope DOM is still connected (insert registers its toDiff removal
  first, LIFO runs it last); For rows detach first. Verified with a
  scratch browser test (not kept).
- derived.md — isResolved/loading-flag semantics (false during ANY
  pending run), per-stage re-run phrasing, reset-retry explanation
- externalSignal.md — Arguments table id type now string | number
- isResolved.md — desc/lede/Returns said true once resolved at least
  once (latch); actual: false during ANY pending run (first or
  re-run); also documented that isResolved subscribes when read in a
  tracking scope
- map.md — lede said callback runs for removed entries (it never does
  — rows are disposed); fallback/reactiveIndex example showed neither
  flag in action (no interactions); now demonstrates both
- markComponent.md — example showed <A/> usage where markComponent is
  a no-op (renderer Factory marks any plain function); replaced with
  child-position demo where marked vs unmarked actually differ
- memo.md — layered example claim said percent skips work it actually
  performs; reworded to the real invariant (unchanged memo value does
  not re-run dependents)
- on.md — Arguments table omitted the initial run of fn
- owned.md — replaced inert onCancel example with an interactive
  Show-unmount demo (cancellation was undemonstrable before)
- root.md — tracking-scope terminology corrected to owner scope
  (matches owner/listener distinction); timer example now uses
  cleanup() so dispose() alone tears down
- effect.md (already ticked) — scheduled, not synchronous claim
  corrected: user effects drain at the end of the current update
  batch, synchronously (verified in sync-effect.jsx test); table row +
  example one-liner reworded
- syncEffect.md — desc/lede rewritten around the real semantics:
  immediate run on creation (even mid-update) and internal-phase
  re-runs before regular effects; example one-liner + button label
  clarified
- unwrap.md — flatten depth corrected (deep, not one level)
- insert.md + render.md — parent typed Element | null but source
  accepts DocumentFragment (render.md even demos a ShadowRoot);
  render.md owner-scope terminology
- ready.md — example text listed onRef as a queue phase between
  onProps and onMount; no such bucket exists (setRef is synchronous)
- guide/attributes-properties.md — Children section rewritten to
  actual semantics (native children= → literal attribute; component
  duplicate-key last-wins; Component() prop honored)
- guide/jsx/class:\_\_.md — plain class:x={undefined} removes the
  class; only reactive bindings keep pre-existing classes on falsy
  init (scratch-tested both)
- guide/jsx/use:css.md — attribute-form sheets are cached and never
  removed; reworded lifetime claim
- guide/jsx/use:ref.md — ref timing vs static children corrected
- components/A.md — hash-href resolution + protocol definition
  corrected
- components/Navigate.md — scroll default documented (true)
- components/Show.md — fallback mechanism claim corrected
- components/Range.md — inclusive-stop semantics + step=0 freeze guard
  in example
- components/Route.md — fallback/scroll rows corrected
- components/Tabs.md — hidden-label cell precision
- store/copy.md — lede + example prose wrongly claimed the class
  getter is snapshotted; magnitude lives on Point.prototype so it
  stays live. Clarified own-vs-prototype accessors and added an
  own-getter example demonstrating the real snapshot
- store/merge.md — example rendered a bare boolean child (renderer
  drops booleans); now String(ref === target.q[1])
- store/mutable.md — replaced identity-checks-=== claim with
  includes/indexOf normalization, corrected signalify cross-ref to
  non-recursive/proxy-free, wrapped two bare boolean JSX children in
  String()
- store/project.md — bump-draft-age button was dead UI: with a mutable
  source, project() returns the raw Projection proxy (mutable()
  short-circuits on $isMutable through the get trap) and
  Projection.set is a bare reflectSet, so projection readers never
  re-run. Example now pre-writes the draft and keeps the working
  rename-shows-through button. Added array exception: indices seeded
  eagerly, source array changes do not show through
- store/readonly.md — silent-strict-mode-failures wording was
  backwards (sloppy mode is the silent one); clarified deepFreeze
  recurses enumerable properties and that frozen Map/Set still accept
  .set/.add (internal slots)
- store/replace.md — bare boolean JSX child wrapped in String(); noted
  deleted keys still appear in the returned type
- store/reset.md — lede now states that an empty object in source
  overwrites the key to {} while non-empty objects reconcile key by
  key (reset.js keys(next).length === 0 branch)
- store/signalify.md — replaced only-own-properties wording in
  desc/lede/table/example heading; lede now notes proxy-free +
  inherited accessors; added new-keys-not-auto-tracked contrast with
  mutable
- store/store.md — example log signal now starts empty; comment notes
  the effect runs once per setUser batch
- xml/xml.md — renders-1-2-3-2-1 comment was wrong (cleanJSXText drops
  newline whitespace; scratch-verified body=12321); removed misleading
  trailing spaces in the template; new note 3 documents that
  xml.define must precede the first invocation using the tag (compile
  cache fixes component-vs-element decisions); Returns mentions array
  for multi-root; children-attr note no longer claims JSX parity (in
  JSX an explicit children prop wins on components — opposite
  precedence)
- use/animate\*.md — both class-swap examples dropped transition:
  background .2s (hang: getAnimations reports CSSTransition, waitEvent
  listens for animationend only), switched to static class=idle +
  animateClassTo doing its own swapping, guard via early return
- use/animate/animatePartTo.md — ::part() only matches elements inside
  a shadow root; example now attaches one and animates its inner part
  element; lede carries the transitionend-vs-animationend caveat
- use/animate/documentKeyframes.md + stopAnimations.md — example
  simplification and corrected causal claim in the restart example
  prose
- use/bind.md: checkbox mirror was a bare boolean child (renders
  nothing) — now String(checkbox()); lede said flat array but
  flatForEach flattens nested arrays; noted non-HTMLElements are
  silently ignored (instanceof guard)
- use/browser/isMac.md: noted iOS UAs contain mac (like Mac OS X) so
  isMac is true on iPhone/iPad; suggested pairing with isMobile for
  desktop macOS
- use/clickoutside.md: once was documented as detach-after-first-MATCH
  but addEvent passes the handler object as native addEventListener
  options, so once detaches on the first pointerdown anywhere (an
  inside click disarms it silently); portal note inverted — content
  portaled out of the node IS outside per node.contains
- use/clipboard.md: clipboard(true) copies trimmed innerText (source
  calls .trim()); pasteFiles.md example prose said drop zone for a
  click-and-paste target
- use/color/getLuminance.md: Returns now states the [0,1] range and
  3-decimal rounding (verified in color-bits implementation)
- use/css/sheet.md: replaced accepts-@import claim — modern browsers
  disallow @import in constructed stylesheets (dropped with console
  warning); now describes async replace correctly
- use/dom:
  createElement/createElementNS/createTextNode/createTreeWalker said
  the function returns undefined without document — actually the
  export itself is undefined (bind guard); reworded on all four pages
- use/drag.md: the return value was called a ref factory in two places
  — it is the ref function (draggable is the factory); now consistent
  with clickOutside/escape pages
- use/emitter.md: subscription happens at the use() call (runs #add),
  not on first accessor read — reworded example prose
- use/event/waitEvent.md: dedup is per element (any event name rejects
  the pending one), not per element/event pair as previously stated
- use/focus/focusPrevious.md: documented that a caller-provided list
  is reversed in place (source calls all.reverse())
- use/form/clickFocusChildrenInput.md: example used a label (which
  focuses its input natively, demonstrating nothing) — now a div; lede
  said hidden input but the selector excludes type=hidden — now
  label-like wrapper
- use/fullscreen/toggleFullscreen.md Returns corrected (pre-toggle
  state); onFullscreen.md now notes the immediate initial call
- use/gamepad/useGamepadButton.md: example claimed the box lights up
  via reactive class but defined no CSS — added a minimal style block
- use/intersection: onVisible.md + useVisible.md examples called the
  hook in the component body with an empty ref — node() is undefined
  before mount, throwing in weakStore/io.observe; rewritten to
  subscribe with a real node. Also dropped auto-unsubscribes wording
  (the once guard only stops invoking fn)
- use/keyboard: reactive value= on textarea is a no-op in pota
  (attribute-first, textarea has no value attribute) — shortcut.md and
  submitOnCtrlEnter.md examples now use prop:value; useKeyHeld example
  had unused imports and an invisible class
- use/location: navigate.md table had wrong absolute-href rule and
  Navigate href= (component takes path=); useBeforeLeave.md said only
  false cancels but the source blocks on any falsy return
- use/mouse: module example replaced raw requestAnimationFrame loop
  (leaked past unmount) with useAnimationFrame; mousePosition.md now
  warns the snapshot subscribes when called in tracked scopes
- use/mutation/useMutations.md: example read records().length while
  the accessor still held the pre-observer undefined — now
  records()?.length ?? 0 with prose explaining it
- use/overlay.md: examples wrapped createOverlay in an effect and
  returned dispose as if it were a cleanup — pota effects ignore the
  return value; now called directly in the component body (root
  attaches to the current Owner), prose explains dispose is only for
  early teardown
- use/paginate.md: example 1 fetched /api/rows (404 in playground,
  never rendered items) — now a runnable app with a delayed local
  slice, isResolved(items) loading state, page indicator and
  prev/next; example 2 now shows moving pages via navigate (source is
  the authority; next/previous writes get clobbered) and Shape comment
  tightened to [1, max(1, totalPages)]
- use/random.md: intro claimed every helper accepts a custom generator
  — only chance and randomBetween do (randomColor/randomId have no
  generator param); now names the two and says the rest draw on the
  same crypto source
- use/resize.md: intro called ensureInBounds a use:ref factory and the
  Returns line called resize(handler)'s ref function a factory —
  normalized to ref-function/used-directly terminology
- use/resize/useElementSize.md: example 1 assigned the accessor inside
  use:ref and read it in a sibling reactive child — children render
  synchronously in the render batch while refs fire at onProps
  (microtask), so size() threw on undefined and the effect tracked
  nothing (stuck forever); rewritten to create the node up front
  (textarea rendered as a child), with a warning prose and pointers to
  resize/onElementSize for JSX-only nodes
- use/resize/ensureInBounds.md: example anchored the panel with
  position:fixed right:20px — the helper requires a non-moving
  top-left anchor (rect sampled once), so a right-anchored panel gets
  over-clamped on shrink (e.g. 320px panel squeezed to 40px while it
  still fit); now pinned top/left with prose naming the anchor
  assumption
- use/scroll/scrollIntoView.md: claimed a boolean opts selects a
  two-argument form — scrollIntoView(boolean) is the legacy
  single-argument alignToTop form; also Returns line said use:ref
  factory for the returned ref function
- use/scroll/scrollToSelector.md (+ index bullet): said elements are
  found via querySelector — a leading # is resolved id-first via
  getElementById with the fragment URI-decoded (handles ids that are
  invalid CSS selectors), querySelector is the fallback
- use/selector/useSelector.md: example 1 toggled class:selected with
  no CSS defined — visibly inert in the playground; added the css
  block (matching example 2) and wrapped both examples' rows in a real
  ul (example 2 rendered li directly under main)
- use/stream/stopStream.md: example registered cleanup() at module top
  level where no reactive scope exists — the advertised
  release-on-dispose never fires; now a Show-toggled Camera component
  that acquires on mount, stops on unmount, and stops a late-arriving
  stream when disposed while the permission prompt is pending
- use/string/label.md: dashesToCamelCase described as the inverse
  direction of label — neither inverts the other; now says kebab-case
  to camelCase
- use/string/wholeNumber.md: no mention that |0 is 32-bit — values
  beyond ±2^31 wrap (3e9 goes negative) and Infinity coerces to 0;
  caveat added
- use/test/rerenders.md: said the flash is triggered on document and
  that it returns the addAdoptedStyleSheet result — the animation runs
  per element on (re)creation and the function returns undefined; both
  corrected
- use/time/now.md — 'every formatter: date, datetime, and day' omitted
  time and timeWithSeconds; enumeration now lists all five
- use/upload.md — Returns and Arguments intro called the returned
  (node)=>void a ref factory; corrected to ref function
  (upload(options) is the factory)
- use/upload.md — 'After upload the input is cleared' → cleared as
  soon as the selection is read (node.value='' runs synchronously in
  the change handler, before uploads settle); table row reworded too
- use/upload.md — onUpload table row now notes it is skipped when no
  file succeeded (source: if (ok.length) options.onUpload(ok))
- use/upload/dropzone.md — Returns: ref factory → ref function
- use/upload/uploadFile.md — example 1 claimed the AbortController
  cancels on teardown but never called abort(); now wired to a cancel
  button with matching prose
- use/url/isExternal.md — documented the string-prefix gotcha:
  relative hrefs ('/about') test external since they don't carry the
  origin; added an Examples section showing fully-qualified vs
  relative (src feeds it node.href, always resolved)
- use/visibility/onDocumentVisible.md — documented the immediate
  initial call: Emitter.on(fn) runs fn once with the current value on
  subscription (effect reads the seeded signal), then on each change;
  lede, table, and example prose aligned
- use/paginate.md — example 1 fetchRows rewritten as async fn awaiting
  a delay then returning rows.slice(...) — the previous new
  Promise(resolve => …) inferred Promise<unknown> and failed the
  example typecheck against paginate's (start, end) => unknown[] |
  Promise<unknown[]> contract
- tools/ai-docs-review/typecheck.mjs — ALLOW map extended from 1 to 5
  entries (readonly 2540; load 2307; updateBlacklist 2345; toHTML
  2345; pasteText 2339), each with a why-comment; header comment now
  covers both intentional-in-page and inherent-to-example classes

---

## Flags for maintainer

_(append anything you could not confirm from source, or judgment calls
left for review)_

- RESOLVED (this pass): context.md Functional override example — stale
  flag; the example now writes to an on-page signal and ends in
  render(App).
- (carried from prior pass) src/use/browser.js — isFirefox and isMac
  lack a JSDoc @url tag (isMobile has one); both have doc pages, so
  add @url https://pota.quack.uy/use/browser/isFirefox and
  /use/browser/isMac. src/ change for the maintainer.
- RESOLVED (this pass): documentation/AGENTS.md no longer lists
  <Dynamic component> as a reactive prop — replaced with
  <For each={items.read}> plus a read-once note (verified against
  Dynamic.js).
- src/core/props/class.js + style.js — @url
  https://pota.quack.uy/setClass sits on the internal 2-arg setClass
  and @url /setStyle on the internal 2-arg setStyle, but the public
  exports are setElementClass-as-setClass and
  setElementStyle-as-setStyle (exports.js renames) which carry no
  @url; move the @url tags to the actually-exported functions (src/
  change)
- src/lib/store/projection.js — writes to a projection of a MUTABLE
  source are not observable by readers of the projection itself:
  syncEffect reading view.count does not re-run on view.count = 2
  (scratch test: seen stayed [1]; with a PLAIN source it works, [1,2],
  because the Projection proxy gets wrapped by ProxyHandlerObject).
  Editable-draft UIs driven from a projected mutable store silently
  never update. Maintainer call: make Projection.set notify (e.g.
  track the COW target) or document the limitation on the page
- src/use/animate.js — animateClassTo/animatePartTo wait for
  animationend whenever getAnimations() is non-empty, but
  getAnimations() includes CSSTransition (which fires transitionend)
  and WAAPI animations (which fire no CSS events) — a swap whose only
  effect is a transition never resolves. Consider Promise.race of
  animationend/transitionend, animations.map(a => a.finished), or
  filtering to CSSAnimation
- src/use/cached.js: res.ok is never checked — HTTP error bodies
  (404/500) are stamped and cached for the full TTL, and the stored
  copy becomes status 200 (new Response defaults). Consider skipping
  store.put for !res.ok, or documenting that errors are cached. Doc
  currently makes no claim either way.
- src/use/clickoutside.js: options.once likely intends
  detach-after-first-outside-match but native once detaches on the
  first pointerdown anywhere — a click inside the popover disarms the
  dismissal without firing the handler. Fix would be removing the
  listener inside handleEvent after a match instead of native once.
- src/use/css.js:34 comment says replace can accept @import
  referencing external resources — spec changed (~2020): constructed
  stylesheets drop @import with a console warning; comment is stale
- src/use/event.js waitEvent: pending-state is keyed by element only —
  a second waitEvent with a DIFFERENT eventName rejects the first and
  calls removeEventListener with the new name, so the old
  once-listener stays armed (resolves a settled promise, harmless but
  untidy). Consider keying by element+eventName.
- src/use/form.js object2form (file marked WIP): select branch uses
  value.indexOf(option.value) — substring-matches when value is a
  string, and never sets selected=false so it cannot clear prior
  selections; also querySelectorAll([name=X]) is unquoted, so field
  names with special chars throw
- src/use/fullscreen.js toggleFullscreen: return isFullscreen() runs
  synchronously after the async request/exit, so it returns the
  PRE-toggle state (entering returns null, exiting returns the old
  element). Likely intended the new state — consider returning the
  request promise instead.
- src/use/intersection.js onVisible: JSDoc says opts.once
  auto-unsubscribes after first intersection, but the implementation
  only sets a fired flag — the shared observer and effect stay alive
  until scope disposal. Either dispose the subscription on fire or
  soften the JSDoc.
- src/use/mouse.js: mousePosition()/mouseButtons() run lifecycle.use()
  on EVERY call — the documented per-frame mousePosition() pattern
  registers one cleanup + refcount per frame on the owner until
  unmount (unbounded growth while mounted). Also mousePosition reads
  posSignal tracked — consider untrack(posSignal.read) to make the
  non-reactive claim exact.
- src/use/overlay.js createOverlay: releaseSheet only runs via the
  returned dispose — teardown via parent-owner disposal (root is
  Owner-attached) never releases the shared stylesheet refcount;
  consider cleanup(releaseSheet) inside the root, guarded for
  double-dispose.
- src/use/paginate.js:67 stray JSDoc line in paginate fetch param: a
  heading of exclamation marks (## !!!…?) — debug leftover that ships
  in editor tooltips and generated types; delete it.
- src/use/random.js randomSeeded: seed 0 (or any multiple of
  m=2^35-31) degenerates to a constant-0 generator, and negative seeds
  produce negative outputs (JS % keeps sign). Consider normalizing,
  e.g. s = ((seed % m) + m) % m and rejecting/offsetting 0.
- src/use/recorder.js maxDuration: when the cap fires, setTimeout
  calls stop() whose promise nobody observes — the capped blob is
  built in onstop, resolves that unobserved promise, and is
  unreachable by the consumer (no onStop/callback option). For the
  chat-message use case the capped recording is the one to keep;
  consider an options.onStop(blob) or resolving a consumer-visible
  handle.
- src/use/upload.js — upload() JSDoc says the input is cleared after
  upload, but node.value='' runs synchronously in the change handler
  before uploads settle; consider rewording (docs now say cleared when
  the selection is read)
