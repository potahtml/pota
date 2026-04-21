/** @jsxImportSource pota */

// Tests for the `A` anchor component — anchor rendering, href
// resolution, modifier-key click suppression (meta/ctrl), prop
// forwarding, params interpolation.

import { $, test, body, microtask, sleepLong } from '#test'

import { render } from 'pota'
import { A, Route } from 'pota/components'
import { addListeners, navigateSync } from 'pota/use/location'

// disable view transitions in tests to avoid AbortError
document.startViewTransition = undefined

function goto(path) {
	const url = path.startsWith('http')
		? path
		: `${window.location.origin}${path}`
	navigateSync(url, { replace: true })
}

async function reset() {
	addListeners()
	goto('/')
	await microtask()
	document.body.innerHTML = ''
}

await test('A - renders an anchor element', async expect => {
	await reset()
	const dispose = render(
		<Route path="/start">
			<A href="/end">go</A>
		</Route>,
	)
	goto('/start')
	await microtask()
	expect($('a')).not.toBe(null)
	expect($('a').textContent).toBe('go')
	dispose()
})

await test('A - resolves href on the rendered anchor', async expect => {
	await reset()
	const dispose = render(
		<Route path="/start">
			<A href="/destination">link</A>
		</Route>,
	)
	goto('/start')
	await microtask()
	expect($('a').getAttribute('href')).toBe('/destination')
	dispose()
})

// metaKey/ctrlKey clicks: pota's onLinkClick must NOT call
// preventDefault, so the browser performs its native action (open
// in new tab, etc.). The contract is "pota doesn't suppress" — spy
// on preventDefault to verify directly. Also attach a separate
// preventDefault interceptor (registered AFTER pota's listener so
// it fires later in bubble order) that records whether pota already
// prevented and stops the browser from performing the real
// navigation that would tear down the test page.

function dispatchAndCheck(target, eventInit) {
	let potaPrevented = false
	const intercept = e => {
		potaPrevented = e.defaultPrevented
		e.preventDefault()
	}
	document.addEventListener('click', intercept)
	target.dispatchEvent(
		new MouseEvent('click', { ...eventInit, cancelable: true }),
	)
	document.removeEventListener('click', intercept)
	return potaPrevented
}

await test('A - does not navigate when metaKey is held', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/start$">
				<A href="/end">go</A>
			</Route>
			<Route path="/end$">end</Route>
		</>,
	)
	goto('/start')
	await microtask()

	const potaPrevented = dispatchAndCheck(
		document.querySelector('a'),
		{
			bubbles: true,
			metaKey: true,
		},
	)
	expect(potaPrevented).toBe(false)

	dispose()
})

await test('A - does not navigate when ctrlKey is held', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/start$">
				<A href="/end">go</A>
			</Route>
			<Route path="/end$">end</Route>
		</>,
	)
	goto('/start')
	await microtask()

	const potaPrevented = dispatchAndCheck(
		document.querySelector('a'),
		{
			bubbles: true,
			ctrlKey: true,
		},
	)
	expect(potaPrevented).toBe(false)

	dispose()
})

await test('A - does not pass params prop to rendered anchor', async expect => {
	await reset()
	const dispose = render(
		<Route path="/page">
			<A href="/target" params={{ id: '1' }}>
				link
			</A>
		</Route>,
	)
	goto('/page')
	await microtask()
	expect($('a').hasAttribute('params')).toBe(false)
	dispose()
})

await test('A - forwards extra props to anchor', async expect => {
	await reset()
	const dispose = render(
		<Route path="/page">
			<A href="/target" class="my-link">
				link
			</A>
		</Route>,
	)
	goto('/page')
	await microtask()
	expect($('a.my-link')).not.toBe(null)
	dispose()
})

await test('A - renders anchor with interpolated params', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users">
			<A href="/users/:id" params={{ id: '5' }}>
				link
			</A>
		</Route>,
	)
	goto('/users')
	await microtask()

	const anchor = $('a')
	expect(anchor).not.toBe(null)
	expect(anchor.getAttribute('href')).toInclude('5')

	dispose()
})

// onLinkClick rejects anchors with target (would open a new tab).
// Exercises the validation early-return branch in
// src/use/location.js onLinkClick.

await test('A - click is ignored when anchor has target attribute', async expect => {
	await reset()
	const a = document.createElement('a')
	a.href = '/target-ignored'
	a.target = '_blank'
	a.textContent = 'external'
	document.body.appendChild(a)

	const potaPrevented = dispatchAndCheck(a, { bubbles: true })
	expect(potaPrevented).toBe(false)
	a.remove()
})

// Click without modifier keys: pota's onLinkClick must call
// preventDefault and navigate. Exercises the happy-path tail of
// `onLinkClick` in src/use/location.js (composedPath, validation,
// preventDefault, navigate).

await test('A - click without modifiers triggers pota navigation', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/start$">
				<A href="/end">go</A>
			</Route>
			<Route path="/end$">end</Route>
		</>,
	)
	goto('/start')
	await microtask()

	const potaPrevented = dispatchAndCheck(document.querySelector('a'), {
		bubbles: true,
	})
	expect(potaPrevented).toBe(true)

	await sleepLong()
	expect(body()).toInclude('end')

	dispose()
})
