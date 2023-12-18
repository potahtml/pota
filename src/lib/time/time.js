export function time(time) {
	let date
	if (time) date = new Date(time)
	else date = new Date()
	return (
		(date.getHours() < 10 ? '0' : '') +
		date.getHours() +
		':' +
		(date.getMinutes() < 10 ? '0' : '') +
		date.getMinutes()
	)
}
