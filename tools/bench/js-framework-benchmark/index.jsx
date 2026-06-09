import { render, signal, version } from 'pota'
import { For } from 'pota/components'

import { usePrevious } from 'pota/use/selector'

import { timing } from 'pota/use/time'

let idCounter = 1

function _random(max) {
	return Math.round(Math.random() * 1000) % max
}

function buildData(count) {
	const data = new Array(count)
	for (let i = 0; i < count; i++) {
		const label = signal('elegant green keyboard')

		data[i] = {
			id: idCounter++,
			label: label.read,
			update: label.update,
		}
	}
	return data
}

const Button = ({ id, text, fn }) => (
	<div class="col-sm-6 smallpad">
		<button
			prop:textContent={/** @static */ text}
			id={/** @static */ id}
			type="button"
			class="btn btn-primary btn-block"
			on:click={fn}
		/>
	</div>
)

const App = () => {
	const data = signal([]),
		run = () => {
			// debugger
			data.write(buildData(10))
		},
		runLots = () => {
			data.write(buildData(10000))
		},
		bench = () => {
			//  console.clear()
			// warm
			// debugger
			for (let k = 0; k < 5; k++) {
				data.write(buildData(1))
				data.write([])
			}

			let createLarge = 0
			let clearLarge = 0
			let createSmall = 0
			let clearSmall = 0
			const results = []
			for (let k = 0; k < 10; k++) {
				createLarge += timing(() => data.write(buildData(10000)))
				clearLarge += timing(() => data.write([]))
				results.push(`
					createLarge ${(createLarge / (k + 1)).toFixed(2)} clearLarge ${(clearLarge / (k + 1)).toFixed(2)}
				`)
			}
			for (let k = 0; k < 10; k++) {
				createSmall += timing(() => data.write(buildData(1000)))
				clearSmall += timing(() => data.write([]))
				results.push(`
					createSmall ${(createSmall / (k + 1)).toFixed(2)} clearSmall ${(clearSmall / (k + 1)).toFixed(2)}
				`)
			}
			for (const item of results) console.log(item.trim())
			console.log('------------', version)
		},
		add = () => {
			data.update(d => [...d, ...buildData(1000)])
		},
		update = () => {
			const d = data.read()
			for (let i = 0; i < d.length; i += 10)
				d[i].update(l => l + ' !!!')
		},
		swapRows = () => {
			const d = [...data.read()]
			const tmp = d[1]
			d[1] = d[998]
			d[998] = tmp
			data.write(d)
		},
		clear = () => {
			data.write([])
		},
		remove = id => {
			data.update(d => {
				const idx = d.findIndex(datum => datum.id === id)
				d.splice(idx, 1)
				return [...d]
			})
		},
		danger = usePrevious((next, previous) => {
			next.setAttribute('class', 'danger')

			if (previous) {
				previous.removeAttribute('class')
			}
			return next
		})

	return (
		<div class="container">
			<div class="jumbotron">
				<div class="row">
					<div class="col-md-6">
						<h1>pota Keyed</h1>
					</div>
					<div class="col-md-6">
						<div class="row">
							<Button id="run" text="Create 1,000 rows" fn={run} />
							<Button
								id="runlots"
								text="Create 10,000 rows"
								fn={runLots}
							/>
							<Button id="add" text="Append 1,000 rows" fn={add} />
							<Button
								id="update"
								text="Update every 10th row"
								fn={update}
							/>
							<Button id="clear" text="Clear" fn={clear} />
							<Button id="swaprows" text="Swap Rows" fn={swapRows} />
							<div class="col-sm-6 smallpad">
								<button
									prop:textContent={'bench'}
									id={'bench'}
									type="button"
									class="btn btn-primary btn-block"
									use:ref={e => e.addEventListener('click', bench)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<table class="table table-hover table-striped test-data">
				<tbody
					on:click={e => {
						const element = e.target
						if ('remove' in element.dataset) {
							remove(
								+element.parentNode.parentNode.parentNode.firstChild
									.textContent,
							)
						} else if ('select' in element.dataset) {
							danger(element.parentNode.parentNode)
						}
					}}
				>
					<For each={data.read}>
						{row => {
							return (
								<tr>
									<td
										prop:textContent={/* @static */ row.id}
										class="col-md-1"
									/>
									<td class="col-md-4">
										<a data-select prop:textContent={row.label} />
									</td>
									<td class="col-md-1">
										<a>
											<span
												data-remove
												aria-hidden="true"
												class="glyphicon glyphicon-remove"
											/>
										</a>
									</td>
									<td class="col-md-6" />
								</tr>
							)
						}}
					</For>
				</tbody>
			</table>
			<span
				aria-hidden="true"
				class="preloadicon glyphicon glyphicon-remove"
			/>
		</div>
	)
}

render(App, document.getElementById('main'))
