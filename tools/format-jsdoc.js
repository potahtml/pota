#!/usr/bin/env node
// Reformat JSDoc /** ... */ blocks via prettier-plugin-jsdoc
// without touching surrounding code.
//
// Usage:
//   npm run format:jsdoc                       # whole project
//   npm run format:jsdoc -- 'src/use/*.js'     # custom glob
//
// Defaults and Prettier options are read from package.json
// under the `formatter` key.
//
// How it stays comment-only:
//   - Genuine JSDoc blocks are found via @babel/parser, so
//     `'/** foo */'` inside a string literal is never matched.
//   - Each block is formatted in isolation by wrapping it in a
//     stub source so Prettier has something to attach the comment
//     to; the stub is stripped from the output.
//   - After splicing, the new file is re-parsed and the bytes
//     between comments must match the original. If anything else
//     drifted (e.g. plugin moved code, stub bled through), the
//     file is left untouched and an error is reported.
import { glob, readFile, writeFile } from 'node:fs/promises'
import { parse } from '@babel/parser'
import { format } from 'prettier'

// Config lives in `package.json`:
//   formatter.pattern   default glob when none is given on the CLI
//   formatter.exclude   directory prefixes always skipped
//   prettier            standard Prettier config, shared with any
//                       other prettier-based script (e.g. format:md)
const pkg = JSON.parse(
	await readFile(
		new URL('../package.json', import.meta.url),
		'utf8',
	),
)
const formatter = pkg.formatter ?? {}

const DEFAULT_PATTERN =
	formatter.pattern ?? '**/*.{js,jsx,ts,tsx,mjs,cjs}'
const EXCLUDED_DIRS = formatter.exclude ?? [
	'node_modules/',
	'generated/',
]
const PRETTIER_OPTS = {
	...(pkg.prettier ?? {}),
	// `parser` and `plugins` are load-bearing; can't be overridden.
	parser: 'babel',
	plugins: ['prettier-plugin-jsdoc'],
}

const STUB = 'const __pota_jsdoc_stub = 0'

const pattern = process.argv[2] || DEFAULT_PATTERN
if (!process.argv[2]) {
	console.log(
		`no glob given — using default ${DEFAULT_PATTERN} (excluding ${EXCLUDED_DIRS.join(', ')})`,
	)
}

const files = []
for await (const f of glob(pattern)) {
	if (EXCLUDED_DIRS.some(dir => f.startsWith(dir))) continue
	files.push(f)
}
if (!files.length) {
	console.error(`no files matched: ${pattern}`)
	process.exit(1)
}

let scanned = 0
let changed = 0
let aborted = 0
let skipped = 0
for (const file of files.sort()) {
	scanned++
	try {
		const result = await processFile(file)
		if (result === 'changed') changed++
		else if (result === 'aborted') aborted++
		else skipped++
	} catch (err) {
		aborted++
		console.error(`abort ${file}: ${err.message}`)
	}
}

console.log(
	`\n${scanned} scanned, ${changed} changed, ${skipped} unchanged, ${aborted} aborted`,
)
process.exit(aborted ? 1 : 0)

async function processFile(file) {
	const original = await readFile(file, 'utf8')
	const origComments = jsdocComments(original)
	if (!origComments.length) return 'skipped'

	let next = original
	for (let i = origComments.length - 1; i >= 0; i--) {
		const c = origComments[i]
		const raw = original.slice(c.start, c.end)
		// Skip single-line blocks (`/** ... */` with no newline).
		// Avoids re-wrapping inline casts like
		// `const x = /** @type {Foo} */ (y)` into multi-line.
		if (!raw.includes('\n')) continue
		const indent = leadingIndent(original, c.start)
		const dedented = dedent(raw, indent)
		const formatted = await formatBlock(dedented)
		const reindented = reindent(formatted, indent)
		next = next.slice(0, c.start) + reindented + next.slice(c.end)
	}

	if (next === original) return 'skipped'

	// Safety: re-parse the new content and compare non-comment bytes.
	const newComments = jsdocComments(next)
	if (newComments.length !== origComments.length) {
		console.error(
			`abort ${file}: comment count changed (${origComments.length} → ${newComments.length})`,
		)
		return 'aborted'
	}
	if (
		nonCommentBytes(original, origComments) !==
		nonCommentBytes(next, newComments)
	) {
		console.error(`abort ${file}: non-comment text would change`)
		return 'aborted'
	}

	await writeFile(file, next)
	console.log(`changed ${file}`)
	return 'changed'
}

function jsdocComments(src) {
	const ast = parse(src, {
		sourceType: 'module',
		allowImportExportEverywhere: true,
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		allowUndeclaredExports: true,
		plugins: ['jsx', 'typescript'],
	})
	return (ast.comments || []).filter(
		c => c.type === 'CommentBlock' && c.value.startsWith('*'),
	)
}

function nonCommentBytes(src, comments) {
	let out = ''
	let cursor = 0
	for (const c of comments) {
		out += src.slice(cursor, c.start)
		cursor = c.end
	}
	out += src.slice(cursor)
	return out
}

function leadingIndent(src, pos) {
	const lineStart = src.lastIndexOf('\n', pos - 1) + 1
	const between = src.slice(lineStart, pos)
	return /^[\t ]*$/.test(between) ? between : ''
}

function dedent(block, indent) {
	if (!indent) return block
	return block
		.split('\n')
		.map((line, i) =>
			i === 0 || !line.startsWith(indent)
				? line
				: line.slice(indent.length),
		)
		.join('\n')
}

function reindent(block, indent) {
	if (!indent) return block
	return block
		.split('\n')
		.map((line, i) =>
			i === 0 || line === '' ? line : indent + line,
		)
		.join('\n')
}

async function formatBlock(comment) {
	const out = await format(`${comment}\n${STUB}\n`, PRETTIER_OPTS)
	// Prettier emits `<comment>\n<stub>\n`. Strip the stub and the
	// single newline before it, tolerating a trailing newline.
	const idx = out.lastIndexOf(STUB)
	if (idx === -1) {
		throw new Error('stub disappeared from prettier output')
	}
	let formatted = out.slice(0, idx)
	if (formatted.endsWith('\n')) formatted = formatted.slice(0, -1)
	return formatted
}
