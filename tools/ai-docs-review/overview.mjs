// G3 — overview/index completeness.
// For every folder that has BOTH an index page (sibling `<folder>.md`)
// and sub-pages (`<folder>/*.md`), verify the index links to every
// sub-page route. Route of content/X/Y.md is `/X/Y`.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { CONTENT as ROOT } from './_paths.mjs'

const routeOf = abs => '/' + relative(ROOT, abs).replace(/\.md$/, '')

// collect every directory that holds sub-pages
const dirs = []
const walk = d => {
	for (const name of readdirSync(d)) {
		const p = join(d, name)
		if (statSync(p).isDirectory()) {
			dirs.push(p)
			walk(p)
		}
	}
}
walk(ROOT)

let problems = 0
for (const dir of dirs) {
	const indexMd = dir + '.md' // sibling index e.g. use/css.md
	if (!existsSync(indexMd)) continue
	const subs = readdirSync(dir)
		.filter(f => f.endsWith('.md'))
		.map(f => routeOf(join(dir, f)))
	const text = readFileSync(indexMd, 'utf8')
	const linked = new Set(
		[...text.matchAll(/\]\((\/[^)]+)\)/g)].map(m => m[1]),
	)
	const missing = subs.filter(r => !linked.has(r))
	if (missing.length) {
		problems += missing.length
		console.log(`\n## ${routeOf(indexMd)}  (index missing links)`)
		for (const m of missing) console.log('  ' + m)
	}
}

console.log(
	problems === 0
		? '\n=== all index pages link every sub-page ==='
		: `\n=== ${problems} sub-pages not linked from their index ===`,
)
