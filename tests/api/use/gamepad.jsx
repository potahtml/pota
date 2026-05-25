/** @jsxImportSource pota */
// Tests for pota/use/gamepad: connect state, button/axis/trigger
// signals, and the rAF poll loop's lifecycle. navigator.getGamepads
// is monkey-patched per test so polling sees a deterministic state.

import { test } from '#test'

import { root } from 'pota'
import {
	gamepadSnapshot,
	useGamepadAxis,
	useGamepadButton,
	useGamepadConnected,
	useGamepadTrigger,
} from 'pota/use/gamepad'

/**
 * @param {{
 * 	index?: number
 * 	buttons?: { pressed: boolean; value: number }[]
 * 	axes?: number[]
 * }} state
 */
const fakeGamepad = state => ({
	index: state.index ?? 0,
	id: 'fake',
	connected: true,
	timestamp: 0,
	mapping: 'standard',
	buttons: state.buttons ?? [],
	axes: state.axes ?? [],
	vibrationActuator: null,
	hapticActuators: [],
})

/** Swaps `navigator.getGamepads` for the duration of a test. */
const installGamepads = () => {
	const original = navigator.getGamepads
	/** @type {any[]} */
	let pads = []
	navigator.getGamepads = () => /** @type {any} */ (pads)
	return {
		set: list => {
			pads = list
		},
		restore: () => {
			navigator.getGamepads = original
		},
	}
}

const twoFrames = () =>
	new Promise(r =>
		requestAnimationFrame(() => requestAnimationFrame(r)),
	)

await test('gamepad - useGamepadConnected reflects polled getGamepads() state', async expect => {
	const mock = installGamepads()
	try {
		await root(async dispose => {
			const connected = useGamepadConnected(0)
			expect(connected()).toBe(false)

			mock.set([fakeGamepad({ index: 0 })])
			await twoFrames()
			expect(connected()).toBe(true)

			mock.set([])
			await twoFrames()
			expect(connected()).toBe(false)

			dispose()
		})
	} finally {
		mock.restore()
	}
})

await test('gamepad - useGamepadButton flips when the poll sees a pressed button', async expect => {
	const mock = installGamepads()
	const pad = fakeGamepad({
		buttons: [{ pressed: false, value: 0 }],
	})
	mock.set([pad])

	try {
		await root(async dispose => {
			const btn = useGamepadButton(0)
			await twoFrames()
			expect(btn()).toBe(false)

			pad.buttons[0] = { pressed: true, value: 1 }
			await twoFrames()
			expect(btn()).toBe(true)

			pad.buttons[0] = { pressed: false, value: 0 }
			await twoFrames()
			expect(btn()).toBe(false)

			dispose()
		})
	} finally {
		mock.restore()
	}
})

await test('gamepad - useGamepadTrigger surfaces the analog 0..1 value', async expect => {
	const mock = installGamepads()
	const pad = fakeGamepad({
		buttons: [{ pressed: false, value: 0 }],
	})
	mock.set([pad])

	try {
		await root(async dispose => {
			const trigger = useGamepadTrigger(0)

			pad.buttons[0] = { pressed: true, value: 0.42 }
			await twoFrames()
			expect(trigger()).toBe(0.42)

			pad.buttons[0] = { pressed: true, value: 0.95 }
			await twoFrames()
			expect(trigger()).toBe(0.95)

			dispose()
		})
	} finally {
		mock.restore()
	}
})

await test('gamepad - useGamepadAxis surfaces axis values in [-1, 1]', async expect => {
	const mock = installGamepads()
	const pad = fakeGamepad({ axes: [0, 0] })
	mock.set([pad])

	try {
		await root(async dispose => {
			const lx = useGamepadAxis(0)
			const ly = useGamepadAxis(1)

			pad.axes[0] = 0.7
			pad.axes[1] = -0.3
			await twoFrames()
			expect(lx()).toBe(0.7)
			expect(ly()).toBe(-0.3)

			dispose()
		})
	} finally {
		mock.restore()
	}
})

await test('gamepad - poll loop stops after the last consumer disposes', async expect => {
	let polls = 0
	const original = navigator.getGamepads
	navigator.getGamepads = () => {
		polls++
		return /** @type {any} */ ([])
	}

	try {
		await root(async dispose => {
			useGamepadButton(0)
			await twoFrames()
			expect(polls > 0).toBe(true)
			dispose()
		})

		const after = polls
		await twoFrames()
		await twoFrames()
		// loop is idle now — counter should not advance.
		expect(polls).toBe(after)
	} finally {
		navigator.getGamepads = original
	}
})

await test('gamepad - gamepadSnapshot reads the live Gamepad without subscribing', async expect => {
	const mock = installGamepads()
	const pad = fakeGamepad({
		index: 1,
		buttons: [{ pressed: true, value: 1 }],
		axes: [0.5],
	})
	mock.set([null, pad])

	try {
		const snap = gamepadSnapshot(1)
		expect(snap).not.toBe(null)
		expect(/** @type {any} */ (snap).buttons[0].pressed).toBe(true)
		expect(/** @type {any} */ (snap).axes[0]).toBe(0.5)

		expect(gamepadSnapshot(0)).toBe(null)
		expect(gamepadSnapshot(7)).toBe(null)
	} finally {
		mock.restore()
	}
})

await test('gamepad - multiple gamepads are tracked independently', async expect => {
	const mock = installGamepads()
	const padA = fakeGamepad({
		index: 0,
		buttons: [{ pressed: false, value: 0 }],
	})
	const padB = fakeGamepad({
		index: 1,
		buttons: [{ pressed: false, value: 0 }],
	})
	mock.set([padA, padB])

	try {
		await root(async dispose => {
			const a = useGamepadButton(0, 0)
			const b = useGamepadButton(0, 1)

			padA.buttons[0] = { pressed: true, value: 1 }
			await twoFrames()
			expect(a()).toBe(true)
			expect(b()).toBe(false)

			padB.buttons[0] = { pressed: true, value: 1 }
			await twoFrames()
			expect(b()).toBe(true)

			dispose()
		})
	} finally {
		mock.restore()
	}
})

await test('gamepad - inner subscription dispose does not stop the loop if outer still subscribed', async expect => {
	const mock = installGamepads()
	const pad = fakeGamepad({
		buttons: [
			{ pressed: false, value: 0 },
			{ pressed: false, value: 0 },
		],
	})
	mock.set([pad])

	try {
		/** @type {() => void} */
		let outerDispose = () => {}
		await root(async dispose => {
			outerDispose = dispose
			useGamepadButton(0) // outer holder
		})

		await root(async d => {
			const inner = useGamepadButton(1)
			pad.buttons[1] = { pressed: true, value: 1 }
			await twoFrames()
			expect(inner()).toBe(true)
			d()
		})

		// outer is still subscribed — loop should still be running
		const btn0 = useGamepadButton(0)
		pad.buttons[0] = { pressed: true, value: 1 }
		await twoFrames()
		expect(btn0()).toBe(true)

		outerDispose()
	} finally {
		mock.restore()
	}
})
