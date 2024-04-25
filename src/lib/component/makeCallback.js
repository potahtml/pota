import { flat, isArray, isFunction } from '../std/@main.js'
import { isReactive } from '../reactivity/isReactive.js'
import { markComponent } from './markComponent.js'
import { untrack } from '../reactivity/reactive.js'

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

	const callbacks = !isArray(children)
		? callback(children)
		: children.map(callback)

	return !isArray(children)
		? markComponent((...args) => callbacks(args))
		: markComponent((...args) =>
				callbacks.map(callback => callback(args)),
			)
}

const callback = child =>
	isFunction(child)
		? isReactive(child)
			? args => {
					/**
					 * The function inside the `for` is saved in a signal. The
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
					return isFunction(r)
						? isReactive(r)
							? r()
							: untrack(() => r(...args))
						: r
				}
			: args => untrack(() => child(...args))
		: () => child
