/** @jsxImportSource pota */
// Tests for pota/use/favicon: setFaviconBadge updates the icon link
// to a data URL, no-ops when no link is present, and useFaviconBadge
// reacts to signal changes.

import { test, microtask, sleep } from '#test'

import { root, signal } from 'pota'
import { setFaviconBadge, useFaviconBadge } from 'pota/use/favicon'

// 1x1 transparent PNG. Same-origin (data:) so canvas isn't tainted.
const TINY_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const installLink = () => {
	const link = document.createElement('link')
	link.rel = 'icon'
	link.href = TINY_PNG
	document.head.appendChild(link)
	return link
}

// wait for an image-load roundtrip; the favicon module loads the
// base icon asynchronously before drawing.
const settle = () => sleep(50)

await test('favicon - setFaviconBadge with no <link rel="icon"> is a silent no-op', async expect => {
	// no link installed
	let threw = false
	try {
		await setFaviconBadge('5')
	} catch {
		threw = true
	}
	expect(threw).toBe(false)
})

await test('favicon - setFaviconBadge rewrites link.href to a canvas data URL', async expect => {
	const link = installLink()
	try {
		await setFaviconBadge('9')
		await settle()
		expect(link.href.startsWith('data:image/png')).toBe(true)
		// the rewritten URL is a fresh canvas snapshot — must differ
		// from the placeholder we installed.
		expect(link.href === TINY_PNG).toBe(false)
	} finally {
		link.remove()
	}
})

await test('favicon - setFaviconBadge(null) redraws the icon without a badge', async expect => {
	const link = installLink()
	try {
		await setFaviconBadge('1')
		await settle()
		const withBadge = link.href

		await setFaviconBadge(null)
		await settle()
		const cleared = link.href

		expect(withBadge.startsWith('data:image/png')).toBe(true)
		expect(cleared.startsWith('data:image/png')).toBe(true)
		expect(cleared === withBadge).toBe(false)
	} finally {
		link.remove()
	}
})

await test('favicon - useFaviconBadge reapplies when the badge signal changes', async expect => {
	const link = installLink()
	const s = signal('1')

	try {
		await root(async dispose => {
			useFaviconBadge(s.read)
			await settle()
			const first = link.href
			expect(first.startsWith('data:image/png')).toBe(true)

			s.write('99')
			await microtask()
			await settle()
			const second = link.href
			expect(second.startsWith('data:image/png')).toBe(true)
			expect(second === first).toBe(false)

			dispose()
		})
	} finally {
		link.remove()
	}
})
