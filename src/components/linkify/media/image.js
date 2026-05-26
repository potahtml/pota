import { Component } from '../../../core/renderer.js'
import { cleanLink } from '../../../use/url.js'

import { Link } from './link.js'

/**
 * Image wrapped in a new-tab link to the source. `scroll` fires once
 * the image has loaded.
 *
 * @type {Component<{ url: string; scroll?: () => void }>}
 */
export const Image = props =>
	Component(Link, {
		url: props.url,
		blank: true,
		children: Component('img', {
			src: cleanLink(props.url),
			alt: '',
			title: props.url,
			'on:load': props.scroll,
		}),
	})
