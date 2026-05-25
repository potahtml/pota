/**
 * Returns `true` when a media element is actively playing — using
 * the standard heuristic of "currentTime advancing, not paused, not
 * ended, and `readyState >= HAVE_FUTURE_DATA` (3)". Useful as a
 * one-shot check inside event handlers; for reactive play-state,
 * wrap a signal around `play` / `pause` / `ended` listeners.
 *
 * @param {HTMLMediaElement} el
 * @returns {boolean}
 * @url https://pota.quack.uy/use/playing
 */
export const isPlaying = el =>
	el.currentTime > 0 && !el.paused && !el.ended && el.readyState > 2
