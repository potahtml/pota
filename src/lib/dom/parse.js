import { weakStore } from '../std/weakStore.js'
import { createElement, createElementNS } from './elements.js'

export const id = 'pota'
export const tag = `<pota></pota>`

const [get, set] = weakStore()

export function parse(content) {
	let cached = get(content)

	if (!cached) {
		const template = createElement('template')

		template.innerHTML = content
			.join(tag)
			.replaceAll(`"${tag}"`, `"${id}"`)
			// avoid double br when self-closing
			.replace(/<br\s*\/\s*>/g, '<br>')
			// self-close
			.replace(/<([a-z-]+)([^/>]*)\/\s*>/gi, '<$1 $2></$1>')

		cached = template.content
		set(content, cached)
	}

	return cached
}

const Clones = new Map()

export function cloneNode(content, xmlns) {
	const cached = Clones.get(content)

	if (cached) {
		return cached.cloneNode(true)
	}

	let template = xmlns
		? createElementNS(xmlns, 'template')
		: createElement('template')

	template.innerHTML = content

	template = xmlns
		? template.firstChild
		: template.content.childNodes.length === 1
			? template.content.firstChild
			: template.content

	Clones.set(content, template)

	return template.cloneNode(true)
}
