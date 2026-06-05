import { Component } from '../core/renderer.js'
import { document } from '../use/dom.js'
import { Portal } from './Portal.js'

/**
 * Mounts children on `document.head`
 *
 * @type {FlowComponent}
 * @url https://pota.quack.uy/components/Head
 */
export const Head = props =>
	Component(Portal, {
		mount: document.head,
		children: props.children,
	})
