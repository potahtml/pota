/** @jsxImportSource pota */
// Tests for pota/use/playing: isPlaying heuristic across the
// HTMLMediaElement state combinations.

import { test } from '#test'

import { isPlaying } from 'pota/use/playing'

/**
 * @param {{
 * 	currentTime?: number
 * 	paused?: boolean
 * 	ended?: boolean
 * 	readyState?: number
 * }} state
 */
const media = state =>
	/** @type {HTMLMediaElement} */ ({
		currentTime: state.currentTime ?? 0,
		paused: state.paused ?? true,
		ended: state.ended ?? false,
		readyState: state.readyState ?? 0,
	})

await test('playing - isPlaying is true for currentTime>0, not paused, not ended, readyState>2', expect => {
	expect(
		isPlaying(
			media({
				currentTime: 1.5,
				paused: false,
				ended: false,
				readyState: 4,
			}),
		),
	).toBe(true)
})

await test('playing - isPlaying is false when paused', expect => {
	expect(
		isPlaying(
			media({ currentTime: 1, paused: true, readyState: 4 }),
		),
	).toBe(false)
})

await test('playing - isPlaying is false when ended', expect => {
	expect(
		isPlaying(
			media({
				currentTime: 5,
				paused: false,
				ended: true,
				readyState: 4,
			}),
		),
	).toBe(false)
})

await test('playing - isPlaying is false at the very start (currentTime=0)', expect => {
	expect(
		isPlaying(
			media({ currentTime: 0, paused: false, readyState: 4 }),
		),
	).toBe(false)
})

await test('playing - isPlaying is false when readyState <= 2 (still buffering)', expect => {
	expect(
		isPlaying(
			media({ currentTime: 1, paused: false, readyState: 2 }),
		),
	).toBe(false)
})
