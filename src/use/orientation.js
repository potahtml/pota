import { effect, root } from '../lib/reactive.js'

import { documentSize, useDocumentSize } from './resize.js'

import { Emitter } from './emitter.js'

/** @param {{width:number, height:number}} e*/
function value(e) {
	return e.width >= e.height ? 'horizontal' : 'vertical'
}

export const { on: onOrientation, use: useOrientation } =
	new Emitter({
		on: dispatch => {
			const size = useDocumentSize()

			return root(dispose => {
				effect(() => dispatch(value(size())))
				return dispose
			})
		},
		initialValue: () => value(documentSize()),
	})
