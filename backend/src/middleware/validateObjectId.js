import AppError from '../utils/AppError.js'

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

// Rejects requests whose :param is not a valid MongoDB ObjectId, e.g. validateObjectId('id')
export function validateObjectId(param = 'id') {
  return (req, res, next) => {
    if (!OBJECT_ID_PATTERN.test(req.params[param])) {
      throw new AppError(`Invalid ${param}`, 400)
    }
    next()
  }
}
