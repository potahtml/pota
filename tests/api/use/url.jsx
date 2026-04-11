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

await test('url - paramsRegExp matches :param patterns in paths', expect => {
	const matches = '/users/:id/posts/:postId'.match(paramsRegExp)
	expect(matches).toEqual([':id', ':postId'])
})

await test('url - paramsRegExp does not match non-param colons', expect => {
	paramsRegExp.lastIndex = 0
	const matches = 'http://example.com'.match(paramsRegExp)
	expect(matches).toBe(null)
})

// --- cleanLink with no trailing punctuation is unchanged -------------

await test('url - cleanLink leaves clean urls unchanged', expect => {
	expect(cleanLink('https://example.com')).toBe('https://example.com')
	expect(cleanLink('https://example.com/path')).toBe(
		'https://example.com/path',
	)
})

// --- replaceParams with all params supplied -------------------------

await test('url - replaceParams substitutes all params when every slot has a value', expect => {
	expect(
		replaceParams('/a/:x/b/:y', { x: '1', y: '2' }),
	).toBe('/a/1/b/2')
})

// --- replaceParams with null params returns unchanged ---------------

await test('url - replaceParams with null params returns the href unchanged', expect => {
	expect(replaceParams('/u/:id', null)).toBe('/u/:id')
})

// --- replaceParams with undefined params returns unchanged ---------

await test('url - replaceParams with no params argument returns the href unchanged', expect => {
	expect(replaceParams('/u/:id')).toBe('/u/:id')
})

// --- encodeURIComponent encodes special characters ----------------

await test('url - encodeURIComponent encodes reserved characters', expect => {
	expect(encodeURIComponent('a b')).toBe('a%20b')
	expect(encodeURIComponent('a&b')).toBe('a%26b')
	expect(encodeURIComponent('a=b')).toBe('a%3Db')
})

// --- hasProtocol recognizes common schemes ------------------------

await test('url - hasProtocol recognizes ftp, ws, and wss schemes', expect => {
	expect(hasProtocol('ftp://example.com')).toBe(true)
	expect(hasProtocol('ws://example.com')).toBe(true)
	expect(hasProtocol('wss://example.com')).toBe(true)
})

// --- isAbsolute with just a slash is true ------------------------

await test('url - isAbsolute returns true for a single slash', expect => {
	expect(isAbsolute('/')).toBe(true)
})

// --- isRelative with ./path ------------------------------------

await test('url - isRelative returns true for paths with ./ prefix', expect => {
	expect(isRelative('./page.html')).toBe(true)
	expect(isRelative('../parent')).toBe(true)
})

// --- isHash distinguishes # from ## edge cases ------------------

await test('url - isHash is true for exactly #', expect => {
	expect(isHash('#')).toBe(true)
})

// --- removeNestedProtocol leaves flat protocol alone ------------

await test('url - removeNestedProtocol leaves a plain protocol unchanged', expect => {
	expect(removeNestedProtocol('http://example.com')).toBe(
		'http://example.com',
	)
})
