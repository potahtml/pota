import { Component } from '../../core/renderer.js'
import { cleanup } from '../../lib/reactive.js'
import { mutable } from '../../lib/store.js'

import { Suspense } from '../Suspense.js'

import { Audio } from './media/audio.js'
import { Image } from './media/image.js'
import { Link } from './media/link.js'
import { Video } from './media/video.js'

/**
 * Wraps a `data:`-URI in an object URL so the renderer hands native
 * media elements something compact. The object URL is revoked when
 * the surrounding scope tears down.
 *
 * @param {string} url
 */
function toObjectURL(url) {
	const link = mutable({ url })
	/** @type {string | undefined} */
	let objectURL
	fetch(url)
		.then(r => r.blob())
		.then(blob => {
			objectURL = URL.createObjectURL(blob)
			link.url = objectURL
		})
	cleanup(() => {
		if (objectURL) URL.revokeObjectURL(objectURL)
	})
	return link
}

/**
 * Fallback path for `guessType`: HEAD/GET the URL to learn its
 * Content-Type, then re-enter `<Media>` with the resolved `type`.
 *
 * @param {string} url
 * @param {(() => void) | undefined} scroll
 */
async function toMediaLink(url, scroll) {
	const res = await fetch(url, {
		method: url.indexOf('blob:') === 0 ? 'GET' : 'HEAD',
	})
	const contentType = res.headers.get('Content-Type') ?? undefined
	return Component(Media, { url, scroll, type: contentType })
}

/**
 * Routes a URL to the right media renderer. `data:` URIs are first
 * converted to object URLs (avoids gigantic `src` attributes). When
 * the extension is ambiguous and `guessType` is set, a `<Suspense>`
 * boundary fetches the Content-Type and re-routes.
 *
 * @type {Component<{
 * 	url: string
 * 	scroll?: () => void
 * 	type?: string
 * 	guessType?: boolean
 * }>}
 */
export function Media(props) {
	const url = props.url
	if (/^data:video\/(webm|mp4|mpg|ogv);base64/.test(url)) {
		const link = toObjectURL(url)
		return Component(Video, { url: link.url, scroll: props.scroll })
	}
	if (/^data:audio\/(wav|mp3|m4a|ogg|oga|opus);base64/.test(url)) {
		const link = toObjectURL(url)
		return Component(Audio, { url: link.url, scroll: props.scroll })
	}
	if (
		/^data:image\/(png|apng|jpg|jpeg|gif|svg|webp);base64/.test(url)
	) {
		const link = toObjectURL(url)
		return Component(Image, { url: link.url, scroll: props.scroll })
	}
	if (/^data:/.test(url)) {
		const link = toObjectURL(url)
		return Component(Link, { url: link.url })
	}
	if (/[\.\/](webm|mp4|mpg|ogv)/gi.test(props.type || url)) {
		return Component(Video, { url, scroll: props.scroll })
	}
	if (/[\.\/](wav|mp3|m4a|ogg|oga|opus)/gi.test(props.type || url)) {
		return Component(Audio, { url, scroll: props.scroll })
	}
	if (
		/[\.\/](png|apng|jpg|jpeg|gif|svg|webp)/gi.test(props.type || url)
	) {
		return Component(Image, { url, scroll: props.scroll })
	}
	if (props.type) {
		// `type` was set, so type-guessing already ran — render nothing
		// rather than recursing.
		return
	}
	if (props.guessType && /^[^/]+\/\/[^/]+\/.+/.test(url)) {
		// Skip path-less URLs (origin-only). Show the link immediately
		// and swap to the resolved media once the HEAD/GET returns.
		return Component(Suspense, {
			fallback: Component(Link, { url }),
			children: () => toMediaLink(url, props.scroll),
		})
	}
	return Component(Link, { url })
}
