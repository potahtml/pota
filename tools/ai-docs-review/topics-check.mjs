// G4 — verify topics.js against the actual content.
// Mimics content-parser.js parseMeta (id from path, topic/title/desc
// from frontmatter, exports always empty in the new site), runs the
// real buildManifest, and reports:
//   - total pages vs pages reachable from a topic (no "More" bucket)
//   - any page in NO section (a comprehensiveness gap)
//   - any "more"/catch-all section (must not exist)
//   - intentional duplications (page listed in >1 section)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { CONTENT as ROOT, TOPICS } from './_paths.mjs'

const { buildManifest } = await import(pathToFileURL(TOPICS).href)

const files = []
const walk = d => {
	for (const name of readdirSync(d)) {
		const p = join(d, name)
		if (statSync(p).isDirectory()) walk(p)
		else if (name.endsWith('.md')) files.push(p)
	}
}
walk(ROOT)

const fm = raw => {
	const m = /^---\n([\s\S]*?)\n---/.exec(raw)
	const data = {}
	if (m)
		for (const line of m[1].split('\n')) {
			const mm = /^([\w-]+):\s*(.*)$/.exec(line)
			if (mm) data[mm[1]] = mm[2].trim().replace(/^['"]|['"]$/g, '')
		}
	return data
}

const pages = files.map(f => {
	const id = relative(ROOT, f).replace(/\\/g, '/').replace(/\.md$/, '')
	const d = fm(readFileSync(f, 'utf8'))
	return {
		id,
		title: d.title || id,
		subpath: d.subpath || '',
		kind: d.kind || 'reference',
		topic: d.topic || '',
		exports: [], // new site has no `exports` frontmatter
		desc: d.desc || '',
		href: '/' + id,
	}
})

const { sections } = buildManifest(pages)

// map page id -> sections it appears in (by href, since items carry href)
const hrefToId = new Map(pages.map(p => [p.href, p.id]))
const appearIn = new Map()
for (const s of sections) {
	for (const it of s.items) {
		const pid = hrefToId.get(it.href)
		if (!pid) continue
		if (!appearIn.has(pid)) appearIn.set(pid, new Set())
		appearIn.get(pid).add(s.title)
	}
}

const unreached = pages.filter(p => !appearIn.has(p.id))
const more = sections.find(
	s => s.id === 'more' || /^more$/i.test(s.title),
)
const dups = [...appearIn.entries()]
	.filter(([, set]) => set.size > 1)
	.sort((a, b) => a[0].localeCompare(b[0]))

console.log(`pages: ${pages.length}`)
console.log(`sections: ${sections.length}`)
console.log(
	`reachable: ${appearIn.size}/${pages.length}` +
		(unreached.length ? '' : '  (comprehensive)'),
)
console.log(`"More"/catch-all section present: ${more ? 'YES' : 'no'}`)

console.log('\n-- sections (item count) --')
for (const s of sections)
	console.log(`  ${s.title.padEnd(18)} ${s.items.length}`)

if (unreached.length) {
	console.log('\n-- UNREACHED (gap) --')
	for (const p of unreached) console.log('  ' + p.id)
}

console.log(`\n-- intentional duplications (${dups.length}) --`)
for (const [pid, set] of dups)
	console.log(`  ${pid}  ∈  ${[...set].join(', ')}`)

const ok = !unreached.length && !more
console.log(
	'\n=== ' +
		(ok
			? 'G4 OK: comprehensive, no More bucket'
			: 'G4 FAIL: see gaps/More above') +
		' ===',
)
