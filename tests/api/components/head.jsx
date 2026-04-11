/** @jsxImportSource pota */

// Tests for the Head component: portaling into document.head,
// singleton deduplication, stacking/restoring on dispose, reactive
// updates, conditional children, and cleanup.
import { test, body } from '#test'

import { render, root, signal } from 'pota'
import { Head } from 'pota/components'

await test('Head - portals content into document.head instead of body', expect => {
	const dispose = render(
		<Head>
			<title>My Page</title>
			<meta
				name="description"
				content="test desc"
			/>
		</Head>,
	)

	expect(document.head.querySelector('title').textContent).toBe(
		'My Page',
	)
	expect(
		document.head
			.querySelector('meta[name="description"]')
			.getAttribute('content'),
	).toBe('test desc')
	expect(body()).toBe('')

	dispose()
})

await test('Head - supports multiple tag types and cleans them up on dispose', expect => {
	const dispose = render(
		<Head>
			<link
				rel="stylesheet"
				href="/style.css"
			/>
			<script src="/app.js" />
		</Head>,
	)

	expect(
		document.head
			.querySelector('link[rel="stylesheet"]')
			.getAttribute('href'),
	).toBe('/style.css')
	expect(
		document.head.querySelector('script[src="/app.js"]'),
	).not.toBe(null)

	dispose()

	expect(document.head.querySelector('link[href="/style.css"]')).toBe(
		null,
	)
	expect(document.head.querySelector('script[src="/app.js"]')).toBe(
		null,
	)
})

await test('Head - rendering the same singleton head elements twice leaves one live node', expect => {
	const disposeA = render(
		<Head>
			<title>First</title>
			<link
				rel="canonical"
				href="/page-a"
			/>
			<meta
				name="description"
				content="old"
			/>
		</Head>,
	)
	const disposeB = render(
		<Head>
			<title>Second</title>
			<link
				rel="canonical"
				href="/page-b"
			/>
			<meta
				name="description"
				content="new"
			/>
		</Head>,
	)

	expect(document.head.querySelectorAll('title').length).toBe(1)
	expect(
		document.head.querySelectorAll('link[rel="canonical"]').length,
	).toBe(1)
	expect(
		document.head.querySelectorAll('meta[name="description"]').length,
	).toBe(1)
	expect(document.head.querySelector('title').textContent).toBe(
		'Second',
	)
	expect(
		document.head
			.querySelector('link[rel="canonical"]')
			.getAttribute('href'),
	).toBe('/page-b')
	expect(
		document.head
			.querySelector('meta[name="description"]')
			.getAttribute('content'),
	).toBe('new')

	disposeB()
	disposeA()
})

await test('Head - disposing the latest singleton render DOESNT restores the previous values', expect => {
	const disposeA = render(
		<Head>
			<title>First</title>
			<meta
				name="description"
				content="old"
			/>
		</Head>,
	)
	const disposeB = render(
		<Head>
			<title>Second</title>
			<meta
				name="description"
				content="new"
			/>
		</Head>,
	)

	expect(document.head.querySelector('title').textContent).toBe(
		'Second',
	)
	expect(
		document.head
			.querySelector('meta[name="description"]')
			.getAttribute('content'),
	).toBe('new')

	disposeB()

	expect(document.head.querySelector('title')).toBe(null)
	expect(
		document.head.querySelector('meta[name="description"]'),
	).toBe(null)

	disposeA()
})

await test('Head - independent non-singleton nodes from separate renders coexist', expect => {
	const disposeA = render(
		<Head>
			<meta
				property="og:title"
				content="Title A"
			/>
		</Head>,
	)
	const disposeB = render(
		<Head>
			<meta
				property="og:description"
				content="Description B"
			/>
		</Head>,
	)

	expect(
		document.head
			.querySelector('meta[property="og:title"]')
			.getAttribute('content'),
	).toBe('Title A')
	expect(
		document.head
			.querySelector('meta[property="og:description"]')
			.getAttribute('content'),
	).toBe('Description B')

	disposeB()
	expect(
		document.head.querySelector('meta[property="og:title"]'),
	).not.toBe(null)

	disposeA()
})

await test('Head - empty render does not modify body or head', expect => {
	const before = document.head.innerHTML
	const dispose = render(<Head />)

	expect(body()).toBe('')
	expect(document.head.innerHTML).toBe(before)

	dispose()
})

await test('Head - updates reactive text and attributes in place', expect => {
	const title = signal('Initial')
	const description = signal('first')
	const dispose = render(
		<Head>
			<title>{title.read}</title>
			<meta
				name="description"
				content={description.read}
			/>
		</Head>,
	)

	expect(document.head.querySelector('title').textContent).toBe(
		'Initial',
	)
	expect(
		document.head
			.querySelector('meta[name="description"]')
			.getAttribute('content'),
	).toBe('first')

	title.write('Updated')
	description.write('second')

	expect(document.head.querySelector('title').textContent).toBe(
		'Updated',
	)
	expect(
		document.head
			.querySelector('meta[name="description"]')
			.getAttribute('content'),
	).toBe('second')

	dispose()
})

await test('Head - conditional reactive child is removed from head when toggled off', expect => {
	const visible = signal(true)

	const dispose = render(
		<Head>
			{() => {
				return (
					visible.read() && (
						<meta
							name="robots"
							content="noindex"
						/>
					)
				)
			}}
		</Head>,
	)

	expect(document.head.querySelector('meta[name="robots"]')).not.toBe(
		null,
	)

	visible.write(false)

	expect(document.head.querySelector('meta[name="robots"]')).toBe(
		null,
	)

	dispose()
})

// --- Head with just text children renders nothing visible --------------

await test('Head - text children inside Head do not affect visible body', expect => {
	const dispose = render(<Head>some text</Head>)

	// text children don't end up in body
	expect(document.body.textContent.trim()).toBe('')

	dispose()
})

// --- Head with array of multiple link tags ----------------------------

await test('Head - array of link tags all end up in head', expect => {
	const dispose = render(
		<Head>
			{[
				<link
					rel="icon"
					href="/a.png"
				/>,
				<link
					rel="alternate"
					href="/feed.xml"
				/>,
			]}
		</Head>,
	)

	expect(
		document.head.querySelector('link[href="/a.png"]'),
	).not.toBe(null)
	expect(
		document.head.querySelector('link[href="/feed.xml"]'),
	).not.toBe(null)

	dispose()

	expect(document.head.querySelector('link[href="/a.png"]')).toBe(null)
	expect(document.head.querySelector('link[href="/feed.xml"]')).toBe(
		null,
	)
})

