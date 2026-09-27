import AppError from '../utils/AppError.js'

// Use after authenticate, e.g. router.get('/', authenticate, requireRole('recruiter'), handler)
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401)
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403)
    }
    next()
  }
}
