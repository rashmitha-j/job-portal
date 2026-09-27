import AppError from './AppError.js'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

// Returns a trimmed query-string value, or undefined when missing/empty/not a single string
export function queryString(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function parsePositiveInt(value, name, fallback) {
  const raw = queryString(value)
  if (raw === undefined) return fallback
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new AppError(`${name} must be a positive integer`, 400)
  }
  return Number(raw)
}

// Reads ?page=&limit= and returns values for skip/limit queries
export function getPagination(query) {
  const page = parsePositiveInt(query.page, 'page', 1)
  const limit = Math.min(parsePositiveInt(query.limit, 'limit', DEFAULT_LIMIT), MAX_LIMIT)
  return { page, limit, skip: (page - 1) * limit }
}

export function buildPagination(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}

// Escapes user input for safe use inside a RegExp
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
