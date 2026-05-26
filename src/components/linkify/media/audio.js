import { Component } from '../../../core/renderer.js'
import { cleanLink } from '../../../use/url.js'

/**
 * Audio player. `scroll` fires once the resource is playable, so the
 * surrounding layout can scroll it into view.
 *
 * @type {Component<{ url: string; scroll?: () => void }>}
 */
export const Audio = props =>
	Component('audio', {
		controls: true,
		src: cleanLink(props.url),
		title: props.url,
		'on:canplay': props.scroll,
		children: Component('source', { src: cleanLink(props.url) }),
	})
