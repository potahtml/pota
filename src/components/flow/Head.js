import { Component } from '../../renderer/@renderer.js'
import { Portal } from './Portal.js'

/**
 * Mounts children on `document.head`
 *
 * @param {{
 * 	children?: Children
 * }} props
 * @returns {Children}
 */
export const Head = props =>
	Component(Portal, {
		mount: document.head,
		children: props.children,
	})
