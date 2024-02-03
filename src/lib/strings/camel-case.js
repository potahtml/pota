export const camelCase = s =>
	s.replace(/-([a-z])/g, g => g[1].toUpperCase())
