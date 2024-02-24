import { css } from '../../../lib/css/css.js'
import { adoptedStyleSheets } from '../../../lib/dom/elements.js'

export const baseStyleSheet = css`
  :host {
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none;
  }
`

adoptedStyleSheets.push(baseStyleSheet)
