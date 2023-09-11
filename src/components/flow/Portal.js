// portal childrens to a new location
import { insert } from '#main'

export function Portal(props) {
	insert(props.children, props.mount)
	return null
}
