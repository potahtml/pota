import { Component } from '../../../core/renderer.js'
import { cleanLink } from '../../../use/url.js'

/**
 * Anchor with same-origin detection. Off-origin links open in a new
 * tab; explicit `blank` forces it.
 *
 * @type {Component<{
 * 	url: string
 * 	blank?: boolean
 * 	children?: JSX.Element
 * }>}
 */
export const Link = props =>
	Component('a', {
		href: cleanLink(props.url),
		title: props.url,
		target:
			props.blank ||
			props.url.indexOf(
				window.location.protocol + '//' + window.location.host + '/',
			) !== 0
				? '_blank'
				: undefined,
		rel: 'noopener external',
		children: props.children || props.url,
	})
