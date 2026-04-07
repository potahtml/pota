/** @jsxImportSource pota */

// Tests for the Babel preset JSX transform: spread merging, prop
// ordering, static values, namespaced props, and async components.

import { body, test } from '#test'
import { render } from 'pota'
import 'pota/use/bind'

const style = { style: 'border:black', something: { value: 1 + 1 } }
const style2 = {}

const spread1 = (
	<div
		style="border: blue;"
		{...style}
		style="border: red;"
		prop:not-identifier={/* @static */ ' '.trim()}
	/>
)
const spread2 = <div {...style} />
const spread3 = (
	<div
		{...style}
		{...{ ...style, ...style2 }}
		style="border: orange;"
		nada:nada="test"
	/>
)
const spread4 = <div {...{ ...style, ...style2 }} />

await test('transform - spread1 renders with later explicit props winning', expect => {
	const dispose = render(spread1)

	expect(body()).toBe(
		'<div something="[object Object]" style="border: red;"></div>',
	)

	dispose()
})

await test('transform - spread2 renders spread object props', expect => {
	const dispose = render(spread2)

	expect(body()).toBe(
		'<div something="[object Object]" style="border: black;"></div>',
	)

	dispose()
})

await test('transform - spread3 merges nested spread expressions and explicit props', expect => {
	const dispose = render(spread3)

	expect(body()).toBe(
		'<div something="[object Object]" nada:nada="test" style="border: orange;"></div>',
	)

	dispose()
})

await test('transform - spread4 renders merged spread object values', expect => {
	const dispose = render(spread4)

	expect(body()).toBe(
		'<div something="[object Object]" style="border: black;"></div>',
	)

	dispose()
})
