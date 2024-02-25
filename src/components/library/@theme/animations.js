import { css } from '../../../lib/css/css.js'
import { adoptedStyleSheets } from '../../../lib/dom/elements.js'

export const animationsStyleSheet = css`
	@keyframes pota-scale-fade-in {
		from {
			opacity: 0;
			scale: 0.8;
		}
		to {
			opacity: 1;
			scale: 1;
		}
	}

	@keyframes pota-scale-fade-out {
		from {
			opacity: 1;
			scale: 1;
		}
		to {
			opacity: 0;
			scale: 0.8;
		}
	}
`

adoptedStyleSheets.push(animationsStyleSheet)
