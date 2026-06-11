// G7 — Type-checks the `## Examples` code fences against pota's types,
// an OFFLINE replica of the docs live-playground checker
// (projects/docs/src/components/playground/ts-service.js). Catches
// regressions the console.log→on-page-signal example pass can
// introduce: `=>` inside JSX text (TS1382), a `JSX.Element`-typed
// value interpolated into a template literal (TS2731), wrong argument
// types, etc. — without booting vite (that is G5).
//
// Each `jsx`/`tsx` fence under a `## Examples` heading is checked as
// `/app.tsx` in a fresh virtual TS environment, with the SAME compiler
// options the playground forces (strict, but strictNullChecks +
// noImplicitAny disabled to match pota's own tsconfig — otherwise every
// idiomatic example shows nullability/implicit-any noise pota never
// flags). @typescript/vfs force-enables `strict` and silently wins
// over options that omit it — that is why the two sub-flags are
// disabled explicitly here and in ts-service.js, not via
// `strict: false`. Non-`## Examples` snippets are NOT checked,
// mirroring the playground.
//
//   node tools/ai-docs-review/typecheck.mjs            # all content
//   node tools/ai-docs-review/typecheck.mjs use/event  # path filter(s)
//
// Needs `generated/docs/types.json` (regen: `npm run build:generate`
// or `watch:generate`) and TypeScript + @typescript/vfs from the docs
// project's node_modules. Exits non-zero if any non-allowlisted fence
// errors.
import {
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
	existsSync,
} from 'node:fs'
import { join, relative } from 'node:path'
import { createRequire } from 'node:module'
import { REPO, DOCS, CONTENT } from './_paths.mjs'

// Diagnostics that are intentional (documented in the page itself) or
// inherent to the example (vfs/lib-dom limitations a consumer-facing
// fence shouldn't contort around) — reported as "(intentional)" and
// excluded from the failure count. Keyed by content-relative path →
// set of TS error codes.
const ALLOW = {
	// store/readonly's example exists to prove writes are type-rejected;
	// the prose says "TypeScript already flagged it".
	'store/readonly.md': new Set([2540]),
	// lazy-route example imports app-local page modules ('./pages/…')
	// that cannot exist in the vfs — code-splitting by path is the point.
	'components/load.md': new Set([2307]),
	// passes `window` where lib-dom wants `Window & typeof globalThis`;
	// fine at runtime, casting would clutter the example.
	'store/updateBlacklist.md': new Set([2345]),
	// childNodes(s) handed to toHTML — runtime-fine union the example
	// keeps uncast for readability.
	'toHTML.md': new Set([2345]),
	// e.target is Element; the example uses textarea members
	// (selectionStart/value/setRangeText) without a cast for readability.
	'use/clipboard/pasteText.md': new Set([2339]),
}

const TYPES_JSON = join(REPO, 'generated', 'docs', 'types.json')
const TS_LIB = join(DOCS, 'node_modules', 'typescript', 'lib')

if (!existsSync(TYPES_JSON)) {
	console.error(
		`missing ${relative(REPO, TYPES_JSON)} — run \`npm run build:generate\` first`,
	)
	process.exit(2)
}
if (!existsSync(TS_LIB)) {
	console.error(
		`missing TypeScript in ${relative(REPO, DOCS)}/node_modules — run \`npm install\` in the docs project`,
	)
	process.exit(2)
}

const require = createRequire(join(DOCS, 'node_modules') + '/')
const ts = require('typescript')
const {
	createDefaultMapFromNodeModules,
	createSystem,
	createVirtualTypeScriptEnvironment,
} = require('@typescript/vfs')

const types = JSON.parse(readFileSync(TYPES_JSON, 'utf8'))

// Identical to the playground (ts-service.js).
const compilerOptions = {
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ESNext,
	jsx: ts.JsxEmit.Preserve,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	allowNonTsExtensions: true,
	allowImportingTsExtensions: true,
	allowJs: true,
	esModuleInterop: true,
	jsxImportSource: 'pota',
	noEmit: true,
	types: ['pota'],
	strict: true,
	strictNullChecks: false,
	noImplicitAny: false,
}

// Build the shared lib map once: default libs from the docs project's
// local TypeScript, plus pota's bundled ambient types + the CSS-module
// wildcards the playground declares.
const baseMap = createDefaultMapFromNodeModules(
	compilerOptions,
	ts,
	TS_LIB,
)
const typeRoots = []
for (const t of types) {
	const p = '/node_modules/' + t.f
	baseMap.set(p, t.c)
	typeRoots.push(p)
}
const CSS_MODULES_DTS = '/css-modules.d.ts'
baseMap.set(
	CSS_MODULES_DTS,
	[
		"declare module '*.module.css' {",
		'\tconst classes: { readonly [key: string]: string }',
		'\texport default classes',
		'}',
		"declare module '*.css' {",
		'\tconst css: string',
		'\texport default css',
		'}',
		'',
	].join('\n'),
)
typeRoots.push(CSS_MODULES_DTS)

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name)
		if (statSync(p).isDirectory()) walk(p, out)
		else if (name.endsWith('.md')) out.push(p)
	}
	return out
}

// Extract jsx/tsx fences under the `## Examples` heading. The section
// flag toggles ONLY on `##` headings — a `### subexample` heading must
// not reset it. Returns [{ lang, body, line }] (line = 1-based source
// line of the fence's first body line, for accurate error locations).
function exampleFences(md) {
	const lines = md.split('\n')
	let inExamples = false
	let cur = null
	const fences = []
	lines.forEach((line, i) => {
		const h = /^(#{1,6})\s+(.*)$/.exec(line)
		if (h && !cur && h[1].length === 2) {
			inExamples = /examples/i.test(h[2])
		}
		const f = /^```(\w+)?/.exec(line)
		if (f && !cur && inExamples) {
			const lang = f[1] || ''
			if (lang === 'jsx' || lang === 'tsx') {
				cur = { lang, body: [], line: i + 2 }
				return
			}
		}
		if (cur) {
			if (/^```\s*$/.test(line)) {
				fences.push(cur)
				cur = null
			} else cur.body.push(line)
		}
	})
	return fences
}

const filters = process.argv.slice(2)
const files = walk(CONTENT)
	.sort()
	.filter(f => {
		if (!filters.length) return true
		const rel = relative(CONTENT, f)
		return filters.some(s => rel.includes(s))
	})

const failing = []
let fenceCount = 0
let failCount = 0
let intentionalCount = 0

for (const f of files) {
	const rel = relative(CONTENT, f)
	const allowCodes = ALLOW[rel]
	const fences = exampleFences(readFileSync(f, 'utf8'))
	fences.forEach((fence, i) => {
		fenceCount++
		const fsMap = new Map(baseMap)
		const env = createVirtualTypeScriptEnvironment(
			createSystem(fsMap),
			[...typeRoots],
			ts,
			compilerOptions,
		)
		env.createFile('/app.tsx', fence.body.join('\n') + '\n')
		const diags = [
			...env.languageService.getSemanticDiagnostics('/app.tsx'),
			...env.languageService.getSyntacticDiagnostics('/app.tsx'),
		]
		const real = diags.filter(
			d => !(allowCodes && allowCodes.has(d.code)),
		)
		if (allowCodes) intentionalCount += diags.length - real.length
		if (!real.length) return
		failCount++
		failing.push(rel)
		console.log(`\n✗ ${rel}  [example #${i + 1}, ${fence.lang}]`)
		for (const d of real) {
			let where = ''
			if (d.start != null) {
				const lc = d.file.getLineAndCharacterOfPosition(d.start)
				// map back to the source file line for clickable output
				where = `  ${rel}:${fence.line + lc.line}:${lc.character + 1}`
			}
			const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n')
			console.log(`   TS${d.code}: ${msg}${where}`)
		}
	})
}

console.log(
	`\n=== ${fenceCount - failCount}/${fenceCount} example fences type-clean ` +
		`(${failCount} failing, ${intentionalCount} intentional/allowlisted) ===`,
)

if (failing.length) {
	writeFileSync(
		'/tmp/docs-typecheck-fail.json',
		JSON.stringify([...new Set(failing)], null, 0),
	)
	console.log(
		`wrote /tmp/docs-typecheck-fail.json (${new Set(failing).size} paths)`,
	)
}

process.exit(failCount ? 1 : 0)
