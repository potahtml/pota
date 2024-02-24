import { css } from '../../../lib/css/css.js'
import { adoptedStyleSheets } from '../../../lib/dom/elements.js'

export const tokensStyleSheet = css`
	:root,
	:host {
		/* Primary */
		--sl-color-primary-50: var(--sl-color-sky-50);
		--sl-color-primary-100: var(--sl-color-sky-100);
		--sl-color-primary-200: var(--sl-color-sky-200);
		--sl-color-primary-300: var(--sl-color-sky-300);
		--sl-color-primary-400: var(--sl-color-sky-400);
		--sl-color-primary-500: var(--sl-color-sky-500);
		--sl-color-primary-600: var(--sl-color-sky-600);
		--sl-color-primary-700: var(--sl-color-sky-700);
		--sl-color-primary-800: var(--sl-color-sky-800);
		--sl-color-primary-900: var(--sl-color-sky-900);
		--sl-color-primary-950: var(--sl-color-sky-950);

		/* Success */
		--sl-color-success-50: var(--sl-color-green-50);
		--sl-color-success-100: var(--sl-color-green-100);
		--sl-color-success-200: var(--sl-color-green-200);
		--sl-color-success-300: var(--sl-color-green-300);
		--sl-color-success-400: var(--sl-color-green-400);
		--sl-color-success-500: var(--sl-color-green-500);
		--sl-color-success-600: var(--sl-color-green-600);
		--sl-color-success-700: var(--sl-color-green-700);
		--sl-color-success-800: var(--sl-color-green-800);
		--sl-color-success-900: var(--sl-color-green-900);
		--sl-color-success-950: var(--sl-color-green-950);

		/* Warning */
		--sl-color-warning-50: var(--sl-color-amber-50);
		--sl-color-warning-100: var(--sl-color-amber-100);
		--sl-color-warning-200: var(--sl-color-amber-200);
		--sl-color-warning-300: var(--sl-color-amber-300);
		--sl-color-warning-400: var(--sl-color-amber-400);
		--sl-color-warning-500: var(--sl-color-amber-500);
		--sl-color-warning-600: var(--sl-color-amber-600);
		--sl-color-warning-700: var(--sl-color-amber-700);
		--sl-color-warning-800: var(--sl-color-amber-800);
		--sl-color-warning-900: var(--sl-color-amber-900);
		--sl-color-warning-950: var(--sl-color-amber-950);

		/* Danger */
		--sl-color-danger-50: var(--sl-color-red-50);
		--sl-color-danger-100: var(--sl-color-red-100);
		--sl-color-danger-200: var(--sl-color-red-200);
		--sl-color-danger-300: var(--sl-color-red-300);
		--sl-color-danger-400: var(--sl-color-red-400);
		--sl-color-danger-500: var(--sl-color-red-500);
		--sl-color-danger-600: var(--sl-color-red-600);
		--sl-color-danger-700: var(--sl-color-red-700);
		--sl-color-danger-800: var(--sl-color-red-800);
		--sl-color-danger-900: var(--sl-color-red-900);
		--sl-color-danger-950: var(--sl-color-red-950);

		/* Neutral */
		--sl-color-neutral-50: var(--sl-color-gray-50);
		--sl-color-neutral-100: var(--sl-color-gray-100);
		--sl-color-neutral-200: var(--sl-color-gray-200);
		--sl-color-neutral-300: var(--sl-color-gray-300);
		--sl-color-neutral-400: var(--sl-color-gray-400);
		--sl-color-neutral-500: var(--sl-color-gray-500);
		--sl-color-neutral-600: var(--sl-color-gray-600);
		--sl-color-neutral-700: var(--sl-color-gray-700);
		--sl-color-neutral-800: var(--sl-color-gray-800);
		--sl-color-neutral-900: var(--sl-color-gray-900);
		--sl-color-neutral-950: var(--sl-color-gray-950);

		/* Border radii */
		--sl-border-radius-small: 0.1875rem; /* 3px */
		--sl-border-radius-medium: 0.25rem; /* 4px */
		--sl-border-radius-large: 0.5rem; /* 8px */
		--sl-border-radius-x-large: 1rem; /* 16px */

		--sl-border-radius-circle: 50%;
		--sl-border-radius-pill: 9999px;

		/* Spacings */
		--sl-spacing-3x-small: 0.125rem; /* 2px */
		--sl-spacing-2x-small: 0.25rem; /* 4px */
		--sl-spacing-x-small: 0.5rem; /* 8px */
		--sl-spacing-small: 0.75rem; /* 12px */
		--sl-spacing-medium: 1rem; /* 16px */
		--sl-spacing-large: 1.25rem; /* 20px */
		--sl-spacing-x-large: 1.75rem; /* 28px */
		--sl-spacing-2x-large: 2.25rem; /* 36px */
		--sl-spacing-3x-large: 3rem; /* 48px */
		--sl-spacing-4x-large: 4.5rem; /* 72px */

		/* Transitions */
		--sl-transition-x-slow: 1000ms;
		--sl-transition-slow: 500ms;
		--sl-transition-medium: 250ms;
		--sl-transition-fast: 150ms;
		--sl-transition-x-fast: 50ms;

		/* Fonts */
		--sl-font-mono: SFMono-Regular, Consolas, 'Liberation Mono', Menlo,
			monospace;
		--sl-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
			Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji',
			'Segoe UI Emoji', 'Segoe UI Symbol';
		--sl-font-serif: Georgia, 'Times New Roman', serif;

		/* Font sizes */
		--sl-font-size-2x-small: 0.625rem; /* 10px */
		--sl-font-size-x-small: 0.75rem; /* 12px */
		--sl-font-size-small: 0.875rem; /* 14px */
		--sl-font-size-medium: 1rem; /* 16px */
		--sl-font-size-large: 1.25rem; /* 20px */
		--sl-font-size-x-large: 1.5rem; /* 24px */
		--sl-font-size-2x-large: 2.25rem; /* 36px */
		--sl-font-size-3x-large: 3rem; /* 48px */
		--sl-font-size-4x-large: 4.5rem; /* 72px */

		/* Font weights */
		--sl-font-weight-light: 300;
		--sl-font-weight-normal: 400;
		--sl-font-weight-semibold: 500;
		--sl-font-weight-bold: 700;

		/* Letter spacings */
		--sl-letter-spacing-denser: -0.03em;
		--sl-letter-spacing-dense: -0.015em;
		--sl-letter-spacing-normal: normal;
		--sl-letter-spacing-loose: 0.075em;
		--sl-letter-spacing-looser: 0.15em;

		/* Line heights */
		--sl-line-height-denser: 1;
		--sl-line-height-dense: 1.4;
		--sl-line-height-normal: 1.8;
		--sl-line-height-loose: 2.2;
		--sl-line-height-looser: 2.6;

		/* Focus rings */
		--sl-focus-ring-style: solid;
		--sl-focus-ring-width: 3px;
		--sl-focus-ring: var(--sl-focus-ring-style)
			var(--sl-focus-ring-width) var(--sl-focus-ring-color);
		--sl-focus-ring-offset: 1px;

		/* Buttons */
		--sl-button-font-size-small: var(--sl-font-size-x-small);
		--sl-button-font-size-medium: var(--sl-font-size-small);
		--sl-button-font-size-large: var(--sl-font-size-medium);

		/* Inputs */
		--sl-input-height-small: 1.875rem; /* 30px */
		--sl-input-height-medium: 2.5rem; /* 40px */
		--sl-input-height-large: 3.125rem; /* 50px */

		--sl-input-background-color: var(--sl-color-neutral-0);
		--sl-input-background-color-hover: var(
			--sl-input-background-color
		);
		--sl-input-background-color-focus: var(
			--sl-input-background-color
		);
		--sl-input-background-color-disabled: var(--sl-color-neutral-100);
		--sl-input-border-color: var(--sl-color-neutral-300);
		--sl-input-border-color-hover: var(--sl-color-neutral-400);
		--sl-input-border-color-focus: var(--sl-color-primary-500);
		--sl-input-border-color-disabled: var(--sl-color-neutral-300);
		--sl-input-border-width: 1px;
		--sl-input-required-content: '*';
		--sl-input-required-content-offset: -2px;
		--sl-input-required-content-color: var(--sl-input-label-color);

		--sl-input-border-radius-small: var(--sl-border-radius-medium);
		--sl-input-border-radius-medium: var(--sl-border-radius-medium);
		--sl-input-border-radius-large: var(--sl-border-radius-medium);

		--sl-input-font-family: var(--sl-font-sans);
		--sl-input-font-weight: var(--sl-font-weight-normal);
		--sl-input-font-size-small: var(--sl-font-size-small);
		--sl-input-font-size-medium: var(--sl-font-size-medium);
		--sl-input-font-size-large: var(--sl-font-size-large);
		--sl-input-letter-spacing: var(--sl-letter-spacing-normal);

		--sl-input-color: var(--sl-color-neutral-700);
		--sl-input-color-hover: var(--sl-color-neutral-700);
		--sl-input-color-focus: var(--sl-color-neutral-700);
		--sl-input-color-disabled: var(--sl-color-neutral-900);
		--sl-input-icon-color: var(--sl-color-neutral-500);
		--sl-input-icon-color-hover: var(--sl-color-neutral-600);
		--sl-input-icon-color-focus: var(--sl-color-neutral-600);
		--sl-input-placeholder-color: var(--sl-color-neutral-500);
		--sl-input-placeholder-color-disabled: var(
			--sl-color-neutral-600
		);
		--sl-input-spacing-small: var(--sl-spacing-small);
		--sl-input-spacing-medium: var(--sl-spacing-medium);
		--sl-input-spacing-large: var(--sl-spacing-large);

		--sl-input-focus-ring-color: hsl(198.6 88.7% 48.4% / 40%);
		--sl-input-focus-ring-offset: 0;

		--sl-input-filled-background-color: var(--sl-color-neutral-100);
		--sl-input-filled-background-color-hover: var(
			--sl-color-neutral-100
		);
		--sl-input-filled-background-color-focus: var(
			--sl-color-neutral-100
		);
		--sl-input-filled-background-color-disabled: var(
			--sl-color-neutral-100
		);
		--sl-input-filled-color: var(--sl-color-neutral-800);
		--sl-input-filled-color-hover: var(--sl-color-neutral-800);
		--sl-input-filled-color-focus: var(--sl-color-neutral-700);
		--sl-input-filled-color-disabled: var(--sl-color-neutral-800);

		/* Labels */
		--sl-input-label-font-size-small: var(--sl-font-size-small);
		--sl-input-label-font-size-medium: var(--sl-font-size-medium);
		--sl-input-label-font-size-large: var(--sl-font-size-large);
		--sl-input-label-color: inherit;

		/* Help text */
		--sl-input-help-text-font-size-small: var(--sl-font-size-x-small);
		--sl-input-help-text-font-size-medium: var(--sl-font-size-small);
		--sl-input-help-text-font-size-large: var(--sl-font-size-medium);
		--sl-input-help-text-color: var(--sl-color-neutral-500);

		/* Toggles (checkboxes, radios, switches) */
		--sl-toggle-size-small: 0.875rem; /* 14px */
		--sl-toggle-size-medium: 1.125rem; /* 18px */
		--sl-toggle-size-large: 1.375rem; /* 22px */

		/* Panels */
		--sl-panel-border-color: var(--sl-color-neutral-200);
		--sl-panel-border-width: 1px;

		/* Tooltips */
		--sl-tooltip-border-radius: var(--sl-border-radius-medium);
		--sl-tooltip-background-color: var(--sl-color-neutral-800);
		--sl-tooltip-color: var(--sl-color-neutral-0);
		--sl-tooltip-font-family: var(--sl-font-sans);
		--sl-tooltip-font-weight: var(--sl-font-weight-normal);
		--sl-tooltip-font-size: var(--sl-font-size-small);
		--sl-tooltip-line-height: var(--sl-line-height-dense);
		--sl-tooltip-padding: var(--sl-spacing-2x-small)
			var(--sl-spacing-x-small);
		--sl-tooltip-arrow-size: 6px;

		/* Z-indexes */
		--sl-z-index-drawer: 700;
		--sl-z-index-dialog: 800;
		--sl-z-index-dropdown: 900;
		--sl-z-index-toast: 950;
		--sl-z-index-tooltip: 1000;
	}
`

adoptedStyleSheets.push(tokensStyleSheet)
