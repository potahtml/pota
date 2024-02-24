import { css } from '../../../lib/css/css.js'
import { adoptedStyleSheets } from '../../../lib/dom/elements.js'

/**
 * This file contains utility classes that can't be contained in a
 * component and must be applied to the light DOM. None of the rules
 * in this stylesheet should target component tags or HTML tags, and
 * all classes _must_ start with ".sl-" to reduce the possibility of
 * collisions.
 */

export const utilityStyleSheet = css`
  @supports (scrollbar-gutter: stable) {
    .sl-scroll-lock {
      scrollbar-gutter: stable !important;
      overflow: hidden !important;
    }
  }

  @supports not (scrollbar-gutter: stable) {
    .sl-scroll-lock {
      padding-right: var(--sl-scroll-lock-size) !important;
      overflow: hidden !important;
    }
  }

  .sl-toast-stack {
    position: fixed;
    top: 0;
    inset-inline-end: 0;
    z-index: var(--sl-z-index-toast);
    width: 28rem;
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
  }

  .sl-toast-stack sl-alert {
    margin: var(--sl-spacing-medium);
  }

  .sl-toast-stack sl-alert::part(base) {
    box-shadow: var(--sl-shadow-large);
  }
`

adoptedStyleSheets.push(utilityStyleSheet)
