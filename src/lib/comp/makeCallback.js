import { untrack } from '../reactivity/primitives/solid.js'
import { flat, isArray, isFunction } from '../std/@main.js'
import { isReactive } from '../reactivity/isReactive.js'
import { markComponent } from './markComponent.js'

/**
 * Makes of `children` a function. Reactive children will run as is,
 * non-reactive children will run untracked, regular children will
 * just return.
 *
 * @param {Children} children
 * @returns {Function}
 */
export function makeCallback(children) {
	/**
	 * When children is an array, as in >${[0, 1, 2]}< then children
	 * will end as `[[0, 1, 2]]`, so flat it
	 */
	children = isArray(children) ? flat(children) : children
	const asArray = isArray(children)
	const callbacks = !asArray
		? callback(children)
		: children.map(callback)
	return !asArray
		? markComponent((...args) => callbacks(args))
		: markComponent((...args) =>
				callbacks.map(callback => callback(args)),
			)
}

const callback = child =>
	isReactive(child)
		? args => {
				/**
				 * The function inside the `for` is saved inside a signal. The
				 * result of the signal is our callback
				 *
				 * ```js
				 * htmlEffect(
				 * 	html =>
				 * 		html`<table>
				 * 			<tr>
				 * 				<th>name</th>
				 * 			</tr>
				 * 			<for each="${tests}">
				 * 				${item =>
				 * 					html`<tr>
				 * 						<td>${item.name}</td>
				 * 					</tr>`}
				 * 			</for>
				 * 		</table>`,
				 * )
				 * ```
				 */
				const r = child()
				return isFunction(r) ? untrack(() => r(...args)) : r
			}
		: isFunction(child)
			? args => untrack(() => child(...args))
			: () => child
