export const short = string =>
	string.length > 40 ? string.substr(0, 40) + '…' : string
