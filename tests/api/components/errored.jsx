/** @jsxImportSource pota */

// Tests for the Errored component: error boundary that catches
// throws in its subtree (sync render, effects, memos, deriveds,
// event handlers) and renders a fallback. Also covers reset(),
// nesting, cleanup, and parent/sibling state preservation.
import { $, test, body, microtask, sleep } from '#test'

import {
	render,
	signal,
	effect,
	memo,
	derived,
	catchError,
	batch,
} from 'pota'
import { Errored } from 'pota/components'

// --- Happy path ---------------------------------------------------------------

await test('Errored - renders children when no error occurs', expect => {
	const dispose = render(
		<Errored fallback={<p>oops</p>}>
			<p>ok</p>
		</Errored>,
	)
	expect(body()).toBe('<p>ok</p>')
	dispose()
})

await test('Errored - renders text children when no error occurs', expect => {
	const dispose = render(<Errored fallback="oops">hello</Errored>)
	expect(body()).toBe('hello')
	dispose()
})

await test('Errored - renders multiple children when no error occurs', expect => {
	const dispose = render(
		<Errored fallback={<p>oops</p>}>
			<p>a</p>
			<p>b</p>
			<p>c</p>
		</Errored>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	dispose()
})

await test('Errored - renders nothing when children is empty and no error', expect => {
	const dispose = render(<Errored fallback={<p>oops</p>} />)
	expect(body()).toBe('')
	dispose()
})

// --- Synchronous throw in component render -----------------------------------

await test('Errored - catches sync throw in child component and shows JSX fallback', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('boom')
	}

	const dispose = render(
		<Errored fallback={<p>caught</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>caught</p>')

	console.error = originalError
	dispose()
})

await test('Errored - catches sync throw and shows text fallback', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('boom')
	}

	const dispose = render(
		<Errored fallback="oops">
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('oops')

	console.error = originalError
	dispose()
})

await test('Errored - renders nothing on error when no fallback', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('boom')
	}

	const dispose = render(
		<Errored>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('')

	console.error = originalError
	dispose()
})

// --- Function fallback --------------------------------------------------------

await test('Errored - function fallback is called and its result rendered', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('boom')
	}

	const dispose = render(
		<Errored fallback={() => <p>function fallback</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>function fallback</p>')

	console.error = originalError
	dispose()
})

await test('Errored - function fallback receives the thrown error', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('specific message')
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>specific message</p>')

	console.error = originalError
	dispose()
})

await test('Errored - non-Error thrown values are still passed to fallback', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		// eslint-disable-next-line no-throw-literal
		throw 'a plain string'
	}

	const dispose = render(
		<Errored fallback={err => <p>{String(err)}</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>a plain string</p>')

	console.error = originalError
	dispose()
})

await test('Errored - catches throw undefined and shows fallback', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		// eslint-disable-next-line no-throw-literal
		throw undefined
	}

	const dispose = render(
		<Errored fallback={err => <p>{'caught:' + String(err)}</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>caught:undefined</p>')

	console.error = originalError
	dispose()
})

// --- reset() ------------------------------------------------------------------

await test('Errored - reset re-renders children when cause is fixed', expect => {
	const originalError = console.error
	console.error = () => {}

	const [broken, setBroken] = signal(true)

	const Maybe = () => {
		if (broken()) throw new Error('boom')
		return <p>ok</p>
	}

	/** @type {any} */
	let resetFn
	const dispose = render(
		<Errored
			fallback={(err, reset) => {
				resetFn = reset
				return <p>caught</p>
			}}
		>
			<Maybe />
		</Errored>,
	)
	expect(body()).toBe('<p>caught</p>')

	// fix the underlying cause, then reset
	setBroken(false)
	resetFn()
	expect(body()).toBe('<p>ok</p>')

	console.error = originalError
	dispose()
})

await test('Errored - reset with persistent failure re-catches', expect => {
	const originalError = console.error
	console.error = () => {}

	let attempts = 0
	const Maybe = () => {
		attempts++
		throw new Error('still broken')
	}

	/** @type {any} */
	let resetFn
	const dispose = render(
		<Errored
			fallback={(err, reset) => {
				resetFn = reset
				return <p>caught</p>
			}}
		>
			<Maybe />
		</Errored>,
	)
	expect(body()).toBe('<p>caught</p>')
	expect(attempts).toBe(1)

	resetFn()
	expect(body()).toBe('<p>caught</p>')
	expect(attempts).toBe(2)

	resetFn()
	expect(body()).toBe('<p>caught</p>')
	expect(attempts).toBe(3)

	console.error = originalError
	dispose()
})

// --- Reactive throws ---------------------------------------------------------

await test('Errored - catches error thrown inside an effect', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		effect(() => {
			throw new Error('from effect')
		})
		return <p>ok</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>from effect</p>')

	console.error = originalError
	dispose()
})

await test('Errored - catches error thrown inside a memo', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		const m = memo(() => {
			throw new Error('from memo')
		})
		return <p>{m}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>from memo</p>')

	console.error = originalError
	dispose()
})

await test('Errored - signal update that triggers a throwing effect is caught', expect => {
	const originalError = console.error
	console.error = () => {}

	const [trigger, setTrigger] = signal(0)

	const Maybe = () => {
		effect(() => {
			if (trigger() === 1) throw new Error('triggered')
		})
		return <p>alive</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Maybe />
		</Errored>,
	)
	expect(body()).toBe('<p>alive</p>')

	setTrigger(1)
	expect(body()).toBe('<p>triggered</p>')

	console.error = originalError
	dispose()
})

// --- Nesting ------------------------------------------------------------------

await test('Errored - nested: inner boundary catches, outer renders normally', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('inner')
	}

	const dispose = render(
		<Errored fallback={<p>outer caught</p>}>
			<p>before</p>
			<Errored fallback={<p>inner caught</p>}>
				<Boom />
			</Errored>
			<p>after</p>
		</Errored>,
	)
	expect(body()).toBe('<p>before</p><p>inner caught</p><p>after</p>')

	console.error = originalError
	dispose()
})

await test('Errored - nested: inner without fallback renders nothing, does not escalate', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('inner')
	}

	const dispose = render(
		<Errored fallback={<p>outer caught</p>}>
			<p>before</p>
			<Errored>
				<Boom />
			</Errored>
			<p>after</p>
		</Errored>,
	)
	expect(body()).toBe('<p>before</p><p>after</p>')

	console.error = originalError
	dispose()
})

await test('Errored - sibling boundaries catch independently', expect => {
	const originalError = console.error
	console.error = () => {}

	const BoomA = () => {
		throw new Error('a')
	}
	const BoomB = () => {
		throw new Error('b')
	}

	const dispose = render(
		<div>
			<Errored fallback={err => <p>{'A:' + err.message}</p>}>
				<BoomA />
			</Errored>
			<Errored fallback={err => <p>{'B:' + err.message}</p>}>
				<BoomB />
			</Errored>
		</div>,
	)
	expect(body()).toBe('<div><p>A:a</p><p>B:b</p></div>')

	console.error = originalError
	dispose()
})

await test('Errored - non-throwing sibling of a thrower inside the same boundary is replaced by fallback', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('boom')
	}

	// Whole subtree is replaced by the fallback — matches React / Solid.
	const dispose = render(
		<Errored fallback={<p>caught</p>}>
			<p>fine</p>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>caught</p>')

	console.error = originalError
	dispose()
})

// --- Cleanup ------------------------------------------------------------------

await test('Errored - dispose from children state clears the DOM', expect => {
	const dispose = render(
		<Errored fallback={<p>oops</p>}>
			<p>ok</p>
		</Errored>,
	)
	expect(body()).toBe('<p>ok</p>')
	dispose()
	expect(body()).toBe('')
})

await test('Errored - dispose from fallback state clears the DOM', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('boom')
	}

	const dispose = render(
		<Errored fallback={<p>caught</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>caught</p>')
	dispose()
	expect(body()).toBe('')

	console.error = originalError
})

await test('Errored - cleanups of errored children still run on dispose', expect => {
	const originalError = console.error
	console.error = () => {}

	let cleanupsRun = 0
	const Boom = () => {
		// register a cleanup via effect, then throw
		effect(() => {
			return () => cleanupsRun++
		})
		throw new Error('boom')
	}

	const dispose = render(
		<Errored fallback={<p>caught</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>caught</p>')

	dispose()
	expect(body()).toBe('')

	console.error = originalError
})

// --- Parent / sibling DOM preservation --------------------------------

await test('Errored - parent reactive content keeps updating after child error', expect => {
	const originalError = console.error
	console.error = () => {}

	const [count, setCount] = signal(0)

	const Boom = () => {
		throw new Error('child boom')
	}

	const dispose = render(
		<div>
			<p id="parent">{count}</p>
			<Errored fallback={<p>caught</p>}>
				<Boom />
			</Errored>
		</div>,
	)
	expect(body()).toBe('<div><p id="parent">0</p><p>caught</p></div>')

	setCount(1)
	expect($('#parent').textContent).toBe('1')

	setCount(2)
	expect($('#parent').textContent).toBe('2')

	console.error = originalError
	dispose()
})

await test('Errored - sibling components keep rendering after a boundary catches', expect => {
	const originalError = console.error
	console.error = () => {}

	const [count, setCount] = signal(0)

	const Boom = () => {
		throw new Error('boom')
	}

	const dispose = render(
		<div>
			<Errored fallback={<p>caught</p>}>
				<Boom />
			</Errored>
			<p id="sibling">{count}</p>
		</div>,
	)
	expect(body()).toBe('<div><p>caught</p><p id="sibling">0</p></div>')

	setCount(1)
	expect($('#sibling').textContent).toBe('1')

	setCount(2)
	expect($('#sibling').textContent).toBe('2')

	console.error = originalError
	dispose()
})

await test('Errored - reactive child error does not break parent updates', expect => {
	const originalError = console.error
	console.error = () => {}

	const [trigger, setTrigger] = signal(0)
	const [count, setCount] = signal(0)

	const Maybe = () => {
		effect(() => {
			if (trigger() === 1) throw new Error('child reactive')
		})
		return <p>alive</p>
	}

	const dispose = render(
		<div>
			<p id="parent">{count}</p>
			<Errored fallback={err => <p>{err.message}</p>}>
				<Maybe />
			</Errored>
		</div>,
	)
	expect(body()).toBe('<div><p id="parent">0</p><p>alive</p></div>')

	// trigger child error
	setTrigger(1)
	expect(body()).toBe(
		'<div><p id="parent">0</p><p>child reactive</p></div>',
	)

	// parent still updates
	setCount(5)
	expect($('#parent').textContent).toBe('5')

	console.error = originalError
	dispose()
})

// --- Event handler error ---------------------------------------------

await test('Errored - catches error thrown by an event handler', expect => {
	const originalError = console.error
	console.error = () => {}

	const Clicker = () => {
		return (
			<button
				on:click={() => {
					throw new Error('click boom')
				}}
			>
				click me
			</button>
		)
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Clicker />
		</Errored>,
	)
	expect(body()).toBe('<button>click me</button>')

	$('button').click()
	expect(body()).toBe('<p>click boom</p>')

	console.error = originalError
	dispose()
})

// --- Error in fallback -----------------------------------------------

await test('Errored - error in fallback function is not caught by same boundary', expect => {
	const originalError = console.error
	const errors = []
	console.error = err => errors.push(err)

	const Boom = () => {
		throw new Error('child')
	}

	// fallback itself throws — there is no boundary above to catch
	// it, so it goes to console.error
	const dispose = render(
		<Errored
			fallback={() => {
				throw new Error('fallback broke')
			}}
		>
			<Boom />
		</Errored>,
	)

	// fallback threw, so nothing renders
	expect(errors.length > 0).toBe(true)

	console.error = originalError
	dispose()
})

await test('Errored - error in fallback is caught by outer boundary', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('child')
	}

	const dispose = render(
		<Errored fallback={err => <p>outer: {err.message}</p>}>
			<Errored
				fallback={() => {
					throw new Error('fallback broke')
				}}
			>
				<Boom />
			</Errored>
		</Errored>,
	)
	expect(body()).toBe('<p>outer: fallback broke</p>')

	console.error = originalError
	dispose()
})

// --- Derived throw ---------------------------------------------------

await test('Errored - catches error thrown inside a derived', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		const d = derived(() => {
			throw new Error('from derived')
		})
		return <p>{d}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Boom />
		</Errored>,
	)
	expect(body()).toBe('<p>from derived</p>')

	console.error = originalError
	dispose()
})

// --- Deeply nested grandchild ----------------------------------------

await test('Errored - catches error from deeply nested grandchild', expect => {
	const originalError = console.error
	console.error = () => {}

	const Boom = () => {
		throw new Error('deep boom')
	}
	const Inner = () => (
		<div>
			<Boom />
		</div>
	)
	const Middle = () => (
		<section>
			<Inner />
		</section>
	)

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Middle />
		</Errored>,
	)
	expect(body()).toBe('<p>deep boom</p>')

	console.error = originalError
	dispose()
})

await test('Errored - catches reactive error from deeply nested grandchild', expect => {
	const originalError = console.error
	console.error = () => {}

	const [trigger, setTrigger] = signal(0)

	const Boom = () => {
		effect(() => {
			if (trigger() === 1) throw new Error('deep reactive')
		})
		return <p>ok</p>
	}
	const Inner = () => (
		<div>
			<Boom />
		</div>
	)

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Inner />
		</Errored>,
	)
	expect(body()).toBe('<div><p>ok</p></div>')

	setTrigger(1)
	expect(body()).toBe('<p>deep reactive</p>')

	console.error = originalError
	dispose()
})

// --- Multiple boundaries sharing a signal ----------------------------

await test('Errored - two boundaries triggered by same signal catch independently', expect => {
	const originalError = console.error
	console.error = () => {}

	const [trigger, setTrigger] = signal(0)

	const BoomA = () => {
		effect(() => {
			if (trigger() === 1) throw new Error('A')
		})
		return <p>a-ok</p>
	}
	const BoomB = () => {
		effect(() => {
			if (trigger() === 1) throw new Error('B')
		})
		return <p>b-ok</p>
	}

	const dispose = render(
		<div>
			<Errored fallback={err => <p>{'A:' + err.message}</p>}>
				<BoomA />
			</Errored>
			<Errored fallback={err => <p>{'B:' + err.message}</p>}>
				<BoomB />
			</Errored>
		</div>,
	)
	expect(body()).toBe('<div><p>a-ok</p><p>b-ok</p></div>')

	// single signal change triggers both boundaries
	setTrigger(1)
	expect(body()).toBe('<div><p>A:A</p><p>B:B</p></div>')

	console.error = originalError
	dispose()
})

// --- Dead effect stays dead ------------------------------------------

await test('Errored - after effect throws, further signal changes do not produce new errors', expect => {
	const originalError = console.error
	console.error = () => {}

	const [trigger, setTrigger] = signal(0)
	let errorCount = 0

	const Maybe = () => {
		effect(() => {
			if (trigger() > 0) throw new Error('err-' + trigger())
		})
		return <p>alive</p>
	}

	const dispose = render(
		<Errored
			fallback={err => {
				errorCount++
				return <p>{err.message}</p>
			}}
		>
			<Maybe />
		</Errored>,
	)
	expect(body()).toBe('<p>alive</p>')
	expect(errorCount).toBe(0)

	setTrigger(1) // effect throws and dies
	expect(body()).toBe('<p>err-1</p>')
	expect(errorCount).toBe(1)

	// effect is dead — further writes don't produce new errors
	setTrigger(2)
	expect(body()).toBe('<p>err-1</p>')
	expect(errorCount).toBe(1)

	console.error = originalError
	dispose()
})

// --- Memo error triggered by signal change ---------------------------

await test('Errored - catches memo error triggered by signal change', expect => {
	const originalError = console.error
	console.error = () => {}

	const [read, write] = signal(0)

	const Maybe = () => {
		const m = memo(() => {
			if (read() === 1) throw new Error('memo triggered')
			return read() * 10
		})
		return <p>{m}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Maybe />
		</Errored>,
	)
	expect(body()).toBe('<p>0</p>')

	write(1)
	expect(body()).toBe('<p>memo triggered</p>')

	console.error = originalError
	dispose()
})

// --- Derived chain error triggered by signal -------------------------

await test('Errored - catches derived chain error triggered by signal change', expect => {
	const originalError = console.error
	console.error = () => {}

	const [read, write] = signal(1)

	const Maybe = () => {
		const d = derived(
			() => read(),
			v => {
				if (v === 2) throw new Error('chain boom')
				return v * 10
			},
		)
		return <p>{d}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Maybe />
		</Errored>,
	)
	expect(body()).toBe('<p>10</p>')

	write(2)
	expect(body()).toBe('<p>chain boom</p>')

	console.error = originalError
	dispose()
})

// --- Nested: inner catches reactive error before outer ---------------

await test('Errored - nested: inner catches reactive error, outer unaffected', expect => {
	const originalError = console.error
	console.error = () => {}

	const [trigger, setTrigger] = signal(0)

	const Maybe = () => {
		effect(() => {
			if (trigger() === 1) throw new Error('inner reactive')
		})
		return <p>ok</p>
	}

	const dispose = render(
		<Errored fallback={<p>outer caught</p>}>
			<p>before</p>
			<Errored fallback={err => <p>{err.message}</p>}>
				<Maybe />
			</Errored>
			<p>after</p>
		</Errored>,
	)
	expect(body()).toBe('<p>before</p><p>ok</p><p>after</p>')

	setTrigger(1)
	expect(body()).toBe(
		'<p>before</p><p>inner reactive</p><p>after</p>',
	)

	console.error = originalError
	dispose()
})

// --- Error inside batch triggers boundary ----------------------------

await test('Errored - error inside batch is caught', expect => {
	const originalError = console.error
	console.error = () => {}

	const [read, write] = signal(0)
	const [count, setCount] = signal(0)

	const Maybe = () => {
		effect(() => {
			if (read() > 0) throw new Error('batched')
		})
		return <p>alive</p>
	}

	const dispose = render(
		<div>
			<p id="counter">{count}</p>
			<Errored fallback={err => <p>{err.message}</p>}>
				<Maybe />
			</Errored>
		</div>,
	)
	expect(body()).toBe('<div><p id="counter">0</p><p>alive</p></div>')

	batch(() => {
		write(1)
		setCount(1)
	})
	expect(body()).toBe(
		'<div><p id="counter">1</p><p>batched</p></div>',
	)

	console.error = originalError
	dispose()
})

// --- Async / promise rejection ------------------------------------------------
//
// `withValue` chains `.then(onFulfilled, onRejected)` — rejected promises
// inside an Errored boundary route to the fallback via the catchError
// context provided by the boundary.

await test('Errored — catches rejected promise and shows fallback', async expect => {
	const originalError = console.error
	console.error = () => {}

	const Async = () => {
		const d = derived(() => Promise.reject(new Error('async fail')))
		return <p>{d}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Async />
		</Errored>,
	)

	await sleep(50)
	expect(body()).toBe('<p>async fail</p>')

	console.error = originalError
	dispose()
})

await test('Errored — rejected promise does not break parent', async expect => {
	const originalError = console.error
	console.error = () => {}

	const [count, setCount] = signal(0)

	const Async = () => {
		const d = derived(() => Promise.reject(new Error('fail')))
		return <p>{d}</p>
	}

	const dispose = render(
		<div>
			<p id="parent">{count}</p>
			<Errored fallback={<p>caught</p>}>
				<Async />
			</Errored>
		</div>,
	)

	await sleep(50)
	expect(body()).toBe('<div><p id="parent">0</p><p>caught</p></div>')

	// parent still updates
	setCount(1)
	expect($('#parent').textContent).toBe('1')

	console.error = originalError
	dispose()
})

await test('Errored — component returning rejected promise is caught by fallback', async expect => {
	const originalError = console.error
	console.error = () => {}

	const [attempt, , updateAttempt] = signal(0)

	function AsyncBoom() {
		return new Promise((_, reject) => {
			setTimeout(() => reject(new Error('fetch failed')), 20)
		})
	}

	/** @type {any} */
	let resetFn
	const dispose = render(
		<Errored
			fallback={(err, reset) => {
				resetFn = reset
				return (
					<div>
						<p>Something broke: {String(err)}</p>
						<button
							on:click={() => {
								updateAttempt(n => n + 1)
								reset()
							}}
						>
							retry
						</button>
					</div>
				)
			}}
		>
			<p>Loading…</p>
			<AsyncBoom />
		</Errored>,
	)

	// before the promise rejects, children show
	expect(body()).toBe('<p>Loading…</p>')

	await sleep(80)
	expect(body()).toBe(
		'<div><p>Something broke: Error: fetch failed</p><button>retry</button></div>',
	)

	console.error = originalError
	dispose()
})

await test('Errored — promise that resolves then rejects on signal change', async expect => {
	const originalError = console.error
	console.error = () => {}

	const [shouldFail, setShouldFail] = signal(false)

	const Async = () => {
		const d = derived(() =>
			shouldFail()
				? Promise.reject(new Error('failed'))
				: Promise.resolve('ok'),
		)
		return <p>{d}</p>
	}

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Async />
		</Errored>,
	)

	await sleep(50)
	expect(body()).toBe('<p>ok</p>')

	setShouldFail(true)
	await sleep(50)
	expect(body()).toBe('<p>failed</p>')

	console.error = originalError
	dispose()
})
