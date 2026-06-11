---
name: docs-review
description:
  Review, normalize, and keep accurate the pota documentation content
  under documentation/content (the markdown that becomes the docs
  site). Use
  when asked to review/update/normalize the docs, verify pages against
  source, fix examples, check completeness/links, or rework topics.js.
  Runs as ONE resumable, synchronous, source-verified pass tracked in
  progress.md. Invoke to start a new pass or to continue an
  interrupted one.
---

# Docs review / update pass

A single, consistent standard for every `.md` under
`documentation/content/` (each file documents a pota export or a
guide page). The pass is **resumable** and runs **without subagents**.
Resume anchor lives in `tools/ai-docs-review/progress.md`, next to the
helper scripts (all version-tracked, so they survive fresh checkouts
and `npm run clean`). The scripts resolve the content tree relative to
their own location, so they run from any cwd; point them at another
content tree with `CONTENT_DIR=…` (docs-site project: `DOCS_DIR=…`).

## How to start / resume (DO THIS FIRST)

1. **If `progress.md` exists**, this is a resume. Read it, jump to the
   first unchecked `- [ ]` box, and continue. Do NOT regenerate it
   (that wipes ticks). Trust the ticks — already-done files are done.
2. **If it does not exist**, create it (see _progress.md_ below) and
   start from the top.

Resumability is the #1 invariant: a box is "done" ONLY when it is
ticked in `progress.md`. A fresh session with zero prior context must
be able to pick up from the first unchecked box. Tick the moment a
file is verified+fixed.

## Why synchronous, no subagents

Do the verification **in the main loop, file by file**. Do NOT fan out
to background-`Workflow`/subagents for this: when a subagent hits the
account session limit it reports success while silently leaving work
half-done, and its file edits are hard to reconcile. The main loop +
per-file ticks make interruption recovery trivial. (This overrides the
usual "use a workflow" nudge for this task.)

## Terminal output discipline — stay quiet

Spend tokens on the **work**, not on reports. While grinding through
files:

- Default to **silence or one terse line** ("color done, 181/327"). Do
  not narrate every file, re-explain the plan, or re-list what's left
  every turn.
- The durable record is `progress.md` (ticks + notes) and the _Flags
  for maintainer_ / _Fixes applied_ sections — write findings THERE,
  not in long terminal recaps.
- Only surface prose to the terminal for: a genuine blocking question,
  a real bug worth the maintainer's eyes right now, or a brief
  end-of-session checkpoint. Otherwise let `progress.md` speak.
- Never pad responses with status tables the user can read in
  `progress.md`.

## progress.md (the resume anchor)

Generate with `scripts/gen_progress.mjs` (regenerates the checklist
skeleton from the current file tree — run only when the content tree
changes; it does NOT preserve ticks). It contains:

- **How-to-resume** + this spec inline (so resumption needs no other
  context).
- **Global checks** G1–G7 (below), each its own checkbox.
- **Per-file checklist grouped by source module** — every `.md` as a
  `- [ ]`. Grouping by source lets you read each `src/` module once
  and verify all its pages together.
- **Fixes applied** and **Flags for maintainer** sections (append-only
  logs).

Tick with `scripts/tick.mjs` (bookkeeping only — content edits still
go through Edit/Write so the maintainer reviews real diffs):

```
node tools/ai-docs-review/tick.mjs \
  "path.md::✓ clean (why)" \
  "path2.md::✓ fixed: <what>" \
  "path3.md::⚑ flagged: <one-line>" \
  "fix::<bullet for Fixes applied>" \
  "flag::<bullet for Flags for maintainer>"
```

Use absolute paths to the script (the shell cwd is not guaranteed).
Avoid embedded double-quotes in args (they break shell parsing — the
script will report `NO MATCH`).

## Per-file verification (ACCURACY IS #1)

For each page, **read its source module first** (the group header
names it), then confirm and fix in place:

1. **Format / frontmatter** — exactly: `title` (KEEP verbatim —
   referenced by `topics.js`; NEVER change it), `subpath`, `topic`,
   `desc` (required, one short plain sentence ≤120 chars).
   `kind: component` ONLY on capitalized-component pages; no other
   `kind`. No `bucket`/`exports`/`tagline`. Body order: `# H1` → 1–3¶
   lede (first sentence mirrors `desc`; link related exports) →
   `## Arguments` / `## Attributes` table (types match the REAL
   signature; add `**Returns:**` when meaningful) or `## Exports`
   link-list for overview pages → optional explanatory `## Section`s →
   `## Examples`.
2. **Example one-liners** — every `### example` under `## Examples`
   opens with a leading one-line prose description (a clear, simple
   statement of what it shows) BEFORE the code fence. A `## Section`
   that merely mirrors an example is forbidden — fold it into the
   example's one-liner and delete the stray heading.
3. **Accurate desc + prose** — every statement, argument name/type,
   return value, option, and behavior MATCHES the actual code. Never
   document a method/option that doesn't exist; never omit a
   load-bearing one; never invent behavior.
4. **Idiomatic examples** (pota conventions):
   - native `on:click` / component `onClick`; `class=` not
     `className`; element ref is `use:ref={…}` (bare `ref=` does NOT
     capture the node).
   - reactive child/prop is the READER fn `{count.read}` / `{() => …}`
     / `<Show when={flag.read}>`; never `{signal}` as a child;
     `{signal.read()}` only for a deliberate static snapshot.
   - signal API `.read()` / `.write(v)` (no prev arg) /
     `.update(prev => next)`.
   - inline style keys are KEBAB-CASE.
   - `use/*` plugins via `use:ref={factory(opts)}` (compose
     `use:ref={[a(), b()]}`).
   - prefer derivation (`memo`/`derived`/`resolve`) over effects.
   - runnable examples are SELF-CONTAINED ending in `render(App)` (a
     non-UI illustration for an inherently non-visual export may be
     console-only).
   - relative imports include the file extension; tabs, single quotes,
     no semicolons.

## Global checks (G1–G7)

- **G1 — Format/example validator** (`scripts/validate.mjs`):
  mechanical frontmatter + example-one-liner check. Baseline must be
  `N/N`; RERUN after edits to confirm no regressions.
- **G2 — Completeness**: every export from `package.json` `"exports"`
  - `src/exports.js` + each module has ≥1 page; complex `use/*`
    modules expand each export into a folder.
    `scripts/completeness.mjs` is a coarse net with known false
    positives (single-export modules documented by their overview
    file; `Emitter`-destructured `on*`/`use*`; comment artifacts) —
    the authoritative check is reading each source during the per-file
    pass. Create a page for any genuine gap.
- **G3 — Overview/index pages**: each folder index (`use/<mod>.md`,
  etc.) has an `## Exports` link-list covering EVERY sub-page in its
  folder.
- **G4 — topics.js** (`projects/docs/tools/topics.js`, checked by
  `topics-check.mjs`): comprehensive of all APIs; **no `More`
  catch-all** section; closely-related APIs grouped tightly;
  **sensible duplication allowed** (a page may appear in more than one
  topic — adjust `buildManifest`'s claim logic if it forbids that).
  Every page reachable from a topic. (Titles are LOAD-BEARING —
  `topics.js` matches pages by id/title/export; never rename a page
  title to fit.)
- **G5 — Build**: `npm run build` (vite) green; spot-check a few
  rendered pages.
- **G6 — Internal-link integrity** (`scripts/links.mjs`): every
  markdown `](/…)` link resolves to a real page route. The router
  matches `location.pathname()` EXACTLY against
  `'/' + <relpath-without-.md>` (NO aliasing — `src/index.jsx`). RERUN
  until 0 broken.
- **G7 — Example type-check** (`scripts/typecheck.mjs`): every
  `## Examples` `jsx`/`tsx` fence type-checks against pota's types —
  an OFFLINE replica of the live-playground checker (same compiler
  options; needs `generated/docs/types.json` from
  `npm run build:generate`). Catches regressions the runnable-example
  pass can introduce (`=>` in JSX text → TS1382; a `JSX.Element`-typed
  value in a template literal → TS2731; wrong arg types). Optional
  path-substring args filter the run. A small in-script `ALLOW` map
  carries intentional, page-documented errors (e.g. `store/readonly`'s
  rejected write); a handful of fences error inherently (multi-file
  routing `load`, `updateBlacklist`/`toHTML`/`pasteText` typing) — see
  the Flags. RERUN after edits; only known/allowlisted errors may
  remain.

## Flags vs fixes (don't guess)

- **Fix** in place anything you can confirm wrong from source
  (signatures, behavior, broken links, non-idiomatic code, format).
  Log substantive fixes to _Fixes applied_.
- **Flag** anything genuinely ambiguous — a behavior you can't confirm
  from source, or a judgment call on which example/wording is "right".
  Do NOT guess: write it to the **Flags for maintainer** section of
  `progress.md` (via `flag::…`) with the diagnosis and a suggested
  fix, tick the file `⚑ flagged`, and move on. Never delete a flag
  without resolving it.

## Hard constraints

- NEVER change a `title` or `subpath` frontmatter value.
- Do NOT touch pota `src/`, the content parser, or the runtime — only
  the docs `.md` files and `topics.js`.
- NEVER commit or push; the maintainer reviews diffs in their own git
  client. (`topics.js` and the docs-site app live in a nested git repo
  at `projects/docs` — changes there don't show in the parent repo's
  status; the content and `progress.md` are in the parent repo.)

## Helper scripts (in `tools/ai-docs-review/`)

One per global check — `validate` (G1), `completeness` (G2),
`overview` (G3), `topics-check` (G4), `links` (G6), `typecheck` (G7) —
plus `tick` (tick boxes / append fix+flag bullets), `gen_progress`
(regenerate the skeleton), and shared `_paths.mjs` (resolves
`REPO`/`DOCS`/`CONTENT`/`PROGRESS`/`TOPICS`, honors `DOCS_DIR`).
Version-tracked; read the dir. Recreate any that goes missing — they
are small and deterministic, contracts described above.
