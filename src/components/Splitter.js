import { cleanup, ref, signal } from '../lib/reactive.js'
import { Component } from '../core/renderer.js'
import { ready } from '../core/scheduler.js'

const splitterCSS = `
class {
	flex: 0 0 auto;
	background: transparent;
	position: relative;
	z-index: 10;
	touch-action: none;
	align-self: stretch;
}
class[data-orientation='vertical'] {
	width: 8px;
	min-height: 100%;
	cursor: col-resize;
	margin-left: -3px;
	margin-right: -3px;
}
class[data-orientation='horizontal'] {
	height: 8px;
	min-width: 100%;
	cursor: row-resize;
	margin-top: -3px;
	margin-bottom: -3px;
}
class:hover,
class[data-dragging] {
	background: rgba(140, 154, 165, 0.35);
}
`

/**
 * Resizable splitter. Place between two sibling elements inside a
 * flex container; dragging resizes the sibling on one side.
 *
 * @type {Component<{
 * 	orientation?: 'vertical' | 'horizontal'
 * 	target?: 'prev' | 'next'
 * 	min?: number
 * 	max?: number
 * 	initial?: number
 * 	persist?: string
 * 	class?: string
 * }>}
 * @url https://pota.quack.uy/Components/Splitter
 */
export const Splitter = props => {
	const handle = ref()

	const orientation = props.orientation ?? 'vertical'
	const targetSide = props.target ?? 'prev'
	const min = props.min ?? 0
	const max = props.max ?? Infinity

	const dimension = orientation === 'vertical' ? 'width' : 'height'
	const clientCoord =
		orientation === 'vertical' ? 'clientX' : 'clientY'
	const offsetDim =
		orientation === 'vertical' ? 'offsetWidth' : 'offsetHeight'

	const stored = props.persist
		? Number(localStorage.getItem(props.persist))
		: 0
	const initial =
		stored && Number.isFinite(stored) && stored > 0
			? stored
			: props.initial

	const [size, setSize] = signal(initial ?? null)
	const [dragging, setDragging] = signal(false)

	ready(() => {
		const node = handle()
		const target =
			/** @type {HTMLElement | null} */
			(
				targetSide === 'prev'
					? node.previousElementSibling
					: node.nextElementSibling
			)
		if (!target) return

		const applySize = px => {
			target.style[dimension] = px + 'px'
			if (orientation === 'vertical') {
				target.style.maxWidth = px + 'px'
				target.style.minWidth = px + 'px'
			} else {
				target.style.maxHeight = px + 'px'
				target.style.minHeight = px + 'px'
			}
		}

		if (size() != null) applySize(size())

		let active = false
		let startCoord = 0
		let startSize = 0

		const onPointerDown = e => {
			active = true
			setDragging(true)
			startCoord = e[clientCoord]
			startSize = target[offsetDim]
			node.setPointerCapture(e.pointerId)
			document.body.style.userSelect = 'none'
			document.body.style.cursor =
				orientation === 'vertical' ? 'col-resize' : 'row-resize'
			e.preventDefault()
		}

		const onPointerMove = e => {
			if (!active) return
			const delta = e[clientCoord] - startCoord
			const sign = targetSide === 'prev' ? 1 : -1
			const next = Math.max(
				min,
				Math.min(max, startSize + delta * sign),
			)
			setSize(next)
			applySize(next)
		}

		const onPointerUp = e => {
			if (!active) return
			active = false
			setDragging(false)
			try {
				node.releasePointerCapture(e.pointerId)
			} catch {}
			document.body.style.userSelect = ''
			document.body.style.cursor = ''
			if (props.persist && size() != null) {
				localStorage.setItem(props.persist, String(size()))
			}
		}

		node.addEventListener('pointerdown', onPointerDown)
		node.addEventListener('pointermove', onPointerMove)
		node.addEventListener('pointerup', onPointerUp)
		node.addEventListener('pointercancel', onPointerUp)

		cleanup(() => {
			node.removeEventListener('pointerdown', onPointerDown)
			node.removeEventListener('pointermove', onPointerMove)
			node.removeEventListener('pointerup', onPointerUp)
			node.removeEventListener('pointercancel', onPointerUp)

			target.style[dimension] = ''
			if (orientation === 'vertical') {
				target.style.maxWidth = ''
				target.style.minWidth = ''
			} else {
				target.style.maxHeight = ''
				target.style.minHeight = ''
			}
			document.body.style.userSelect = ''
			document.body.style.cursor = ''
		})
	})

	return Component('div', {
		'use:ref': handle,
		'use:css': splitterCSS,
		class: props.class,
		'data-orientation': orientation,
		'data-dragging': dragging,
		role: 'separator',
		'aria-orientation': orientation,
	})
}
