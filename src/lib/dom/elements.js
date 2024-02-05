const bind = fn => document[fn].bind(document)

export const createElement = bind('createElement')

export const createElementNS = bind('createElementNS')

export const createTextNode = bind('createTextNode')
