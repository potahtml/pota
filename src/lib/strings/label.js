export function label(string) {
	return string.replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
}
