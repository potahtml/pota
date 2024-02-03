import { createElement } from './elements.js'

export function parse(content) {
	const template = createElement('template')

	template.innerHTML = content
		// avoid double br when self-closing
		.replace(/<br\s*\/\s*>/g, '<br>')
		// self-close
		.replace(/<([a-z-]+)([^/>]*)\/\s*>/gi, '<$1 $2></$1>')

	/*
	if (/\/\s*>/.test(content))
		throw new Error('self-close tag forbidden `' + content + '`')*/

	return template.content
}
