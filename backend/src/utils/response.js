// Consistent success envelope: { success: true, message, data }
export function sendSuccess(res, statusCode, message, data = null) {
  res.status(statusCode).json({ success: true, message, data })
}
