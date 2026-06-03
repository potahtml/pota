// G2 — Deterministic export↔file completeness check for pota docs.
// Enumerates exports per module from source (handles export const/
// function/class/let, export { ... }, export { ... } from '...'),
// then diffs against content files. Re-exports via `export *` are
// noted but not fully resolved.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { REPO, CONTENT } from './_paths.mjs'

const SRC = join(REPO, 'src')

function exportsOf(file) {
	if (!existsSync(file)) return { names: [], starFrom: [] }
	const code = readFileSync(file, 'utf8')
	const names = new Set()
	const starFrom = []
	// export const/function/class/let NAME  (incl. async function)
	for (const m of code.matchAll(
		/^export\s+(?:async\s+)?(?:const|function|class|let|var)\s+([A-Za-z_$][\w$]*)/gm,
	))
		names.add(m[1])
	// export { a, b as c, d } [from '...']
	for (const m of code.matchAll(/export\s*\{([^}]*)\}\s*(from\s*['"][^'"]*['"])?/g)) {
		for (const part of m[1].split(',')) {
			const t = part.trim()
			if (!t) continue
			const as = /(\S+)\s+as\s+(\S+)/.exec(t)
			names.add(as ? as[2] : t)
		}
	}
	// export * from '...'
	for (const m of code.matchAll(/export\s*\*\s*from\s*['"]([^'"]*)['"]/g))
		starFrom.push(m[1])
	return { names: [...names], starFrom }
}

function contentFilesIn(dir) {
	if (!existsSync(dir)) return []
	return readdirSync(dir)
		.filter(n => n.endsWith('.md'))
		.map(n => basename(n, '.md'))
}

function report(label, exp, files, opts = {}) {
	const expSet = new Set(exp.names)
	const fileSet = new Set(files)
	// ignore overview file (named after module) and known non-export pages
	const ignore = new Set(opts.ignore || [])
	const missing = exp.names.filter(
		n => !fileSet.has(n) && !ignore.has(n),
	)
	const orphan = files.filter(
		f => !expSet.has(f) && !ignore.has(f),
	)
	if (missing.length || orphan.length || exp.starFrom.length) {
		console.log(`\n## ${label}`)
		if (missing.length)
			console.log('  MISSING file for export: ' + missing.join(', '))
		if (orphan.length)
			console.log('  ORPHAN file (no export):  ' + orphan.join(', '))
		if (exp.starFrom.length)
			console.log(
				'  (export * from — unresolved, verify manually: ' +
					exp.starFrom.join(', ') +
					')',
			)
	}
}

console.log('=== pota/use/* modules ===')
const useDir = join(SRC, 'use')
for (const entry of readdirSync(useDir)) {
	const full = join(useDir, entry)
	let modFile, modName
	if (statSync(full).isFile() && entry.endsWith('.js')) {
		modName = basename(entry, '.js')
		modFile = full
	} else continue
	const exp = exportsOf(modFile)
	const contentSub = join(CONTENT, 'use', modName)
	const files = contentFilesIn(contentSub)
	// overview lives at use/<mod>.md (separate)
	const overview = existsSync(join(CONTENT, 'use', modName + '.md'))
	report(`pota/use/${modName}` + (overview ? '' : '  [NO OVERVIEW]'), exp, files)
}

// top-level pota
console.log('\n=== pota (top-level, src/exports.js) ===')
{
	const exp = exportsOf(join(SRC, 'exports.js'))
	const files = contentFilesIn(CONTENT) // top-level *.md
	report('pota', exp, files, {
		ignore: ['version'],
	})
}

// components
console.log('\n=== pota/components ===')
{
	const exp = exportsOf(join(SRC, 'components/@main.js'))
	const files = contentFilesIn(join(CONTENT, 'components'))
	report('pota/components', exp, files)
}

// store
console.log('\n=== pota/store ===')
{
	const exp = exportsOf(join(SRC, 'lib/store.js'))
	const files = contentFilesIn(join(CONTENT, 'store'))
	report('pota/store', exp, files, { ignore: ['store'] })
}

// xml
console.log('\n=== pota/xml ===')
{
	const exp = exportsOf(join(SRC, 'core/xml.js'))
	const files = contentFilesIn(join(CONTENT, 'xml'))
	report('pota/xml', exp, files)
}

console.log('\n=== done ===')
