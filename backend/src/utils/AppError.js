// Operational error with an HTTP status code; its message is safe to send to clients
export default class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}
