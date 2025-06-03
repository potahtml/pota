import { document } from '../lib/std.js'
import { Component } from '../renderer.js'
import { Portal } from './Portal.js'

/**
 * Mounts children on `document.head`
 *
 * @param {{
 * 	children?: Children
 * }} props
 * @returns {Children}
 * @url https://pota.quack.uy/Components/Head
 */
export const Head = props =>
	Component(Portal, {
		mount: document.head,
		children: props.children,
	})
