// G6 — Internal-link checker for docs content. Routes are matched
// EXACTLY by the router (src/index.jsx): route = '/' +
// <relpath-without-.md>. Reports every markdown link target `](/...)`
// that doesn't resolve to a real page route (fragments and query
// stripped; #anchors, http(s), and mailto skipped).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { CONTENT } from './_paths.mjs'

function walk(dir, out = []) {
	for (const n of readdirSync(dir)) {
		const p = join(dir, n)
		if (statSync(p).isDirectory()) walk(p, out)
		else if (n.endsWith('.md')) out.push(p)
	}
	return out
}

const files = walk(CONTENT).sort()
const routes = new Set(
	files.map(f => '/' + relative(CONTENT, f).replace(/\.md$/, '')),
)

const broken = []
const linkRe = /\]\(([^)]+)\)/g

for (const f of files) {
	const rel = relative(CONTENT, f)
	const raw = readFileSync(f, 'utf8')
	let m
	while ((m = linkRe.exec(raw))) {
		let target = m[1].trim()
		// only internal absolute links
		if (!target.startsWith('/')) continue
		// strip fragment + query
		target = target.split('#')[0].split('?')[0]
		if (target === '') continue // pure #fragment handled above
		if (!routes.has(target)) {
			broken.push({ rel, target })
		}
	}
}

// group by target for easy fixing
const byTarget = new Map()
for (const b of broken) {
	if (!byTarget.has(b.target)) byTarget.set(b.target, new Set())
	byTarget.get(b.target).add(b.rel)
}

console.log(`=== ${broken.length} broken internal links, ${byTarget.size} distinct targets ===\n`)
for (const [target, fileset] of [...byTarget.entries()].sort()) {
	// suggest a fix: does adding /guide prefix or some existing route match?
	const suggestions = [...routes].filter(
		r => r.endsWith(target) || r.endsWith(target.replace(/^\//, '/')),
	)
	console.log(`${target}   (${fileset.size} files)`)
	if (suggestions.length)
		console.log(`   → maybe: ${suggestions.slice(0, 4).join(' , ')}`)
}
