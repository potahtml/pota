import {
	assign,
	empty,
	error,
	isString,
	keys,
	unwrapArray,
	getValue,
	toArray,
	warn,
	withWeakCache,
} from '../lib/std.js'

import { namespaces } from './props/plugin.js'

import { Component } from './renderer.js'

import { cleanJSXText, createComment } from '../use/dom.js'

import * as components from '../components/@main.js'

/** @type {Record<string, JSX.ElementType>} */
const defaultRegistry = assign(empty(), components, {
	load: undefined,
	customElement: undefined,
	CustomElement: undefined,
})

/**
 * Sentinel used to splice `values` into the template string so the
 * XML parser preserves interpolation positions. Chosen to be unlikely
 * to collide with anything a user might write in a literal.
 */
const id = 'rosa19611227'
const splitId = /(rosa19611227)/

/**
 * Parses a template's strings into a DOM node list. Cached by
 * template identity so the (expensive) DOMParser only runs once per
 * source location, even across `XML()` instances — only the
 * per-instance compile step depends on the registry.
 *
 * @param {TemplateStringsArray} template
 * @returns {ChildNode[]}
 */
const parse = withWeakCache(
	(/** @type {TemplateStringsArray} */ template) => {
		const parsed = /** @type {NodeListOf<ChildNode>} */ (
			new DOMParser().parseFromString(
				`<xml ${namespaces.xmlns}>${template.join(id)}</xml>`,
				'text/xml',
			).firstChild.childNodes
		)

		const first = /** @type {HTMLElement} */ (parsed[0])
		if (first?.tagName === 'parsererror') {
			first.style.padding = '1em'
			first.style.whiteSpace = 'pre-line'
			first.innerText =
				first.childNodes[1].textContent + '\n' + template.join('$v')
		}
		return toArray(parsed)
	},
)

/**
 * Builds a per-instance template cache for the given `xml`. Each
 * `XML()` calls this once at construction; the returned function
 * memoizes compiled factories by template identity, so when the `xml`
 * instance is collected its template factories go with it.
 *
 * Trade-off: `xml.define` must happen before the first `xml\`...``
 * invocation that uses the new tag — registering a name after a
 * template has been compiled won't retroactively rebind it.
 *
 * @param {{ components: Record<string, JSX.ElementType> }} xml
 */
const compile = xml =>
	withWeakCache((/** @type {TemplateStringsArray} */ template) => {
		const next = { i: 0 }
		const builders = parse(template)
			.map(n => compileNode(n, next, xml))
			.filter(b => b)
		return (/** @type {unknown[]} */ values) =>
			unwrapArray(builders.map(b => b(values)))
	})

/**
 * Walks a parsed DOM node once and returns a builder function that
 * emits the corresponding JSX element on demand. The `xml` argument
 * is consulted at compile time to resolve registered components, so
 * each `XML()` instance compiles its own builder set.
 *
 * @param {ChildNode} node
 * @param {{ i: number }} next Compile-time slot counter, threaded
 *   through the walk so each interpolation point bakes its own fixed
 *   index into `values`. Not referenced at render time.
 * @param {{ components: Record<string, JSX.ElementType> }} xml
 * @returns {(values: unknown[]) => JSX.Element}
 */
function compileNode(node, next, xml) {
	switch (node.nodeType) {
		case 1: {
			/* element */
			const { tagName, attributes, childNodes } =
				/** @type {DOMElement} */ (node)

			/** @type {Record<string, string>} */
			const staticProps = empty()
			/** @type {((props: any, values: unknown[]) => void)[]} */
			const setters = []
			for (const { name, value } of attributes) {
				if (value === id) {
					const valIdx = next.i++
					setters.push((props, values) => {
						props[name] = values[valIdx]
					})
				} else if (value.includes(id)) {
					/** Bake each `id` marker's slot index; literals stay strings */
					const segments = value
						.split(splitId)
						.map(x => (x === id ? next.i++ : x))
					setters.push((props, values) => {
						const snap = segments.map(s =>
							isString(s) ? s : values[s],
						)
						props[name] = () => snap.map(getValue).join('')
					})
				} else {
					/**
					 * Literal — collected once at compile time; folded into the
					 * per-render `props` object via a single `assign` rather
					 * than a per-attribute closure call.
					 */
					staticProps[name] = value
				}
			}

			const children = childNodes.length
				? toArray(childNodes)
						.map(n => compileNode(n, next, xml))
						.filter(b => b)
				: null

			/**
			 * Resolve the component-or-tagName at compile time using the
			 * owning `xml` instance's registry. Registered names (any case)
			 * resolve to the component value. Names not in the registry
			 * fall through to `tagName` — `Component` then routes string
			 * tags through `createTag`, which handles standard HTML/SVG and
			 * hyphenated custom elements alike. Uppercase misses are likely
			 * typos so we warn once per template; hyphenated / lowercase
			 * misses are legitimate (real custom elements) and stay quiet.
			 */
			const component = xml.components[tagName]
			if (!component && /^[A-Z]/.test(tagName)) {
				warn(`xml: Forgot to ´xml.define({ ${tagName} })´?`)
			}
			const value = component || tagName

			return values => {
				/** @type {Record<string, unknown>} */
				const props = assign(empty(), staticProps)
				for (const set of setters) set(props, values)
				if (children && children.length) {
					props.children = unwrapArray(
						children.map(child => child(values)),
					)
				}
				return Component(value, props)
			}
		}
		case 3: {
			/**
			 * Text — clean whitespace at compile time using JSX rules so
			 * xml↔jsx round-trips don't have to fix up whitespace. The
			 * interpolation marker has no whitespace, so the cleaner
			 * preserves it in place; pure-whitespace text drops out.
			 */
			const value = cleanJSXText(node.nodeValue)
			if (!value) return null
			if (value.includes(id)) {
				const segments = value
					.split(splitId)
					.map(x => (x === id ? next.i++ : x))
				return values =>
					segments.map(s => (isString(s) ? s : values[s]))
			}
			return () => value
		}
		case 8: {
			/* comment */
			const value = node.nodeValue
			if (value.includes(id)) {
				const segments = value
					.split(splitId)
					.map(x => (x === id ? next.i++ : x))
				return values => {
					/**
					 * Reuse one Comment node and mutate its nodeValue so
					 * reactive updates don't replace the node on every read
					 */
					const comment = createComment('')
					const snap = segments.map(s =>
						isString(s) ? s : values[s],
					)
					return () => {
						comment.nodeValue = snap.map(getValue).join('')
						return comment
					}
				}
			}
			return () => createComment(value)
		}
		default: {
			error(`xml: ´nodeType´ not supported ´${node.nodeType}´`)
			return () => null
		}
	}
}

/**
 * Function to create a cached tagged template components namespace.
 *
 * @returns {((
 * 	template: TemplateStringsArray,
 * 	...values: unknown[]
 * ) => JSX.Element) & {
 * 	components: Record<string, JSX.ElementType>
 * 	define: (userComponents: Record<string, JSX.ElementType>) => void
 * }}
 * @url https://pota.quack.uy/XML
 */
export function XML() {
	/**
	 * Creates tagged template components.
	 *
	 * Templates are parsed as `text/xml`, so elements must be
	 * well-formed: void elements need a trailing slash (`<br/>`, `<img
	 * src=""/>`), every open tag must be closed, and attribute values
	 * must be quoted. Ill-formed input renders a `parsererror` element
	 * instead of throwing.
	 *
	 * @param {TemplateStringsArray} template
	 * @param {...unknown} values
	 * @url https://pota.quack.uy/XML
	 */
	function xml(template, ...values) {
		return compiled(template)(values)
	}

	xml.components = assign(empty(), defaultRegistry)
	/**
	 * Registers custom components that can be referenced by tag name.
	 * Must be called before the first `xml\`...`` invocation that
	 * references the new tag — once a template is compiled, its
	 * component-vs-element decisions are fixed.
	 *
	 * @param {Record<string, JSX.ElementType>} userComponents
	 */
	xml.define = userComponents => {
		for (const name of keys(userComponents)) {
			xml.components[name] = userComponents[name]
		}
	}

	/**
	 * Hoist the per-instance template cache out of the per-render hot
	 * path — `compile(xml)` is memoized but still costs a WeakMap
	 * lookup; storing the inner directly skips that on every render.
	 */
	const compiled = compile(xml)

	return xml
}

export const xml = XML()
