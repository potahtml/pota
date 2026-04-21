/** @jsxImportSource pota */
// Renderer edge cases not reachable through the JSX partial fast
// path — these exercise Component, Factory, withXMLNS, and
// createChildren branches directly.

import { test, body, $ } from '#test'

import { Component, Fragment, render } from 'pota'

// Component(Fragment, { children }) short-circuits and returns the
// children untouched (src/core/renderer.js Component's Fragment
// branch).

await test('Component(Fragment, props) returns props.children directly', expect => {
	const child = 'hello-fragment'
	const result = Component(Fragment, { children: child })
	expect(result).toBe(child)
})

// Factory's default branch — value is neither string, function,
// nor Element — wraps it in markComponent(() => value) so
// rendering returns the value as-is.

await test('Component(plainObject) renders nothing (Factory default branch)', expect => {
	const weird = { notAnElement: true }
	const instance = Component(weird)
	const dispose = render(instance)
	// plain object is stringified by the child pipeline
	expect(body()).toInclude('[object Object]')
	dispose()
})

// A dynamic <foreignObject> forces createTag -> withXMLNS(undefined,
// fn, 'foreignObject'), hitting the nsContext branch that flips
// children back to HTML xmlns.

await test('withXMLNS resets to HTML inside a dynamic foreignObject', expect => {
	const foreignObjectElement = () =>
		Component('foreignObject', {
			children: Component('div', { children: 'html-inside-svg' }),
		})

	const dispose = render(
		<svg>{foreignObjectElement}</svg>,
	)
	const div = $('div')
	expect(div instanceof HTMLDivElement).toBe(true)
	expect(div.textContent).toBe('html-inside-svg')
	dispose()
})

// createChildren default branch (bigint/symbol/etc) — must call
// toString() on the value and render the result as text.

await test('createChildren renders bigint via toString', expect => {
	const dispose = render(<div>{42n}</div>)
	expect(body()).toInclude('42')
	dispose()
})

await test('createChildren renders symbol via toString', expect => {
	const dispose = render(<div>{Symbol('sym-x')}</div>)
	expect(body()).toInclude('sym-x')
	dispose()
})

// Object.create(null) has no `toString` — createChildren must fall
// back to stringify() instead of calling child.toString().

await test('createChildren renders null-prototype object via stringify fallback', expect => {
	const bare = Object.create(null)
	bare.label = 'bare-object'
	const dispose = render(<div>{bare}</div>)
	// stringify should produce a JSON-ish form containing "bare-object"
	expect(body()).toInclude('bare-object')
	dispose()
})
