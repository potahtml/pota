import { Component } from '../../../core/renderer.js'
import { cleanLink } from '../../../use/url.js'

import { Link } from './link.js'

/**
 * Inline-autoplay muted video, wrapped in a new-tab link to the
 * source. `scroll` fires once the video is playable.
 *
 * @type {Component<{ url: string; scroll?: () => void }>}
 */
export const Video = props =>
	Component(Link, {
		url: props.url,
		blank: true,
		children: Component('video', {
			loop: true,
			autoplay: true,
			muted: true,
			src: cleanLink(props.url),
			title: props.url,
			'on:canplay': props.scroll,
			children: Component('source', { src: cleanLink(props.url) }),
		}),
	})
