import { cleanup, signal } from '../lib/reactive.js'
import {
	cancelAnimationFrame,
	requestAnimationFrame,
	window,
} from '../lib/std.js'

// The Gamepad API has no per-button events: state is sampled via
// `navigator.getGamepads()` each frame. So this module runs a
// singleton rAF poll loop that starts on the first subscription and
// stops once the last consumer disposes. Even connect/disconnect is
// derived from polling rather than the `gamepadconnected` /
// `gamepaddisconnected` events — one source of truth, and polling
// observes everything those events do within one frame.

/** @type {Map<number, [() => boolean, (v: boolean) => void]>} */
const connectedSignals = new Map()
/** @type {Map<string, [() => boolean, (v: boolean) => void]>} */
const buttonPressed = new Map()
/** @type {Map<string, [() => number, (v: number) => void]>} */
const buttonValue = new Map()
/** @type {Map<string, [() => number, (v: number) => void]>} */
const axisValue = new Map()

let rafId = 0
let consumers = 0

const ensureConnected = index => {
	let entry = connectedSignals.get(index)
	if (!entry) {
		const [read, write] = signal(false)
		entry = [read, write]
		connectedSignals.set(index, entry)
	}
	return entry
}

const ensureBoolSignal = (map, key) => {
	let entry = map.get(key)
	if (!entry) {
		const [read, write] = signal(false)
		entry = [read, write]
		map.set(key, entry)
	}
	return entry
}

const ensureNumberSignal = (map, key) => {
	let entry = map.get(key)
	if (!entry) {
		const [read, write] = signal(0)
		entry = [read, write]
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
	for (const [index, [, write]] of connectedSignals) {
		write(!!pads[index])
	}
	for (let i = 0; i < pads.length; i++) {
		const pad = pads[i]
		if (!pad) continue
		const buttons = pad.buttons
		for (let b = 0; b < buttons.length; b++) {
			const btn = buttons[b]
			const k = key2(i, b)
			const p = buttonPressed.get(k)
			if (p) p[1](btn.pressed)
			const v = buttonValue.get(k)
			if (v) v[1](btn.value)
		}
		const axes = pad.axes
		for (let a = 0; a < axes.length; a++) {
			const v = axisValue.get(key2(i, a))
			if (v) v[1](axes[a])
		}
	}
}

const subscribe = () => {
	if (++consumers === 1) rafId = requestAnimationFrame(poll)
	cleanup(() => {
		if (--consumers === 0 && rafId) {
			cancelAnimationFrame(rafId)
			rafId = 0
		}
	})
}

/**
 * Reactive accessor for whether the gamepad at `index` is currently
 * connected. Backed by the same poll loop as the other accessors;
 * the loop runs while any consumer is subscribed.
 *
 * @param {number} [index=0] Default is `0`
 * @returns {() => boolean}
 * @url https://pota.quack.uy/use/gamepad
 */
export const useGamepadConnected = (index = 0) => {
	subscribe()
	return ensureConnected(index)[0]
}

/**
 * Reactive boolean accessor: `true` while the digital button is
 * pressed. For analog triggers use {@link useGamepadTrigger} to get
 * the `0..1` value.
 *
 * @param {number} buttonIndex
 * @param {number} [gamepadIndex=0] Default is `0`
 * @returns {() => boolean}
 * @url https://pota.quack.uy/use/gamepad
 */
export const useGamepadButton = (buttonIndex, gamepadIndex = 0) => {
	subscribe()
	return ensureBoolSignal(
		buttonPressed,
		key2(gamepadIndex, buttonIndex),
	)[0]
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
 * @url https://pota.quack.uy/use/gamepad
 */
export const useGamepadTrigger = (buttonIndex, gamepadIndex = 0) => {
	subscribe()
	return ensureNumberSignal(
		buttonValue,
		key2(gamepadIndex, buttonIndex),
	)[0]
}

/**
 * Reactive axis accessor in `[-1, 1]`. Raw value — apply your own
 * deadzone (`Math.abs(v) < threshold ? 0 : v`) where needed.
 *
 * @param {number} axisIndex
 * @param {number} [gamepadIndex=0] Default is `0`
 * @returns {() => number}
 * @url https://pota.quack.uy/use/gamepad
 */
export const useGamepadAxis = (axisIndex, gamepadIndex = 0) => {
	subscribe()
	return ensureNumberSignal(
		axisValue,
		key2(gamepadIndex, axisIndex),
	)[0]
}

/**
 * Non-reactive snapshot of the underlying `Gamepad` object (or
 * `null` if no gamepad is at that index). Use this inside game
 * loops that want to read every button + axis without subscribing
 * per element. Does **not** start the poll loop on its own — it
 * just reads `navigator.getGamepads()` directly.
 *
 * @param {number} [index=0] Default is `0`
 * @returns {Gamepad | null}
 * @url https://pota.quack.uy/use/gamepad
 */
export const gamepadSnapshot = (index = 0) =>
	window.navigator.getGamepads()[index] || null
