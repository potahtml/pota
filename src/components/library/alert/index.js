import { signalify } from '../../../lib/reactivity/signalify.js'
import { syncEffect } from '../../../lib/reactivity/syncEffect.js'

import { ref } from '../../../@main.js'

import { useTimeout } from '../../../hooks/useTimeout.js'
import { animatePartTo } from '../../../lib/animations/animatePartTo.js'

import {
	customElement,
	CustomElement,
} from '../../../lib/component/CustomElement.js'

import { Show } from '../../flow/Show.js'

// stylesheets
import { animationsStyleSheet } from '../@theme/animations.js'
import { baseStyleSheet } from '../@theme/base.js'
import { styleSheet } from './styleSheet.js'

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
	 * @function open - Opens the alert
	 * @function close - Closes the alert
	 * @function toggle - Toggles alert
	 * @property show - Boolean to tell if the alert is showing
	 * @documentation https://pota.quack.uy/Components/Library/alert
	 *
	 *
	 * @event open - Emitted when the alert opens
	 * @event close - Emitted when the alert closes
	 *
	 * @slot Alert's main content
	 * @slot icon - An icon to display in the alert
	 *
	 * @part base - The component base
	 * @part icon-base - The base that wraps the optional icon
	 * @part message-base - The base that wraps the message
	 * @part close-base - The close button's exported `base` part
	 * @part close - The close button
	 *
	 * @animations pota-alert::part(animation-open) - to change the animation-name for the open animation
	 * @animations pota-alert::part(animation-close) - to change the animation-name for the close animation
	 */

	class extends CustomElement {
		static styleSheets = [
			animationsStyleSheet,
			baseStyleSheet,
			styleSheet,
		]

		/** @type boolean */
		show = false

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
			signalify(this)

			// set html
			this.html = this.render()

			// auto close alert after duration
			this.#hideTimeout = useTimeout(
				() => {
					this.close()
				},
				() => this.duration,
			)
		}

		/** Opens the alert */
		open() {
			this.show = true
		}

		/** Closes the alert */
		close() {
			this.show = false
		}

		/** Toggles the alert */
		toggle() {
			this.show = !this.show
		}

		connectedCallback() {
			this.hidden = !this.show
			let firstRun = true

			syncEffect(async currentEffect => {
				// access for tracking
				const base = this.#base()
				const show = this.show

				// to wait for previous running effect if any
				await currentEffect

				if (show) {
					this.#hideTimeout.start()

					this.hidden = false
					await animatePartTo(
						base,
						'animation-close',
						'animation-open',
					)

					if (!firstRun) this.emit('open')
				} else {
					this.#hideTimeout.stop()

					await animatePartTo(
						base,
						'animation-open',
						'animation-close',
					)
					this.hidden = true

					if (!firstRun) this.emit('close')
				}
				firstRun = false
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
					aria-hidden={() => (this.show ? 'false' : 'true')}
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
							onClick={() => this.close()}
						>
							x
						</pota-icon-button>
					</Show>
				</div>
			)
		}
	},
)
