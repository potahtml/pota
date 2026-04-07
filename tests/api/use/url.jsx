/** @jsxImportSource pota */

import { test } from '#test'

import {
	cleanLink,
	decodeURIComponent,
	encodeURIComponent,
	hasProtocol,
	isAbsolute,
	isExternal,
	isFileProtocol,
	isHash,
	isRelative,
	removeNestedProtocol,
	replaceParams,
} from 'pota/use/url'

await test('url - cleanLink trims trailing punctuation', expect => {
	expect(cleanLink('https://example.com,')).toBe(
		'https://example.com',
	)
})

await test('url - encode and decode work and malformed decode is safe', expect => {
	expect(encodeURIComponent('a b')).toBe('a%20b')
	expect(decodeURIComponent('a%20b')).toBe('a b')
	expect(decodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A')
})

await test('url - protocol and path helpers classify urls', expect => {
	expect(isFileProtocol('file:///tmp/test')).toBe(true)
	expect(hasProtocol('http://example.com')).toBe(true)
	expect(hasProtocol('blob:http://example.com')).toBe(true)
	expect(removeNestedProtocol('blob:http://example.com')).toBe(
		'http://example.com',
	)
	expect(isAbsolute('/path')).toBe(true)
	expect(isAbsolute('http://example.com')).toBe(true)
	expect(isRelative('path/to')).toBe(true)
	expect(isHash('#section')).toBe(true)
})

await test('url - isExternal compares against the current origin', expect => {
	expect(isExternal(`${window.location.origin}/page`)).toBe(false)
	expect(isExternal('https://other.example/page')).toBe(true)
})

await test('url - replaceParams only replaces defined params and encodes them', expect => {
	expect(
		replaceParams('/users/:id/:tab', {
			id: 'a b',
			tab: 'profile',
		}),
	).toBe('/users/a%20b/profile')

	expect(replaceParams('/users/:id/:tab', { id: 1 })).toBe(
		'/users/1/:tab',
	)
})
