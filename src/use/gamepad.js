import { signal } from '../lib/reactive.js'
import {
	cancelAnimationFrame,
	requestAnimationFrame,
	window,
} from '../lib/std.js'
import { Emitter } from './emitter.js'

// The Gamepad API has no per-button events: state is sampled via
// `navigator.getGamepads()` each frame. So this module runs a
// singleton rAF poll loop that starts on the first subscription and
// stops once the last consumer disposes. Even connect/disconnect is
// derived from polling rather than the `gamepadconnected` /
// `gamepaddisconnected` events — one source of truth, and polling
// observes everything those events do within one frame.

/** @type {Map<number, Signal<boolean>>} */
const connectedSignals = new Map()
/** @type {Map<string, Signal<boolean>>} */
const buttonPressed = new Map()
/** @type {Map<string, Signal<number>>} */
const buttonValue = new Map()
/** @type {Map<string, Signal<number>>} */
const axisValue = new Map()

let rafId = 0

const ensureConnected = index => {
	let entry = connectedSignals.get(index)
	if (!entry) {
		entry = signal(false)
		connectedSignals.set(index, entry)
	}
	return entry
}

const ensureBoolSignal = (map, key) => {
	let entry = map.get(key)
	if (!entry) {
		entry = signal(false)
		map.set(key, entry)
	}
	return entry
}

const ensureNumberSignal = (map, key) => {
	let entry = map.get(key)
	if (!entry) {
		entry = signal(0)
		map.set(key, entry)
	}
	return entry
}

const key2 = (a, b) => a + ':' + b

const poll = () => {
	rafId = requestAnimationFrame(poll)
	const pads = window.navigator.getGamepads()
	// only update signals that already have subscribers — avoids
	// creating entries for buttons / axes / gamepads nobody asked
	// about, keeping the per-frame work bounded.
	for (const [index, sig] of connectedSignals) {
		sig.write(!!pads[index])
	}
	for (let i = 0; i < pads.length; i++) {
		const pad = pads[i]
		if (!pad) continue
		const buttons = pad.buttons
		for (let b = 0; b < buttons.length; b++) {
			const btn = buttons[b]
			const k = key2(i, b)
			const p = buttonPressed.get(k)
			if (p) p.write(btn.pressed)
			const v = buttonValue.get(k)
			if (v) v.write(btn.value)
		}
		const axes = pad.axes
		for (let a = 0; a < axes.length; a++) {
			const v = axisValue.get(key2(i, a))
			if (v) v.write(axes[a])
		}
	}
}

// Emitter refcounts the rAF poll loop: the first `use()` starts it,
// the last consumer's cleanup stops it. `rafId` is reassigned inside
// `poll` itself, so the teardown reads the live module-level binding.
const rafLifecycle = new Emitter({
	on: () => {
		rafId = requestAnimationFrame(poll)
		return () => {
			if (rafId) {
				cancelAnimationFrame(rafId)
				rafId = 0
			}
		}
	},
})

/**
 * Reactive accessor for whether the gamepad at `index` is currently
 * connected. Backed by the same poll loop as the other accessors; the
 * loop runs while any consumer is subscribed.
 *
 * @param {number} [index=0] Default is `0`
 * @returns {() => boolean}
 * @url https://pota.quack.uy/use/gamepad/useGamepadConnected
 */
export const useGamepadConnected = (index = 0) => {
	rafLifecycle.use()
	return ensureConnected(index).read
}

/**
 * Reactive boolean accessor: `true` while the digital button is
 * pressed. For analog triggers use {@link useGamepadTrigger} to get
 * the `0..1` value.
 *
 * @param {number} buttonIndex
 * @param {number} [gamepadIndex=0] Default is `0`
 * @returns {() => boolean}
 * @url https://pota.quack.uy/use/gamepad/useGamepadButton
 */
export const useGamepadButton = (buttonIndex, gamepadIndex = 0) => {
	rafLifecycle.use()
	return ensureBoolSignal(
		buttonPressed,
		key2(gamepadIndex, buttonIndex),
	).read
}

/**
 * Reactive analog trigger / pressure accessor in `0..1`. For most
 * digital buttons the value matches the boolean from
 * {@link useGamepadButton} (`0` released, `1` pressed); for triggers
 * (typically buttons 6 and 7 on a standard mapping) it's the live
 * pressure.
 *
 * @param {number} buttonIndex
 * @param {number} [gamepadIndex=0] Default is `0`
 * @returns {() => number}
 * @url https://pota.quack.uy/use/gamepad/useGamepadTrigger
 */
export const useGamepadTrigger = (buttonIndex, gamepadIndex = 0) => {
	rafLifecycle.use()
	return ensureNumberSignal(
		buttonValue,
		key2(gamepadIndex, buttonIndex),
	).read
}

/**
 * Reactive axis accessor in `[-1, 1]`. Raw value — apply your own
 * deadzone (`Math.abs(v) < threshold ? 0 : v`) where needed.
 *
 * @param {number} axisIndex
 * @param {number} [gamepadIndex=0] Default is `0`
 * @returns {() => number}
 * @url https://pota.quack.uy/use/gamepad/useGamepadAxis
 */
export const useGamepadAxis = (axisIndex, gamepadIndex = 0) => {
	rafLifecycle.use()
	return ensureNumberSignal(axisValue, key2(gamepadIndex, axisIndex))
		.read
}

/**
 * Non-reactive snapshot of the underlying `Gamepad` object (or `null`
 * if no gamepad is at that index). Use this inside game loops that
 * want to read every button + axis without subscribing per element.
 * Does **not** start the poll loop on its own — it just reads
 * `navigator.getGamepads()` directly.
 *
 * @param {number} [index=0] Default is `0`
 * @returns {Gamepad | null}
 * @url https://pota.quack.uy/use/gamepad/gamepadSnapshot
 */
export const gamepadSnapshot = (index = 0) =>
	window.navigator.getGamepads()[index] || null
