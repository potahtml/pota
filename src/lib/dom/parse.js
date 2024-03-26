import { weakStore } from '../std/weakStore.js'
import { createElement } from './elements.js'

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

		/*
		if (/\/\s*>/.test(content))
			throw new Error('self-close tag forbidden `' + content + '`')
		*/

		cached = template.content
		set(content, cached)
	}

	return cached
}
