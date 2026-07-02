import { types as t } from '@babel/core'

import { defaultTreeAdapter, parseFragment } from 'parse5'

import { error, generateUidIdentifier } from './utils.js'

/** @typedef {import('parse5').DefaultTreeAdapterTypes.Template} Template */

/**
 * Parses partial content the way the runtime `parseXML` does —
 * fragment parsing with a `<template>` context element in `xmlns`.
 * parse5's default fragment context is already an HTML `<template>`
 * (the spec's "in template" mode), which matches
 * `template.innerHTML`; for namespaced partials the context element
 * mirrors the runtime's `createElementNS(xmlns, 'template')`.
 */
export function parsePartial(content, xmlns) {
	return xmlns
		? parseFragment(
				defaultTreeAdapter.createElement('template', xmlns, []),
				content,
				{},
			)
		: parseFragment(content)
}

/**
 * Collects the `childNodes`-index path from the fragment root for
 * every element, in pre-order — the same order the props array is in.
 * A nested `<template>`'s children live under `.content` (both in
 * parse5 and in the browser), recorded as a `'content'` step.
 */
function elementPaths(parsed) {
	const paths = []

	function walk(childNodes, base) {
		for (let i = 0; i < childNodes.length; i++) {
			const node = childNodes[i]
			if (defaultTreeAdapter.isElementNode(node)) {
				const path = base.concat(i)
				paths.push(path)
				// parse5 only sets `content` on HTML-namespace templates,
				// matching the browser
				const content =
					node.nodeName === 'template' &&
					/** @type {Template} */ (node).content
				content
					? walk(content.childNodes, path.concat('content'))
					: walk(node.childNodes, path)
			}
		}
	}

	walk(parsed.childNodes, [])

	return paths
}

/**
 * Property steps (`firstChild`/`nextSibling`/`content`) to reach
 * `target` from `base`; `undefined` when it would need `parentNode`.
 */
function stepsBetween(base, target) {
	let common = 0
	while (
		common < base.length &&
		common < target.length &&
		base[common] === target[common]
	) {
		common++
	}

	const steps = []

	// `base` is not an ancestor — usable only as a preceding sibling
	if (common < base.length) {
		if (
			common !== base.length - 1 ||
			typeof base[common] !== 'number' ||
			typeof target[common] !== 'number' ||
			target[common] < base[common]
		) {
			return
		}
		for (let i = base[common]; i < target[common]; i++) {
			steps.push('nextSibling')
		}
		common++
	}

	for (let i = common; i < target.length; i++) {
		if (target[i] === 'content') {
			steps.push('content')
		} else {
			steps.push('firstChild')
			for (let k = 0; k < target[i]; k++) {
				steps.push('nextSibling')
			}
		}
	}

	return steps
}

/**
 * Builds the call-site arrow for a partial: node declarations first —
 * each navigated from the nearest already-declared node — then the
 * prop statements in element pre-order, so paths are resolved on the
 * pristine clone before `createChildren` inserts dynamic nodes.
 *
 * `slots` is `{ index, fn }` per propped element in pre-order, where
 * `index` is the element's pre-order position and `fn` the arrow
 * holding its prop statements; `count` is the total number of
 * elements the compiler saw, verified against the parsed tree.
 */
export function buildPartialWalk(path, content, xmlns, slots, count) {
	const parsed = parsePartial(content, xmlns)

	let paths = elementPaths(parsed)

	if (paths.length !== count) {
		error(
			path,
			'\nThe browser parses this partial into a different number of elements than the source contains.',
			content,
		)
	}

	// runtime root — `parseXML` returns the node itself when the
	// template has a single top-level node, the fragment otherwise
	if (parsed.childNodes.length === 1) {
		paths = paths.map(p => p.slice(1))
	}

	let root
	let start = 0

	if (paths[slots[0].index].length === 0) {
		// the root element has props — its uid becomes the parameter
		root = slots[0].fn.params[0]
		start = 1
	} else {
		root = generateUidIdentifier(path.scope, 'root')
	}

	const declared = [{ id: root, path: [] }]
	const declarators = []

	for (let i = start; i < slots.length; i++) {
		const target = paths[slots[i].index]

		let best
		for (const base of declared) {
			const steps = stepsBetween(base.path, target)
			if (steps && (!best || steps.length < best.steps.length)) {
				best = { id: base.id, steps }
			}
		}

		const node = slots[i].fn.params[0]

		declarators.push(
			t.variableDeclarator(
				node,
				best.steps.reduce(
					(expr, step) =>
						t.memberExpression(expr, t.identifier(step)),
					t.cloneNode(best.id),
				),
			),
		)

		declared.push({ id: node, path: target })
	}

	const statements = declarators.length
		? [t.variableDeclaration('const', declarators)]
		: []

	for (const slot of slots) {
		statements.push(...slot.fn.body.body)
	}

	return t.arrowFunctionExpression(
		[root],
		t.blockStatement(statements),
	)
}
