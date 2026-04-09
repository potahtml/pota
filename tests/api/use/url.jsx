/** @jsxImportSource pota */
// Tests for pota/use/url: cleanLink, encode/decodeURIComponent,
// protocol/path helpers, isExternal, replaceParams, paramsRegExp.

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
	paramsRegExp,
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

await test('url - isHash returns false for non-hash strings', expect => {
	expect(isHash('/path')).toBe(false)
	expect(isHash('http://example.com')).toBe(false)
	expect(isHash('')).toBe(false)
})

await test('url - isRelative returns false for absolute paths', expect => {
	expect(isRelative('/absolute')).toBe(false)
	expect(isRelative('https://example.com')).toBe(false)
})

await test('url - isFileProtocol returns false for http', expect => {
	expect(isFileProtocol('http://example.com')).toBe(false)
	expect(isFileProtocol('https://example.com')).toBe(false)
})

await test('url - cleanLink trims multiple trailing punctuation types', expect => {
	expect(cleanLink('https://example.com.')).toBe(
		'https://example.com',
	)
	expect(cleanLink('https://example.com"')).toBe(
		'https://example.com',
	)
})

await test('url - replaceParams with empty params object returns href unchanged', expect => {
	expect(replaceParams('/users/:id', {})).toBe('/users/:id')
})

await test('url - isExternal handles partial origin matches correctly', expect => {
	// e.g. origin is localhost:3000, should not match localhost:30001
	expect(
		isExternal(`${window.location.origin}/subpath`),
	).toBe(false)
})

await test('url - paramsRegExp matches :param patterns in paths', expect => {
	const matches = '/users/:id/posts/:postId'.match(paramsRegExp)
	expect(matches).toEqual([':id', ':postId'])
})

await test('url - paramsRegExp does not match non-param colons', expect => {
	paramsRegExp.lastIndex = 0
	const matches = 'http://example.com'.match(paramsRegExp)
	expect(matches).toBe(null)
})
