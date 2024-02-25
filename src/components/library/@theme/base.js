import { css } from '../../../lib/css/css.js'
import { adoptedStyleSheets } from '../../../lib/dom/elements.js'

export const baseStyleSheet = css`
  :host {
    box-sizing: border-box;
    color-scheme: inherit;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
    color-scheme: inherit;
  }

  [hidden] {
    display: none;
  }
`

adoptedStyleSheets.push(baseStyleSheet)
