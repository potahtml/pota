import { css } from '../../../lib/css/css.js'

export const styleSheet = css`
	:host {
		display: contents;
		margin: 0;
	}

	:host::part(base) {
		animation: pota-scale-fade-out var(--sl-transition-fast) ease;
		animation-fill-mode: forwards;
	}
	:host::part(animation-open) {
		animation: pota-scale-fade-in var(--sl-transition-fast) ease;
	}
	:host::part(animation-close) {
		animation: pota-scale-fade-out var(--sl-transition-fast) ease;
	}

	.base {
		position: relative;
		display: flex;
		align-items: stretch;
		background-color: var(--sl-panel-background-color);
		border: solid var(--sl-panel-border-width)
			var(--sl-panel-border-color);
		border-top-width: calc(var(--sl-panel-border-width) * 3);
		border-radius: var(--sl-border-radius-medium);
		/*font-family: var(--sl-font-sans);
		font-size: var(--sl-font-size-small);
		font-weight: var(--sl-font-weight-normal);
		line-height: 1.6;*/
		color: var(--sl-color-neutral-700);
		margin: inherit;
	}

	.base:not(.has-icon) .icon,
	.base:not(.closable) .close-button {
		display: none;
	}

	.message {
		flex: 1 1 auto;
		display: block;
		padding: var(--sl-spacing-large);
		overflow: hidden;
	}

	.close {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		font-size: var(--sl-font-size-medium);
		padding-inline-end: var(--sl-spacing-medium);
	}

	.icon {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		font-size: var(--sl-font-size-large);
		padding-inline-start: var(--sl-spacing-large);
	}

	.base[data-variant='primary'] {
		border-top-color: var(--sl-color-primary-600);
	}

	.base[data-variant='primary'] .icon {
		color: var(--sl-color-primary-600);
	}

	.base[data-variant='success'] {
		border-top-color: var(--sl-color-success-600);
	}

	.base[data-variant='success'] .icon {
		color: var(--sl-color-success-600);
	}

	.base[data-variant='neutral'] {
		border-top-color: var(--sl-color-neutral-600);
	}

	.base[data-variant='neutral'] .icon {
		color: var(--sl-color-neutral-600);
	}

	.base[data-variant='warning'] {
		border-top-color: var(--sl-color-warning-600);
	}

	.base[data-variant='warning'] .icon {
		color: var(--sl-color-warning-600);
	}

	.base[data-variant='danger'] {
		border-top-color: var(--sl-color-danger-600);
	}

	.base[data-variant='danger'] .icon {
		color: var(--sl-color-danger-600);
	}
`
