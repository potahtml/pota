import { css } from '../../../lib/css/css.js'
import { adoptedStyleSheets } from '../../../lib/dom/elements.js'

export const lightStyleSheet = css`
	:root,
	:root.pota-theme-light,
	.pota-theme-light {
		color-scheme: light;

		/* Gray */
		--sl-color-gray-50: hsl(0 0% 97.5%);
		--sl-color-gray-100: hsl(240 4.8% 95.9%);
		--sl-color-gray-200: hsl(240 5.9% 90%);
		--sl-color-gray-300: hsl(240 4.9% 83.9%);
		--sl-color-gray-400: hsl(240 5% 64.9%);
		--sl-color-gray-500: hsl(240 3.8% 46.1%);
		--sl-color-gray-600: hsl(240 5.2% 33.9%);
		--sl-color-gray-700: hsl(240 5.3% 26.1%);
		--sl-color-gray-800: hsl(240 3.7% 15.9%);
		--sl-color-gray-900: hsl(240 5.9% 10%);
		--sl-color-gray-950: hsl(240 7.3% 8%);

		/* Red */
		--sl-color-red-50: hsl(0 85.7% 97.3%);
		--sl-color-red-100: hsl(0 93.3% 94.1%);
		--sl-color-red-200: hsl(0 96.3% 89.4%);
		--sl-color-red-300: hsl(0 93.5% 81.8%);
		--sl-color-red-400: hsl(0 90.6% 70.8%);
		--sl-color-red-500: hsl(0 84.2% 60.2%);
		--sl-color-red-600: hsl(0 72.2% 50.6%);
		--sl-color-red-700: hsl(0 73.7% 41.8%);
		--sl-color-red-800: hsl(0 70% 35.3%);
		--sl-color-red-900: hsl(0 62.8% 30.6%);
		--sl-color-red-950: hsl(0 60% 19.6%);

		/* Orange */
		--sl-color-orange-50: hsl(33.3 100% 96.5%);
		--sl-color-orange-100: hsl(34.3 100% 91.8%);
		--sl-color-orange-200: hsl(32.1 97.7% 83.1%);
		--sl-color-orange-300: hsl(30.7 97.2% 72.4%);
		--sl-color-orange-400: hsl(27 96% 61%);
		--sl-color-orange-500: hsl(24.6 95% 53.1%);
		--sl-color-orange-600: hsl(20.5 90.2% 48.2%);
		--sl-color-orange-700: hsl(17.5 88.3% 40.4%);
		--sl-color-orange-800: hsl(15 79.1% 33.7%);
		--sl-color-orange-900: hsl(15.3 74.6% 27.8%);
		--sl-color-orange-950: hsl(15.2 69.1% 19%);

		/* Amber */
		--sl-color-amber-50: hsl(48 100% 96.1%);
		--sl-color-amber-100: hsl(48 96.5% 88.8%);
		--sl-color-amber-200: hsl(48 96.6% 76.7%);
		--sl-color-amber-300: hsl(45.9 96.7% 64.5%);
		--sl-color-amber-400: hsl(43.3 96.4% 56.3%);
		--sl-color-amber-500: hsl(37.7 92.1% 50.2%);
		--sl-color-amber-600: hsl(32.1 94.6% 43.7%);
		--sl-color-amber-700: hsl(26 90.5% 37.1%);
		--sl-color-amber-800: hsl(22.7 82.5% 31.4%);
		--sl-color-amber-900: hsl(21.7 77.8% 26.5%);
		--sl-color-amber-950: hsl(22.9 74.1% 16.7%);

		/* Yellow */
		--sl-color-yellow-50: hsl(54.5 91.7% 95.3%);
		--sl-color-yellow-100: hsl(54.9 96.7% 88%);
		--sl-color-yellow-200: hsl(52.8 98.3% 76.9%);
		--sl-color-yellow-300: hsl(50.4 97.8% 63.5%);
		--sl-color-yellow-400: hsl(47.9 95.8% 53.1%);
		--sl-color-yellow-500: hsl(45.4 93.4% 47.5%);
		--sl-color-yellow-600: hsl(40.6 96.1% 40.4%);
		--sl-color-yellow-700: hsl(35.5 91.7% 32.9%);
		--sl-color-yellow-800: hsl(31.8 81% 28.8%);
		--sl-color-yellow-900: hsl(28.4 72.5% 25.7%);
		--sl-color-yellow-950: hsl(33.1 69% 13.9%);

		/* Lime */
		--sl-color-lime-50: hsl(78.3 92% 95.1%);
		--sl-color-lime-100: hsl(79.6 89.1% 89.2%);
		--sl-color-lime-200: hsl(80.9 88.5% 79.6%);
		--sl-color-lime-300: hsl(82 84.5% 67.1%);
		--sl-color-lime-400: hsl(82.7 78% 55.5%);
		--sl-color-lime-500: hsl(83.7 80.5% 44.3%);
		--sl-color-lime-600: hsl(84.8 85.2% 34.5%);
		--sl-color-lime-700: hsl(85.9 78.4% 27.3%);
		--sl-color-lime-800: hsl(86.3 69% 22.7%);
		--sl-color-lime-900: hsl(87.6 61.2% 20.2%);
		--sl-color-lime-950: hsl(86.5 60.6% 13.9%);

		/* Green */
		--sl-color-green-50: hsl(138.5 76.5% 96.7%);
		--sl-color-green-100: hsl(140.6 84.2% 92.5%);
		--sl-color-green-200: hsl(141 78.9% 85.1%);
		--sl-color-green-300: hsl(141.7 76.6% 73.1%);
		--sl-color-green-400: hsl(141.9 69.2% 58%);
		--sl-color-green-500: hsl(142.1 70.6% 45.3%);
		--sl-color-green-600: hsl(142.1 76.2% 36.3%);
		--sl-color-green-700: hsl(142.4 71.8% 29.2%);
		--sl-color-green-800: hsl(142.8 64.2% 24.1%);
		--sl-color-green-900: hsl(143.8 61.2% 20.2%);
		--sl-color-green-950: hsl(144.3 60.7% 12%);

		/* Emerald */
		--sl-color-emerald-50: hsl(151.8 81% 95.9%);
		--sl-color-emerald-100: hsl(149.3 80.4% 90%);
		--sl-color-emerald-200: hsl(152.4 76% 80.4%);
		--sl-color-emerald-300: hsl(156.2 71.6% 66.9%);
		--sl-color-emerald-400: hsl(158.1 64.4% 51.6%);
		--sl-color-emerald-500: hsl(160.1 84.1% 39.4%);
		--sl-color-emerald-600: hsl(161.4 93.5% 30.4%);
		--sl-color-emerald-700: hsl(162.9 93.5% 24.3%);
		--sl-color-emerald-800: hsl(163.1 88.1% 19.8%);
		--sl-color-emerald-900: hsl(164.2 85.7% 16.5%);
		--sl-color-emerald-950: hsl(164.3 87.5% 9.4%);

		/* Teal */
		--sl-color-teal-50: hsl(166.2 76.5% 96.7%);
		--sl-color-teal-100: hsl(167.2 85.5% 89.2%);
		--sl-color-teal-200: hsl(168.4 83.8% 78.2%);
		--sl-color-teal-300: hsl(170.6 76.9% 64.3%);
		--sl-color-teal-400: hsl(172.5 66% 50.4%);
		--sl-color-teal-500: hsl(173.4 80.4% 40%);
		--sl-color-teal-600: hsl(174.7 83.9% 31.6%);
		--sl-color-teal-700: hsl(175.3 77.4% 26.1%);
		--sl-color-teal-800: hsl(176.1 69.4% 21.8%);
		--sl-color-teal-900: hsl(175.9 60.8% 19%);
		--sl-color-teal-950: hsl(176.5 58.6% 11.4%);

		/* Cyan */
		--sl-color-cyan-50: hsl(183.2 100% 96.3%);
		--sl-color-cyan-100: hsl(185.1 95.9% 90.4%);
		--sl-color-cyan-200: hsl(186.2 93.5% 81.8%);
		--sl-color-cyan-300: hsl(187 92.4% 69%);
		--sl-color-cyan-400: hsl(187.9 85.7% 53.3%);
		--sl-color-cyan-500: hsl(188.7 94.5% 42.7%);
		--sl-color-cyan-600: hsl(191.6 91.4% 36.5%);
		--sl-color-cyan-700: hsl(192.9 82.3% 31%);
		--sl-color-cyan-800: hsl(194.4 69.6% 27.1%);
		--sl-color-cyan-900: hsl(196.4 63.6% 23.7%);
		--sl-color-cyan-950: hsl(196.8 61% 16.1%);

		/* Sky */
		--sl-color-sky-50: hsl(204 100% 97.1%);
		--sl-color-sky-100: hsl(204 93.8% 93.7%);
		--sl-color-sky-200: hsl(200.6 94.4% 86.1%);
		--sl-color-sky-300: hsl(199.4 95.5% 73.9%);
		--sl-color-sky-400: hsl(198.4 93.2% 59.6%);
		--sl-color-sky-500: hsl(198.6 88.7% 48.4%);
		--sl-color-sky-600: hsl(200.4 98% 39.4%);
		--sl-color-sky-700: hsl(201.3 96.3% 32.2%);
		--sl-color-sky-800: hsl(201 90% 27.5%);
		--sl-color-sky-900: hsl(202 80.3% 23.9%);
		--sl-color-sky-950: hsl(202.3 73.8% 16.5%);

		/* Blue */
		--sl-color-blue-50: hsl(213.8 100% 96.9%);
		--sl-color-blue-100: hsl(214.3 94.6% 92.7%);
		--sl-color-blue-200: hsl(213.3 96.9% 87.3%);
		--sl-color-blue-300: hsl(211.7 96.4% 78.4%);
		--sl-color-blue-400: hsl(213.1 93.9% 67.8%);
		--sl-color-blue-500: hsl(217.2 91.2% 59.8%);
		--sl-color-blue-600: hsl(221.2 83.2% 53.3%);
		--sl-color-blue-700: hsl(224.3 76.3% 48%);
		--sl-color-blue-800: hsl(225.9 70.7% 40.2%);
		--sl-color-blue-900: hsl(224.4 64.3% 32.9%);
		--sl-color-blue-950: hsl(226.2 55.3% 18.4%);

		/* Indigo */
		--sl-color-indigo-50: hsl(225.9 100% 96.7%);
		--sl-color-indigo-100: hsl(226.5 100% 93.9%);
		--sl-color-indigo-200: hsl(228 96.5% 88.8%);
		--sl-color-indigo-300: hsl(229.7 93.5% 81.8%);
		--sl-color-indigo-400: hsl(234.5 89.5% 73.9%);
		--sl-color-indigo-500: hsl(238.7 83.5% 66.7%);
		--sl-color-indigo-600: hsl(243.4 75.4% 58.6%);
		--sl-color-indigo-700: hsl(244.5 57.9% 50.6%);
		--sl-color-indigo-800: hsl(243.7 54.5% 41.4%);
		--sl-color-indigo-900: hsl(242.2 47.4% 34.3%);
		--sl-color-indigo-950: hsl(243.5 43.6% 22.9%);

		/* Violet */
		--sl-color-violet-50: hsl(250 100% 97.6%);
		--sl-color-violet-100: hsl(251.4 91.3% 95.5%);
		--sl-color-violet-200: hsl(250.5 95.2% 91.8%);
		--sl-color-violet-300: hsl(252.5 94.7% 85.1%);
		--sl-color-violet-400: hsl(255.1 91.7% 76.3%);
		--sl-color-violet-500: hsl(258.3 89.5% 66.3%);
		--sl-color-violet-600: hsl(262.1 83.3% 57.8%);
		--sl-color-violet-700: hsl(263.4 70% 50.4%);
		--sl-color-violet-800: hsl(263.4 69.3% 42.2%);
		--sl-color-violet-900: hsl(263.5 67.4% 34.9%);
		--sl-color-violet-950: hsl(265.1 61.5% 21.4%);

		/* Purple */
		--sl-color-purple-50: hsl(270 100% 98%);
		--sl-color-purple-100: hsl(268.7 100% 95.5%);
		--sl-color-purple-200: hsl(268.6 100% 91.8%);
		--sl-color-purple-300: hsl(269.2 97.4% 85.1%);
		--sl-color-purple-400: hsl(270 95.2% 75.3%);
		--sl-color-purple-500: hsl(270.7 91% 65.1%);
		--sl-color-purple-600: hsl(271.5 81.3% 55.9%);
		--sl-color-purple-700: hsl(272.1 71.7% 47.1%);
		--sl-color-purple-800: hsl(272.9 67.2% 39.4%);
		--sl-color-purple-900: hsl(273.6 65.6% 32%);
		--sl-color-purple-950: hsl(276 59.5% 16.5%);

		/* Fuchsia */
		--sl-color-fuchsia-50: hsl(289.1 100% 97.8%);
		--sl-color-fuchsia-100: hsl(287 100% 95.5%);
		--sl-color-fuchsia-200: hsl(288.3 95.8% 90.6%);
		--sl-color-fuchsia-300: hsl(291.1 93.1% 82.9%);
		--sl-color-fuchsia-400: hsl(292 91.4% 72.5%);
		--sl-color-fuchsia-500: hsl(292.2 84.1% 60.6%);
		--sl-color-fuchsia-600: hsl(293.4 69.5% 48.8%);
		--sl-color-fuchsia-700: hsl(294.7 72.4% 39.8%);
		--sl-color-fuchsia-800: hsl(295.4 70.2% 32.9%);
		--sl-color-fuchsia-900: hsl(296.7 63.6% 28%);
		--sl-color-fuchsia-950: hsl(297.1 56.8% 14.5%);

		/* Pink */
		--sl-color-pink-50: hsl(327.3 73.3% 97.1%);
		--sl-color-pink-100: hsl(325.7 77.8% 94.7%);
		--sl-color-pink-200: hsl(325.9 84.6% 89.8%);
		--sl-color-pink-300: hsl(327.4 87.1% 81.8%);
		--sl-color-pink-400: hsl(328.6 85.5% 70.2%);
		--sl-color-pink-500: hsl(330.4 81.2% 60.4%);
		--sl-color-pink-600: hsl(333.3 71.4% 50.6%);
		--sl-color-pink-700: hsl(335.1 77.6% 42%);
		--sl-color-pink-800: hsl(335.8 74.4% 35.3%);
		--sl-color-pink-900: hsl(335.9 69% 30.4%);
		--sl-color-pink-950: hsl(336.2 65.4% 15.9%);

		/* Rose */
		--sl-color-rose-50: hsl(355.7 100% 97.3%);
		--sl-color-rose-100: hsl(355.6 100% 94.7%);
		--sl-color-rose-200: hsl(352.7 96.1% 90%);
		--sl-color-rose-300: hsl(352.6 95.7% 81.8%);
		--sl-color-rose-400: hsl(351.3 94.5% 71.4%);
		--sl-color-rose-500: hsl(349.7 89.2% 60.2%);
		--sl-color-rose-600: hsl(346.8 77.2% 49.8%);
		--sl-color-rose-700: hsl(345.3 82.7% 40.8%);
		--sl-color-rose-800: hsl(343.4 79.7% 34.7%);
		--sl-color-rose-900: hsl(341.5 75.5% 30.4%);
		--sl-color-rose-950: hsl(341.3 70.1% 17.1%);

		/* Neutral one-offs */
		--sl-color-neutral-0: hsl(0, 0%, 100%);
		--sl-color-neutral-1000: hsl(0, 0%, 0%);

		/* Elevations */
		--sl-shadow-x-small: 0 1px 2px hsl(240 3.8% 46.1% / 6%);
		--sl-shadow-small: 0 1px 2px hsl(240 3.8% 46.1% / 12%);
		--sl-shadow-medium: 0 2px 4px hsl(240 3.8% 46.1% / 12%);
		--sl-shadow-large: 0 2px 8px hsl(240 3.8% 46.1% / 12%);
		--sl-shadow-x-large: 0 4px 16px hsl(240 3.8% 46.1% / 12%);

		/* Focus rings */
		--sl-focus-ring-color: var(--sl-color-primary-600);

		/* Overlays */
		--sl-overlay-background-color: hsl(240 3.8% 46.1% / 33%);

		/* Panels */
		--sl-panel-background-color: var(--sl-color-neutral-0);
	}
`

adoptedStyleSheets.push(lightStyleSheet)
