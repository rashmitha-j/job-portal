import AppError from '../utils/AppError.js'

// Unknown routes
export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404))
}

// Central error handler: always responds with { success: false, message }
// and never exposes stack traces or internal details to the client
export function errorHandler(err, req, res, next) {
  // A response already in progress (e.g. a file stream that failed midway) can't be
  // replaced with JSON; let Express close the connection
  if (res.headersSent) {
    console.error(err)
    return next(err)
  }

  let statusCode = 500
  let message = 'Internal server error'

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((e) => (e.name === 'CastError' ? `Invalid value for ${e.path}` : e.message))
      .join(', ')
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid value for ${err.path}`
  } else if (err.code === 11000) {
    statusCode = 409
    message = `${Object.keys(err.keyValue || {}).join(', ') || 'Resource'} already exists`
  } else if (err.name === 'MulterError') {
    statusCode = 400
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Resume must be at most 5 MB'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Upload a single file in the "resume" field'
          : 'Invalid file upload'
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400
    message = 'Malformed JSON in request body'
  }

  if (statusCode >= 500) {
    console.error(err)
  }

  res.status(statusCode).json({ success: false, message })
}
