import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { verifyToken } from '../utils/jwt.js'

// Requires a valid "Authorization: Bearer <token>" header and attaches the user to req.user
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required', 401)
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token'
    throw new AppError(message, 401)
  }

  // Load the user from the database so role and existence are always current,
  // rather than trusting anything sent by the client
  const user = await User.findById(payload.id)
  if (!user) {
    throw new AppError('User no longer exists', 401)
  }

  req.user = user
  next()
}
