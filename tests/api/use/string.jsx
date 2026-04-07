/** @jsxImportSource pota */

import { test } from '#test'

import {
	capitalizeFirstLetter,
	copyToClipboard,
	dashesToCamelCase,
	diff,
	ensureString,
	hash,
	isEmoji,
	label,
	short,
	toString,
	validateEmail,
	validatePassword,
	wholeNumber,
} from 'pota/use/string'

await test('string - dashesToCamelCase converts kebab-case', expect => {
	expect(dashesToCamelCase('hello-world-9')).toBe('helloWorld9')
	expect(dashesToCamelCase('alreadyCamel')).toBe('alreadyCamel')
})

await test('string - capitalizeFirstLetter uppercases the first character only', expect => {
	expect(capitalizeFirstLetter('hello')).toBe('Hello')
	expect(capitalizeFirstLetter('')).toBe('')
})

await test('string - label normalizes separators and spaces', expect => {
	expect(label('hello-world__again')).toBe('hello world again')
})

await test('string - short truncates long strings and leaves short ones intact', expect => {
	expect(short('x'.repeat(50))).toBe('x'.repeat(40) + '…')
	expect(short('small')).toBe('small')
	expect(short()).toBe('')
})

await test('string - ensureString and toString normalize values', expect => {
	expect(ensureString(null)).toBe('')
	expect(ensureString(0)).toBe('')
	expect(toString('  hello  ')).toBe('hello')
	expect(toString('  hello world  ', 7)).toBe('hello w')
})

await test('string - validateEmail and validatePassword return normalized values', expect => {
	expect(validateEmail('  Test@Example.com ')).toBe(
		'test@example.com',
	)
	expect(validateEmail('x')).toBe(false)
	expect(validateEmail('a@a.uy')).toBe('a@a.uy')
	expect(validatePassword(' 123456 ')).toBe('123456')
	expect(validatePassword('123')).toBe(false)
})

await test('string - wholeNumber and isEmoji cover numeric and emoji helpers', expect => {
	expect(wholeNumber(4.9)).toBe(4)
	expect(wholeNumber(-4.9)).toBe(-4)
	expect(wholeNumber(Number.NaN)).toBe(0)
	expect(isEmoji('hello 😀')).toBe(true)
	expect(isEmoji('hello')).toBe(false)
})

await test('string - hash creates deterministic digests', async expect => {
	expect(await hash('abc')).toBe(
		'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
	)
})

await test('string - copyToClipboard resolves and ignores clipboard errors', async expect => {
	const original = navigator.clipboard
	let copied = ''

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText(value) {
				copied = value
				return Promise.resolve()
			},
		},
	})

	await copyToClipboard('hello')
	expect(copied).toBe('hello')

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: {
			writeText() {
				return Promise.reject(new Error('nope'))
			},
		},
	})

	await copyToClipboard('ignored')

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: original,
	})
})

// --- diff -------------------------------------------------------------------

await test('string - diff returns annotated lines for multiline string differences', expect => {
	const a = 'line1\nline2\nline3'
	const b = 'line1\nchanged\nline3'
	const [da, db] = diff(a, b)

	// first differing line should be marked with ->
	expect(da).toContain('->')
	expect(db).toContain('->')
})

await test('string - diff returns values as-is when not both multiline strings', expect => {
	const [a, b] = diff('single', 'other')
	expect(a).toBe('single')
	expect(b).toBe('other')

	const [c, d] = diff(1, 2)
	expect(c).toBe(1)
	expect(d).toBe(2)
})

await test('string - diff returns values as-is for identical multiline strings', expect => {
	const s = 'line1\nline2'
	const [a, b] = diff(s, s)
	// both are annotated but no -> marker on first line
	expect(a.startsWith('  ')).toBe(true)
	expect(b.startsWith('  ')).toBe(true)
})

// --- additional edge cases ---------------------------------------------------

await test('string - dashesToCamelCase handles leading dash', expect => {
	expect(dashesToCamelCase('-leading')).toBe('Leading')
})

await test('string - label handles multiple consecutive separators', expect => {
	expect(label('a--b__c')).toBe('a b c')
})

await test('string - validateEmail rejects missing domain', expect => {
	expect(validateEmail('user@')).toBe(false)
	expect(validateEmail('@domain.com')).toBe(false)
})

await test('string - wholeNumber handles large integers', expect => {
	expect(wholeNumber(1000000.7)).toBe(1000000)
	expect(wholeNumber(-0)).toBe(0)
})
