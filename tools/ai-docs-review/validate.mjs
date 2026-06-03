// G1 — Deterministic compliance validator for pota docs content.
// Checks ONLY mechanical, spec-defined properties — no accuracy/idiom
// (that needs source reading). Output: per-file issue list + summary.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { CONTENT as ROOT } from './_paths.mjs'

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name)
		if (statSync(p).isDirectory()) walk(p, out)
		else if (name.endsWith('.md')) out.push(p)
	}
	return out
}

function parseFrontmatter(raw) {
	const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw)
	if (!m) return { data: {}, keys: [], body: raw }
	const data = {}
	const keys = []
	for (const line of m[1].split('\n')) {
		const mm = /^([\w-]+):\s*(.*)$/.exec(line)
		if (!mm) continue
		keys.push(mm[1])
		data[mm[1]] = mm[2].trim().replace(/^['"]|['"]$/g, '')
	}
	return { data, keys, body: raw.slice(m[0].length) }
}

// Is this a capitalized component page? (components/Foo.md, cap basename)
function isCapComponent(relPath) {
	const b = basename(relPath, '.md')
	return relPath.startsWith('components/') && /^[A-Z]/.test(b)
}

// Find the ## Examples section and check each ### has a paragraph (lede)
// before its first code fence. Returns list of bad example titles.
function checkExamples(body) {
	const lines = body.split('\n')
	const bad = []
	let inExamples = false
	let curTitle = null
	let sawProseSinceH3 = false
	let inFence = false
	let h3HadFenceWithoutProse = false

	const flush = () => {
		if (curTitle !== null && h3HadFenceWithoutProse)
			bad.push(curTitle)
	}

	for (const line of lines) {
		const h2 = /^##\s+(.+)$/.exec(line)
		const h3 = /^###\s+(.+)$/.exec(line)
		const fence = /^```/.test(line)

		if (h2 && !/^###/.test(line)) {
			// entering or leaving examples
			flush()
			curTitle = null
			inExamples = /^examples$/i.test(h2[1].trim())
			continue
		}
		if (!inExamples) continue

		if (h3) {
			flush()
			curTitle = h3[1].trim()
			sawProseSinceH3 = false
			h3HadFenceWithoutProse = false
			continue
		}
		if (fence) {
			inFence = !inFence
			if (!inFence) continue
			// opening a fence
			if (curTitle !== null && !sawProseSinceH3)
				h3HadFenceWithoutProse = true
			continue
		}
		if (inFence) continue
		// prose / list / table line between h3 and fence
		if (curTitle !== null && line.trim() && !/^>/.test(line))
			sawProseSinceH3 = true
	}
	flush()
	return bad
}

const files = walk(ROOT).sort()
const report = []
let okCount = 0

for (const f of files) {
	const rel = relative(ROOT, f)
	const raw = readFileSync(f, 'utf8')
	const { data, keys, body } = parseFrontmatter(raw)
	const issues = []

	// frontmatter completeness
	if (!data.title) issues.push('missing title')
	if (!('subpath' in data) && !rel.startsWith('guide/'))
		issues.push('missing subpath')
	if (!data.desc) issues.push('missing desc')
	if (!data.topic && !rel.startsWith('guide/'))
		issues.push('missing topic')

	// stale keys
	if (keys.includes('bucket')) issues.push('stale: bucket')
	if (keys.includes('exports')) issues.push('stale: exports')
	if (keys.includes('tagline')) issues.push('stale: tagline')

	// kind rules
	if ('kind' in data) {
		if (data.kind !== 'component')
			issues.push(`stale kind: ${data.kind}`)
		else if (!isCapComponent(rel))
			issues.push('kind:component on non-cap-component')
	} else if (isCapComponent(rel)) {
		issues.push('missing kind:component (cap component)')
	}

	// example 1-liners
	const badEx = checkExamples(body)
	for (const t of badEx)
		issues.push(`example missing 1-liner: "${t}"`)

	if (issues.length) report.push({ rel, issues })
	else okCount++
}

console.log(`\n=== ${okCount}/${files.length} files compliant ===\n`)
console.log(`=== ${report.length} files with issues ===\n`)
for (const r of report) {
	console.log(r.rel)
	for (const i of r.issues) console.log('   - ' + i)
}

// machine-readable for downstream batching
writeFileSync(
	'/tmp/noncompliant.json',
	JSON.stringify(
		report.map(r => r.rel),
		null,
		0,
	),
)
console.log(
	`\nwrote /tmp/noncompliant.json (${report.length} paths)`,
)
