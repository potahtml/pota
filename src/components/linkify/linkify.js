import { Component } from '../../core/renderer.js'
import { noop } from '../../lib/std.js'
import { copyToClipboard, isEmoji } from '../../use/string.js'

import Emoji from './emoji.json' with { type: 'json' }
import { Media } from './media.js'
import tokenize from './tokenize.js'

/** @typedef {import('./tokenize.js').Node} Node */

/** @type {Record<string, string>} */
const EmojiMap = Emoji

const separator = /(\s+)/
const mediaURL = /^(https?|blob|data):.+/

/** @param {PointerEvent} e */
const spoilerRemove = e => {
	const t = /** @type {HTMLElement} */ (e.currentTarget)
	t.style.backgroundColor = 'inherit'
	t.style.color = 'inherit'
}

/**
 * Tag-marker → component factory. Atomic markers (`` ` ``) receive the
 * raw inner string so we can copy it to clipboard verbatim; the rest
 * receive the recursively-rendered children array.
 *
 * @type {Record<string, (c: any) => JSX.Element>}
 */
const wraps = {
	'*': c => Component('b', { children: c }),
	'/': c => Component('em', { children: c }),
	'_': c => Component('u', { children: c }),
	'-': c => Component('s', { children: c }),
	'|': c =>
		Component('span', {
			'data-linkify-type': 'spoiler',
			'on:click': spoilerRemove,
			children: c,
		}),
	'`': s =>
		Component('code', {
			'on:click': () => copyToClipboard(s),
			children: ['`', s, '`'],
		}),
}

/**
 * Inline-formatter for chat-style text. Renders `*bold*`, `/italic/`,
 * `_under_`, `-strike-`, `|spoiler|` and `` `code` `` markers,
 * recognises media URLs, optionally substitutes `:emoji:` shortcodes,
 * and can highlight a `mark` term. A leading `>` makes the whole
 * block a quote; a leading `/ ` italicises it.
 *
 * @type {Component<{
 * 	text?: string
 * 	trim?: boolean
 * 	mark?: string | false
 * 	scroll?: () => void
 * 	guessType?: boolean
 * 	emoji?: boolean
 * }>}
 */
export function Linkify(props) {
	const scroll = props.scroll || noop
	/** @type {string | false} */
	const mark = props.mark ? props.mark.toLowerCase() : false

	let s = (props.text || '').trim()
	if (props.trim) {
		s = (props.text || '')
			.split('\n')
			.map(m => m.trim())
			.join('\n')
			.trim()
	}

	/** @type {(x: any) => JSX.Element} */
	let quote = x => x
	/** @type {(x: any) => JSX.Element} */
	let italic = x => x
	if (s.startsWith('>')) {
		s = s.replace(/^>\s*/, '').trim()
		quote = x => Component('q', { children: x })
	}
	if (s.startsWith('/ ')) {
		s = s.replace(/^\/\s+/, '').trim()
		italic = x => Component('em', { children: x })
	}

	const ctx = {
		emoji: !!props.emoji,
		mark,
		scroll,
		guessType: props.guessType,
	}

	return quote(italic(render(tokenize(s), ctx)))
}

/**
 * @typedef {{
 *   emoji: boolean
 *   mark: string | false
 *   scroll: () => void
 *   guessType?: boolean
 * }} Ctx
 *
 * @param {Node[]} nodes
 * @param {Ctx} ctx
 */
function render(nodes, ctx) {
	/** @type {any[]} */
	const out = []
	for (const n of nodes) {
		if (n.kind === 'text') appendText(n.s, ctx, out)
		else if (n.kind === 'atom') out.push(wraps[n.name](n.s))
		else out.push(wraps[n.name](render(n.children, ctx)))
	}
	return out
}

/**
 * Splits a text run into words and substitutes emoji shortcodes,
 * media URLs, and the `mark` highlight. Adjacent literals coalesce
 * into one DOM text node.
 *
 * @param {string} s
 * @param {Ctx} ctx
 * @param {any[]} out
 */
function appendText(s, ctx, out) {
	for (const piece of s.split(separator)) {
		if (ctx.emoji && EmojiMap[piece]) {
			out.push(
				Component('span', {
					'data-linkify-type': 'emoji',
					children:
						piece[0] === '#'
							? piece + ' ' + EmojiMap[piece]
							: EmojiMap[piece],
				}),
			)
		} else if (mediaURL.test(piece)) {
			out.push(
				Component(Media, {
					url: piece,
					scroll: ctx.scroll,
					guessType: ctx.guessType,
				}),
			)
		} else if (ctx.mark !== false && ctx.mark === piece.toLowerCase()) {
			out.push(Component('mark', { children: piece }))
		} else if (
			ctx.emoji &&
			!/[a-z0-9&*#]/i.test(piece) &&
			isEmoji(piece)
		) {
			out.push(
				Component('span', {
					'data-linkify-type': 'emoji',
					children: piece,
				}),
			)
		} else if (typeof out[out.length - 1] === 'string') {
			out[out.length - 1] += piece
		} else {
			out.push(piece)
		}
	}
}
