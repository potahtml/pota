// portal childrens to a new location
import { insert } from '#main'

export function Portal(props, children) {
	insert(children, props.mount)
	return null
}
