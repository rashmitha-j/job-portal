import AppError from '../utils/AppError.js'
import { isValidResumeKey, sendResume } from '../services/resumeStorage.js'
import { findReadableResume } from '../services/resumeService.js'

// GET /api/resumes/:key
// Allowed for the candidate who owns it, recruiters who received it with an application
// to one of their jobs, and admins. Everyone else gets 404 so keys can't be probed.
export async function downloadResume(req, res) {
  const { key } = req.params
  if (!isValidResumeKey(key)) {
    throw new AppError('Resume not found', 404)
  }

  const fileName = await findReadableResume(req.user, key)
  if (!fileName) {
    throw new AppError('Resume not found', 404)
  }

  await sendResume(res, key, fileName)
}
