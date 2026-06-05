import { withValue } from '../lib/reactive.js'
import { document } from './dom.js'

const SIZE = 16

/** @type {HTMLCanvasElement | undefined} */
let canvas
/** @type {CanvasRenderingContext2D | undefined} */
let ctx
// Snapshot of the favicon's URL the first time we touch it — every
// redraw reads from this image rather than the live `link.href`,
// because each `setFaviconBadge` call rewrites `link.href` to the
// badged canvas, which would otherwise become the next "base" and
// bake the badge in permanently.
let originalHref = ''
/** @type {HTMLImageElement | undefined} */
let baseImage

const findLink = () =>
	/** @type {HTMLLinkElement | null} */ (
		document.querySelector('link[rel="icon"]') ||
			document.querySelector('link[rel="shortcut icon"]')
	)

const ensureCanvas = () => {
	if (canvas) return
	canvas = document.createElement('canvas')
	canvas.width = canvas.height = SIZE
	ctx = /** @type {CanvasRenderingContext2D} */ (
		canvas.getContext('2d')
	)
	ctx.font = 'bold 10px sans-serif'
}

/** @returns {Promise<HTMLImageElement | null>} */
const ensureBase = () =>
	new Promise(resolve => {
		const link = findLink()
		if (!link) {
			resolve(null)
			return
		}
		if (!originalHref) originalHref = link.href
		if (baseImage) {
			resolve(baseImage)
			return
		}
		const img = new Image()
		// allow `toDataURL` to succeed when the icon is served from a
		// CORS-enabled origin; same-origin and `data:` URLs are
		// unaffected by this attribute.
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			baseImage = img
			resolve(img)
		}
		img.onerror = () => resolve(null)
		img.src = originalHref
	})

/**
 * @param {HTMLImageElement} image
 * @param {string | number | null | undefined} badge
 * @param {{ background?: string; color?: string } | undefined} options
 */
const draw = (image, badge, options) => {
	const c = /** @type {CanvasRenderingContext2D} */ (ctx)
	c.clearRect(0, 0, SIZE, SIZE)
	c.drawImage(image, 0, 0, SIZE, SIZE)
	if (badge == null || badge === '') return
	const text = String(badge)
	c.fillStyle = options?.background ?? 'red'
	c.beginPath()
	c.arc(10, 10, 5, 0, Math.PI * 2)
	c.fill()
	c.closePath()
	c.fillStyle = options?.color ?? 'white'
	c.fillText(text, text.length > 1 ? 5 : 7, 14, 9)
}

/**
 * Draws a notification badge on top of the document favicon. Pass a
 * falsy `badge` to redraw the icon without a badge. No-op when no
 * `<link rel="icon">` is present, or when the icon image fails to
 * load (e.g. cross-origin without CORS). When the canvas is tainted
 * (cross-origin, CORS rejected), the favicon URL is left unchanged
 * rather than throwing.
 *
 * @param {string | number | null | undefined} [badge]
 * @param {{ background?: string; color?: string }} [options]
 * @returns {Promise<void>}
 * @url https://pota.quack.uy/use/favicon/setFaviconBadge
 */
export const setFaviconBadge = async (badge, options) => {
	const link = findLink()
	if (!link) return
	ensureCanvas()
	const image = await ensureBase()
	if (!image) return
	draw(image, badge, options)
	try {
		link.href = /** @type {HTMLCanvasElement} */ (canvas).toDataURL()
	} catch {
		// tainted canvas (cross-origin icon, no CORS) — leave the
		// existing href in place.
	}
}

/**
 * Reactive driver for {@link setFaviconBadge}. When `badge` is an
 * accessor / function, the favicon updates whenever the value
 * changes; for a static value, it applies once. Does **not** clear
 * the badge on scope dispose — favicons are page-global state, so
 * call `setFaviconBadge(null)` from your own cleanup if needed.
 *
 * @param {string | number | null | undefined | (() => any)} badge
 * @param {{ background?: string; color?: string }} [options]
 * @url https://pota.quack.uy/use/favicon/useFaviconBadge
 */
export const useFaviconBadge = (badge, options) => {
	withValue(badge, v => {
		setFaviconBadge(v, options)
	})
}
