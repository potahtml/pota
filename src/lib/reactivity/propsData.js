import { empty } from '#std'

// it cannot be a symbol else it will be lost when merging or spliting props

const $data = '$data'

export function propsData(props, data) {
	if (!props[$data]) {
		props[$data] = empty()
	}
	const meta = props[$data]
	for (const key of data) {
		meta[key] = props[key]
		props[key] = null
	}
	return props
}
