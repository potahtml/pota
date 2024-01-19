import { $customElement } from '../../constants.js'

export const onPropChange = (node, value, name) =>
	$customElement in node && node.onPropChange(name, value)
