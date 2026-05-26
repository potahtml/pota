/**
 * Inline-format parser. Produces a tree the renderer can walk to
 * assemble JSX. Pure logic — no DOM or JSX deps, so this file is
 * unit-testable.
 *
 * Markers (`*bold*`, `/italic/`, `_under_`, `-strike-`, `|spoiler|`,
 * `` `code` ``) nest freely except `` ` ``, which is atomic — its
 * body stays literal so the renderer can copy it verbatim.
 *
 * @typedef {{ kind: 'text', s: string }
 *   | { kind: 'atom', name: string, s: string }
 *   | { kind: 'tag', name: string, children: Node[] }
 * } Node
 */

/**
 * Tag char → 1 if the tag may span newlines, 0 if it closes at the
 * first newline. Membership in this object is also the "is a tag"
 * test (`name in tags`).
 *
 * @type {Record<string, 0 | 1>}
 */
const tags = {
	'*': 0,
	'/': 1,
	'_': 1,
	'-': 0,
	'|': 1,
	'`': 1,
}

/** Atomic tags: body stays literal, no nested parsing. */
const ATOMIC = '`'

const opener = /["'[({¡¿]/
const closer = /[?!.,\])}"']/

/** @param {string} c @param {string} s @param {number} i */
const canOpen = (c, s, i) =>
	opener.test(c) ? /\s/.test(s[i - 1]) : /\s/.test(c)

/** @param {string} c @param {string} s @param {number} i */
const canClose = (c, s, i) =>
	closer.test(c)
		? i + 2 === s.length || /\s/.test(s[i + 2])
		: i + 1 === s.length || /\s/.test(c)

/**
 * @param {string} input
 * @returns {Node[]}
 */
export default function tokenize(input) {
	return parse(' ' + (input || '').trim())
}

/**
 * Parses `s`. The caller prepends a leading space so an opening tag
 * at position 0 of the original input still satisfies `canOpen`.
 * That space is stripped from the first text node before return.
 *
 * @param {string} s
 * @returns {Node[]}
 */
function parse(s) {
	/** @type {Node[]} */
	const out = []
	let buf = ''
	for (let i = 0; i < s.length; i++) {
		const name = s[i + 1]
		if (name in tags && canOpen(s[i], s, i)) {
			const close = findClose(name, tags[name], s, i + 1)
			if (close >= 0) {
				buf += s[i]
				if (buf) out.push({ kind: 'text', s: buf })
				buf = ''
				const inner = s.substring(i + 2, close)
				out.push(
					ATOMIC.indexOf(name) >= 0
						? { kind: 'atom', name, s: inner }
						: { kind: 'tag', name, children: parse(' ' + inner) },
				)
				i = close
				continue
			}
		}
		// `\*` etc. — drop the backslash so the tag char becomes literal.
		if (s[i] === '\\' && s[i + 1] in tags && canOpen(s[i - 1], s, i - 1)) {
			continue
		}
		buf += s[i]
	}
	if (buf) out.push({ kind: 'text', s: buf })
	// Strip the synthetic leading space (always exactly one char).
	if (out[0] && out[0].kind === 'text') {
		out[0].s = out[0].s.slice(1)
		if (!out[0].s) out.shift()
	}
	return out
}

/**
 * @param {string} name
 * @param {0 | 1} nLine
 * @param {string} s
 * @param {number} i  position of the opening tag char
 * @returns {number}  index of closing char, or -1 if no match
 */
function findClose(name, nLine, s, i) {
	for (i += 1; i < s.length; i++) {
		if (s[i] === name && canClose(s[i + 1], s, i)) return i
		if (!nLine && s[i] === '\n') return -1
	}
	return -1
}
