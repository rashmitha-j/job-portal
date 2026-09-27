import SavedJob from '../models/SavedJob.js'
import Job from '../models/Job.js'
import AppError from '../utils/AppError.js'
import { sendSuccess } from '../utils/response.js'
import { getPagination, buildPagination } from '../utils/query.js'

// GET /api/saved-jobs
export async function getSavedJobs(req, res) {
  const { page, limit, skip } = getPagination(req.query)
  const filter = { candidate: req.user._id }

  const [saved, total] = await Promise.all([
    SavedJob.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'job',
        select: '-description',
        populate: { path: 'company', select: 'name logo location website' },
      }),
    SavedJob.countDocuments(filter),
  ])

  const savedJobs = saved
    .filter((entry) => entry.job)
    .map((entry) => ({ _id: entry._id, savedAt: entry.createdAt, job: entry.job }))

  sendSuccess(res, 200, 'Saved jobs fetched', { savedJobs, pagination: buildPagination(page, limit, total) })
}

// GET /api/saved-jobs/:jobId
export async function getSavedStatus(req, res) {
  const saved = await SavedJob.exists({ candidate: req.user._id, job: req.params.jobId })
  sendSuccess(res, 200, 'Saved status fetched', { saved: Boolean(saved) })
}

// POST /api/saved-jobs/:jobId
export async function saveJob(req, res) {
  if (!(await Job.exists({ _id: req.params.jobId }))) {
    throw new AppError('Job not found', 404)
  }

  try {
    const saved = await SavedJob.create({ candidate: req.user._id, job: req.params.jobId })
    sendSuccess(res, 201, 'Job saved', { _id: saved._id, job: saved.job, savedAt: saved.createdAt })
  } catch (err) {
    // Unique { candidate, job } index
    if (err.code === 11000) throw new AppError('Job is already saved', 409)
    throw err
  }
}

// DELETE /api/saved-jobs/:jobId
export async function unsaveJob(req, res) {
  const { deletedCount } = await SavedJob.deleteOne({ candidate: req.user._id, job: req.params.jobId })
  if (deletedCount === 0) {
    throw new AppError('Job is not in your saved jobs', 404)
  }
  sendSuccess(res, 200, 'Job removed from saved jobs')
}
