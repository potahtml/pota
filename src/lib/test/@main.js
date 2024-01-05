import { contextSimple } from '../std/contextSimple.js'

const useContext = contextSimple()

let testTitle = ''
let describeTitle = ''

export function describe(title, fn) {
	describeTitle = title
	fn()
}

export function test(title, fn) {
	testTitle = title
	console.log(
		'%c' + describeTitle + ' -> ' + testTitle,
		'font-weight:bold;color:green',
	)

	useContext(
		{ assertionsGot: 0, assertionsExpected: undefined },
		() => {
			// test function
			fn()

			const context = useContext()

			if (
				context.assertionsExpected !== undefined &&
				context.assertionsExpected !== context.assertionsGot
			) {
				error(
					'expected assertions failed',
					'expected',
					context.assertionsExpected,
					'got',
					context.assertionsGot,
				)
			}
		},
	)
}

export function expect(value) {
	const test = {
		toBe: (equals, expected) => {
			pass(expected, value, equals)
		},
		toBeUndefined(equals) {
			pass(undefined, value, equals)
		},
		toJSONEqual(equals, expected) {
			pass(JSON.stringify(expected), JSON.stringify(value), equals)
		},
		not: {},
	}

	for (const key in test) {
		if (key !== 'not') {
			test.not[key] = test[key].bind(null, false)
			test[key] = test[key].bind(null, true)
		}
	}
	return test
}

export const assertions = num => {
	const context = useContext()
	context.assertionsExpected = num
}

function pass(expected, value, equals) {
	if (
		(expected !== value && equals) ||
		(expected === value && !equals)
	) {
		error(
			'expected value was',
			'`',
			expected,
			'`',
			'got instead',
			'`',
			value,
			'`',
		)
	} else {
		const context = useContext()
		context.assertionsGot++
	}
}

function error(...args) {
	console.error(describeTitle + ' -> ' + testTitle + '\n', ...args)
}
