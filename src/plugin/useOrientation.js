import { effect, root } from '../lib/reactive.js'

import { documentSize, useDocumentSize } from './useDocumentSize.js'

import { SignalEmitter } from '../lib/classes/SignalEmitter.js'

function value(e) {
	return e.width >= e.height ? 'horizontal' : 'vertical'
}

export const { on: onOrientation, use: useOrientation } =
	new SignalEmitter({
		on: dispatch => {
			const size = useDocumentSize()

			return root(dispose => {
				effect(() => dispatch(value(size())))
				return dispose
			})
		},
		initialValue: () => value(documentSize()),
	})
