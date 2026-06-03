// Batch-update progress.md (bookkeeping only — content edits go
// through Edit/Write for review). Three arg forms:
//   "<relpath-or-Gid>::<note>"  tick a checkbox, add a note
//   "fix::<text>"               append a bullet to "Fixes applied"
//   "flag::<text>"              append a bullet to "Flags for maintainer"
// Idempotent ticks (re-running updates the note). Reports remaining.
import { readFileSync, writeFileSync } from 'node:fs'
import { PROGRESS as FILE } from './_paths.mjs'

const args = process.argv.slice(2)
let lines = readFileSync(FILE, 'utf8').split('\n')

let ticked = 0
const misses = []

// insert a bullet into a named section, after its last existing
// bullet (or after the `_(` placeholder, or after the header).
function appendBullet(header, text) {
	const hIdx = lines.findIndex(l => l.startsWith(header))
	if (hIdx === -1) {
		misses.push('section ' + header)
		return
	}
	let endIdx = lines.length
	for (let i = hIdx + 1; i < lines.length; i++) {
		if (lines[i].startsWith('## ') || lines[i].trim() === '---') {
			endIdx = i
			break
		}
	}
	let insertAt = -1
	for (let i = hIdx + 1; i < endIdx; i++) {
		if (/^- /.test(lines[i])) insertAt = i + 1
	}
	if (insertAt === -1) {
		for (let i = hIdx + 1; i < endIdx; i++)
			if (lines[i].startsWith('_(')) insertAt = i + 1
	}
	if (insertAt === -1) insertAt = hIdx + 2
	lines.splice(insertAt, 0, '- ' + text)
}

for (const arg of args) {
	if (arg.startsWith('fix::')) {
		appendBullet('## Fixes applied', arg.slice(5))
		continue
	}
	if (arg.startsWith('flag::')) {
		appendBullet('## Flags for maintainer', arg.slice(6))
		continue
	}

	const idx = arg.indexOf('::')
	const key = idx === -1 ? arg : arg.slice(0, idx)
	const note = idx === -1 ? '' : arg.slice(idx + 2)

	let found = false
	for (let i = 0; i < lines.length; i++) {
		const ln = lines[i]
		const isFile = ln.includes('`' + key + '`')
		const isGlobal =
			ln.includes('**' + key + ' ') ||
			ln.includes('**' + key + '—') ||
			ln.includes('**' + key + '**')
		if ((isFile || isGlobal) && /^\s*- \[[ x]\]/.test(ln)) {
			let base
			if (isFile) {
				const m = ln.match(/^(\s*- )\[[ x]\](\s*`[^`]*`)/)
				base = m ? m[1] + '[x]' + m[2] : null
			} else {
				const m = ln.match(/^(\s*- )\[[ x]\](\s*\*\*[^\n]*?\*\*)/)
				base = m ? m[1] + '[x]' + m[2] : null
			}
			if (base) {
				lines[i] = note ? base + ' — ' + note : base
				found = true
				ticked++
				break
			}
		}
	}
	if (!found) misses.push(key)
}

writeFileSync(FILE, lines.join('\n'))

const remaining = lines.filter(l => /^\s*- \[ \]/.test(l)).length
const doneFiles = lines.filter(l => /^\s*- \[x\]\s*`/.test(l)).length
const totalFiles = lines.filter(l => /^\s*- \[[ x]\]\s*`/.test(l)).length
console.log(
	`ticked ${ticked}; per-file ${doneFiles}/${totalFiles}; total unchecked boxes remaining: ${remaining}`,
)
if (misses.length) console.log('NO MATCH for: ' + misses.join(', '))
