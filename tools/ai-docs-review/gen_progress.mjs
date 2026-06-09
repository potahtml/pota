import { readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { CONTENT, PROGRESS } from './_paths.mjs'

function walk(dir) {
	const out = []
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, e.name)
		if (e.isDirectory()) out.push(...walk(full))
		else if (e.name.endsWith('.md')) out.push(full)
	}
	return out
}

const files = walk(CONTENT)
	.map(f => relative(CONTENT, f).replace(/\\/g, '/'))
	.sort()

// root file -> source module
const ROOT_SRC = {
	reactive: [
		'action',
		'addEvent',
		'asyncEffect',
		'batch',
		'catchError',
		'cleanup',
		'context',
		'derived',
		'effect',
		'externalSignal',
		'isComponent',
		'isResolved',
		'listener',
		'makeCallback',
		'map',
		'markComponent',
		'memo',
		'on',
		'owned',
		'owner',
		'Pota',
		'ref',
		'removeEvent',
		'resolve',
		'root',
		'signal',
		'syncEffect',
		'untrack',
		'unwrap',
		'withValue',
	],
	renderer: ['Component', 'Fragment', 'insert', 'render', 'toHTML'],
	scheduler: ['ready', 'readyAsync'],
	props: [
		'setAttribute',
		'setProperty',
		'setStyle',
		'setClass',
		'setClassList',
	],
	std: ['getValue'],
	version: ['version'],
}
const rootGroupOf = base => {
	for (const [g, names] of Object.entries(ROOT_SRC))
		if (names.includes(base)) return g
	return 'top-level-unmapped'
}

const SRC_LABEL = {
	reactive: 'src/lib/reactive.js (+ src/lib/solid.js)',
	renderer: 'src/core/renderer.js',
	scheduler: 'src/core/scheduler.js',
	props: 'src/core/props/{attribute,property,style,class}.js',
	std: 'src/lib/std.js',
	version: 'src/version.js',
	guide:
		'src/core/props/* + src/core/renderer.js + JSX semantics (documentation/jsx.md)',
	components: 'src/components/* (one source file per page)',
	store: 'src/lib/store.js + src/lib/store/*',
	xml: 'src/core/xml.js',
}

// assign each file to a group key
const groups = new Map() // key -> { src, files: [] }
const ensure = (key, src) => {
	if (!groups.has(key)) groups.set(key, { src, files: [] })
	return groups.get(key)
}
for (const f of files) {
	const seg = f.split('/')
	let key, src
	if (seg[0].endsWith('.md')) {
		// root file
		const base = seg[0].replace(/\.md$/, '')
		const g = rootGroupOf(base)
		key = g
		src = SRC_LABEL[g] || '(unmapped — confirm source)'
	} else if (seg[0] === 'use') {
		const mod = seg[1].replace(/\.md$/, '')
		key = 'use/' + mod
		src = 'src/use/' + mod + '.js'
	} else {
		key = seg[0]
		src = SRC_LABEL[key] || '(confirm source)'
	}
	ensure(key, src).files.push(f)
}

// group ordering
const ORDER = [
	'reactive',
	'renderer',
	'scheduler',
	'props',
	'std',
	'version',
	'guide',
	'components',
	'store',
	'xml',
]
const useKeys = [...groups.keys()]
	.filter(k => k.startsWith('use/'))
	.sort()
const orderedKeys = [...ORDER.filter(k => groups.has(k)), ...useKeys]
// any leftover
for (const k of groups.keys())
	if (!orderedKeys.includes(k)) orderedKeys.push(k)

const total = files.length

const SPEC = `## Spec — the standard every page must meet

Ticking a file's box asserts ALL of the following were verified for it
(and fixed in place where needed). **Accuracy is #1**: read the source
module listed for the group before judging; every statement, argument
name/type, return value, option, and behavior MUST match the actual
code. Never document a method/option that does not exist; never omit a
load-bearing one.

1. **Format** — frontmatter has exactly: \`title\` (KEEP verbatim —
   referenced by topics.js), \`subpath\`, \`topic\`, \`desc\`
   (REQUIRED, one short plain-text sentence ≤120 chars). \`kind:
   component\` ONLY on capitalized-component pages; no other \`kind\`.
   No \`bucket\`/\`exports\`/\`tagline\`. Body order: \`# H1\` →
   1–3¶ lede (first sentence mirrors \`desc\`; link related exports as
   markdown links) → \`## Arguments\`/\`## Attributes\` table (types
   match the real signature; \`**Returns:**\` when meaningful) or \`##
   Exports\` link-list for overview pages → optional \`## Section\`
   explanations → \`## Examples\`.
2. **Example 1-liners** — every \`### example\` under \`## Examples\`
   opens with a leading one-line prose description (a clear, simple
   statement of what the example shows) BEFORE the code fence. A \`##
   Section\` that merely mirrors an example is forbidden — fold it
   into the example's 1-liner and delete the stray heading.
3. **Accurate desc** — the \`desc\` and lede are an accurate, clear,
   simple description of what the export actually is/does, matching
   source.
4. **Idiomatic examples** — native \`on:click\` / component
   \`onClick\`; \`class=\` not \`className\`; reactive child/prop is
   the READER fn \`{count.read}\` / \`{() => …}\` / \`<Show
   when={flag.read}>\` (never \`{signal}\` as a child;
   \`{signal.read()}\` only for a deliberate static snapshot); signal
   API \`.read()\`/\`.write(v)\` (no prev arg)/\`.update(prev=>next)\`;
   inline style keys KEBAB-CASE; \`use/*\` plugins via
   \`use:ref={factory(opts)}\` (compose \`use:ref={[a(),b()]}\`);
   prefer derivation (memo/derived/resolve) over effects; runnable
   examples are SELF-CONTAINED ending in \`render(App)\`; relative
   imports include the file extension; tabs, single quotes, no
   semicolons.

Hard constraints: NEVER change a \`title\` or \`subpath\` value. Do
not touch \`src/\`, the parser, or the runtime. Edit content \`.md\`
files (and \`topics.js\`) in place. For anything genuinely ambiguous
(a behavior you can't confirm from source), do NOT guess — add it to
**Flags for maintainer** below instead of editing.`

const HOWTO = `## How to resume (READ THIS FIRST)

This file is the single source of truth for the docs normalization
pass. Work is **synchronous, file-by-file, no subagents** (subagents
silently die at the session limit). If a session ends, a fresh one
resumes with zero context loss by following these steps:

1. Scan the checklists below top-to-bottom. **The first unchecked
   \`- [ ]\` box is where to resume.**
2. Per-file boxes are grouped by source module. For the group
   containing the next unchecked file, open its **source** (listed in
   the group header) and read it fully — then verify each unchecked
   file in that group against the Spec, fixing in place.
3. Tick a file \`- [x]\` the moment it is fully verified+fixed, with a
   short note: \`✓ clean\` or \`✓ fixed: <what>\` or \`⚑ flagged\`.
   A box is "done" ONLY once it is ticked here.
4. Global checks (completeness, overview links, topics.js, build) have
   their own boxes near the bottom — do them after (or alongside) the
   per-file pass as noted.
5. Append every substantive fix to **Fixes applied** and every
   uncertainty to **Flags for maintainer**. Never delete a flag
   without resolving it.
6. NEVER commit. The maintainer reviews diffs in their own git client.`

let out = ''
out += `# Docs content normalization — progress\n\n`
out += `Generated checklist for every \`.md\` under \`src/content/\` (**${total} files**). One pass, one consistent standard. **Resumable** — see below.\n\n`
out += HOWTO + '\n\n'
out += SPEC + '\n\n'
out += `---\n\n## Global checks\n\n`
out += `- [ ] **G1 — Mechanical format + example-1-liner validation** across all ${total} files (deterministic validator). Re-run after edits; must end at ${total}/${total}.\n`
out += `- [ ] **G2 — Completeness**: every export from \`package.json\` \`exports\` + \`src\` has ≥1 page; complex \`use/*\` modules expand each export into its folder. List any genuine gap as a new file under the right group, then tick it.\n`
out += `- [ ] **G3 — Overview/index pages**: each folder index (\`use/<mod>.md\`, \`store/store.md\`, \`xml\`…) has an \`## Exports\` link-list covering EVERY sub-page in its folder.\n`
out += `- [ ] **G4 — topics.js**: comprehensive of all APIs; no \`More\` catch-all section; closely-related APIs grouped tightly; sensible duplication allowed (adjust \`buildManifest\` claim logic if needed). Every page reachable from a topic.\n`
out += `- [ ] **G5 — \`npm run build\` (vite)** green; spot-check a few rendered pages.\n`
out += `- [ ] **G6 — Internal-link integrity**: every markdown \`](/…)\` link resolves to a real page route (router matches \`location.pathname()\` EXACTLY against \`'/'+<relpath-without-.md>\` — NO aliasing). Re-run until 0 broken.\n`
out += `- [ ] **G7 — Example type-check**: every \`## Examples\` fence type-checks against pota's types (offline replica of the playground checker — \`typecheck.mjs\`). Re-run after edits; only known/allowlisted errors may remain.\n\n`
out += `---\n\n## Per-file checklist (grouped by source module)\n\n`

let n = 0
for (const key of orderedKeys) {
	const g = groups.get(key)
	const label = key.startsWith('use/')
		? key
		: SRC_LABEL[key]
			? key
			: key
	out += `### ${key}  —  source: \`${g.src}\`  (${g.files.length})\n\n`
	for (const f of g.files.sort()) {
		n++
		out += `- [ ] \`${f}\`\n`
	}
	out += '\n'
}

out += `---\n\n## Fixes applied\n\n_(append one bullet per substantive fix: \`path — what changed\`)_\n\n`
out += `---\n\n## Flags for maintainer\n\n_(append anything you could not confirm from source, or judgment calls left for review)_\n\n`
out += `- \`context.md\` — \`### Functional override\` example is console-only (no \`render(App)\`); it deliberately demonstrates the synchronous return value of \`Theme(newValue, fn)\` outside the JSX tree. Carried over from the prior pass; confirm this is the intended treatment.\n`

writeFileSync(PROGRESS, out)
console.log(
	'wrote progress.md:',
	total,
	'files in',
	groups.size,
	'groups; counted',
	n,
)
