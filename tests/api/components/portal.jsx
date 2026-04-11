/** @jsxImportSource pota */

// Tests for the Portal component: mounting into a custom target,
// reactive content, nested portals, and cleanup on dispose.
import { test, body } from '#test'

import { render, signal } from 'pota'
import { Portal } from 'pota/components'

// Portal renders children into mount, not into body directly.
// body() will include the mount element if it was appended to document.body.
// Test mount.innerHTML for portal content, not body().

// basic - renders into mount, not body

await test('Portal - renders children into mount element', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<p>portaled</p>
		</Portal>,
	)
	expect(mount.innerHTML).toBe('<p>portaled</p>')
	dispose()
	mount.remove()
})

await test('Portal - does not render into body directly', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<p id="portal-content">portaled</p>
		</Portal>,
	)
	// content is inside mount, which is inside body
	// but the portal content itself is inside mount, not as a direct body child
	expect(document.getElementById('portal-content')).not.toBe(null)
	dispose()
	mount.remove()
})

await test('Portal - renders text into mount', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(<Portal mount={mount}>hello</Portal>)
	expect(mount.innerHTML).toBe('hello')
	dispose()
	mount.remove()
})

await test('Portal - renders multiple children into mount', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<p>a</p>
			<p>b</p>
		</Portal>,
	)
	expect(mount.innerHTML).toBe('<p>a</p><p>b</p>')
	dispose()
	mount.remove()
})

await test('Portal - renders into a specific element', expect => {
	const mount = document.createElement('section')
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<span>inside section</span>
		</Portal>,
	)
	expect(mount.querySelector('span').textContent).toBe(
		'inside section',
	)
	dispose()
	mount.remove()
})

// without wrapper

await test('Portal - does not wrap children in extra element', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<p>a</p>
			<p>b</p>
		</Portal>,
	)
	// direct children, no wrapper div
	expect(mount.children.length).toBe(2)
	dispose()
	mount.remove()
})

// reactive children

await test('Portal - reactive children update in mount', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const [text, setText] = signal('initial')
	const dispose = render(
		<Portal mount={mount}>
			<p>{text}</p>
		</Portal>,
	)
	expect(mount.innerHTML).toBe('<p>initial</p>')
	setText('updated')
	expect(mount.innerHTML).toBe('<p>updated</p>')
	dispose()
	mount.remove()
})

await test('Portal - signal-driven children appear in mount', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const [show, setShow] = signal(true)
	const dispose = render(
		<Portal mount={mount}>
			{() => (show() ? <p>visible</p> : null)}
		</Portal>,
	)
	expect(mount.querySelector('p')).not.toBe(null)
	setShow(false)
	expect(mount.querySelector('p')).toBe(null)
	dispose()
	mount.remove()
})

// portal to document.body

await test('Portal - can portal to document.body explicitly', expect => {
	const container = document.createElement('div')
	document.body.appendChild(container)

	// render inside a container but portal out to body
	const targetDiv = document.createElement('div')
	targetDiv.id = 'portal-target'
	document.body.appendChild(targetDiv)

	const dispose = render(
		<Portal mount={targetDiv}>
			<p id="escaped">escaped</p>
		</Portal>,
	)
	expect(document.getElementById('escaped')).not.toBe(null)
	expect(targetDiv.querySelector('#escaped')).not.toBe(null)

	dispose()
	targetDiv.remove()
	container.remove()
})

// cleanup

await test('Portal - cleans up children from mount on dispose', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<p>content</p>
		</Portal>,
	)
	expect(mount.innerHTML).toBe('<p>content</p>')
	dispose()
	expect(mount.innerHTML).toBe('')
	mount.remove()
})

// component children

await test('Portal - renders function component inside mount', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	function MyComp() {
		return <b>component</b>
	}
	const dispose = render(
		<Portal mount={mount}>
			<MyComp />
		</Portal>,
	)
	expect(mount.innerHTML).toBe('<b>component</b>')
	dispose()
	mount.remove()
})

// nested portals

await test('Portal - nested portals each render into own mount', expect => {
	const mountA = document.createElement('div')
	const mountB = document.createElement('div')
	document.body.appendChild(mountA)
	document.body.appendChild(mountB)

	const dispose = render(
		<Portal mount={mountA}>
			<p>in A</p>
			<Portal mount={mountB}>
				<p>in B</p>
			</Portal>
		</Portal>,
	)
	expect(mountA.querySelector('p').textContent).toBe('in A')
	expect(mountB.querySelector('p').textContent).toBe('in B')
	dispose()
	mountA.remove()
	mountB.remove()
})

// --- portal with no children ------------------------------------------

await test('Portal - renders nothing into mount when children are empty', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(<Portal mount={mount}></Portal>)

	expect(mount.innerHTML).toBe('')

	dispose()
	mount.remove()
})

// --- portal with null/undefined children ------------------------------

await test('Portal - null children render nothing into mount', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(<Portal mount={mount}>{null}</Portal>)

	expect(mount.innerHTML).toBe('')

	dispose()
	mount.remove()
})

// --- portal with number children renders as text ---------------------

await test('Portal - number children render as text', expect => {
	const mount = document.createElement('div')
	document.body.appendChild(mount)

	const dispose = render(<Portal mount={mount}>{42}</Portal>)

	expect(mount.textContent).toBe('42')

	dispose()
	mount.remove()
})

// --- portal preserves mount's other children -------------------------

await test('Portal - disposing only removes portaled nodes, not pre-existing mount content', expect => {
	const mount = document.createElement('div')
	const preExisting = document.createElement('p')
	preExisting.textContent = 'kept'
	mount.appendChild(preExisting)
	document.body.appendChild(mount)

	const dispose = render(
		<Portal mount={mount}>
			<span>added</span>
		</Portal>,
	)

	expect(mount.querySelector('span')).not.toBe(null)
	expect(mount.querySelector('p').textContent).toBe('kept')

	dispose()

	// pre-existing node still there
	expect(mount.querySelector('p').textContent).toBe('kept')
	// portaled nodes gone
	expect(mount.querySelector('span')).toBe(null)

	mount.remove()
})
