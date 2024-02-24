import { mutable } from '../../../lib/reactivity/mutable.js'
import {
	customElement,
	CustomElement,
} from '../../../lib/component/CustomElement.js'
import { Show } from '../../flow/Show.js'

import { useTimeout } from '../../../hooks/useTimeout.js'
import { ref } from '../../../@main.js'

import { styleSheet } from './styleSheet.js'
import { animationsStyleSheet } from '../@theme/animations.js'
import { animatePartTo } from '../../../lib/animations/animatePartTo.js'
import { syncEffect } from '../../../lib/reactivity/syncEffect.js'

/*
TODO
- pota-icon-button
- hasSlot as signal
*/

customElement(
	'pota-alert',
	/**
	 * Alerts are used to display messages that require attention
	 *
	 * @function show - Opens the alert
	 * @function hide - Closes the alert
	 * @function toggle - Toggles alert
	 * @documentation https://pota.quack.uy/Components/Library/alert
	 *
	 *
	 * @event show - Emitted when the alert shows
	 * @event hide - Emitted when the alert hides
	 *
	 * @slot Alert's main content
	 * @slot icon - An icon to show in the alert
	 *
	 * @part base - The component base
	 * @part icon-base - The base that wraps the optional icon
	 * @part message-base - The base that wraps the message
	 * @part close-base - The close button's exported `base` part
	 * @part close - The close button
	 *
	 * @animations pota-alert::part(animation-show) - to change the animation-name for the show animation
	 * @animations pota-alert::part(animation-hide) - to change the animation-name for the close animation
	 */

	class extends CustomElement {
		static styleSheets = [styleSheet, animationsStyleSheet]

		/** @type boolean */
		open = false

		/** @type boolean */
		closable = false

		/** @type number - To hide after N milliseconds */
		duration = Infinity

		/**
		 * @type {'primary'
		 * 	| 'success'
		 * 	| 'neutral'
		 * 	| 'warning'
		 * 	| 'danger'}
		 */
		variant = 'neutral'

		/* private */
		#base = ref()
		#hideTimeout

		constructor() {
			super()

			// make signals from properties
			mutable(this)

			// set html
			this.html = this.render()

			// auto hide alert after duration
			this.#hideTimeout = useTimeout(
				() => {
					this.hide()
				},
				() => this.duration,
			)
		}

		/** Shows the alert */
		show() {
			this.open = true
		}

		/** Hides the alert */
		hide() {
			this.open = false
		}

		/** Toggles the alert */
		toggle() {
			this.open = !this.open
		}

		connectedCallback() {
			this.hidden = !this.open

			syncEffect(async currentEffect => {
				// access for tracking
				const base = this.#base()
				const open = this.open

				// to wait for previous running effect if any
				await currentEffect

				if (open) {
					this.#hideTimeout.start()

					this.hidden = false
					await animatePartTo(
						base,
						'animation-hide',
						'animation-show',
					)

					this.emit('open')
				} else {
					this.#hideTimeout.stop()

					await animatePartTo(
						base,
						'animation-show',
						'animation-hide',
					)
					this.hidden = true

					this.emit('close')
				}
			})
		}

		render() {
			return (
				<div
					ref={this.#base}
					part="base"
					class:base={true}
					class:closable={() => this.closable}
					class:has-icon={() => this.hasSlot('icon')}
					data-variant={() => this.variant}
					onMouseMove={() => this.#hideTimeout.start()}
					aria-hidden={() => (this.open ? 'false' : 'true')}
					role="alert"
				>
					<div
						part="icon-base"
						class="icon"
					>
						<slot name="icon" />
					</div>

					<div
						part="message-base"
						class="message"
						aria-live="polite"
					>
						<slot />
					</div>

					<Show when={() => this.closable}>
						<pota-icon-button
							part="close-base"
							exportparts="base:close"
							class="close"
							name="x-lg"
							label="x"
							onClick={() => this.hide()}
						>
							x
						</pota-icon-button>
					</Show>
				</div>
			)
		}
	},
)
