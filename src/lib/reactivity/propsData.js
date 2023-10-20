import { empty } from '#std'

/**
 * It moves props to "meta" place
 *
 * @param {pota.props} props
 * @param {string[]} data
 * @returns {pota.props}
 */
export function propsData(props, data) {
	if (!props.$data) {
		props.$data = empty()
	}
	for (const key of data) {
		props.$data[key] = props[key]
		props[key] = null
	}
	return props
}
