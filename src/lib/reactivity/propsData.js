import { empty } from '#std'

// it moves some magic props to a "hidden" place (props.$data)

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
