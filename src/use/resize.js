import { window } from '../lib/std.js'
import { documentElement } from './dom.js'
import { Emitter } from './emitter.js'
import {
	addEventNative,
	passiveEvent,
	removeEventNative,
} from './event.js'

/**
 * Returns the viewport dimensions of the document element.
 *
 * @returns {{ width: number; height: number }}
 */
export const documentSize = () => ({
	width: documentElement.clientWidth,
	height: documentElement.clientHeight,
})

export const { on: onDocumentSize, use: useDocumentSize } =
	new Emitter({
		on: dispatch => {
			const handler = passiveEvent(() => dispatch(documentSize()))

			addEventNative(window, 'resize', handler)

			return () => {
				removeEventNative(window, 'resize', handler)
			}
		},
		initialValue: documentSize,
	})
