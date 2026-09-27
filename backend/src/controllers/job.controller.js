import Job from '../models/Job.js'
import Company from '../models/Company.js'
import Application from '../models/Application.js'
import SavedJob from '../models/SavedJob.js'
import { JOB_TYPES, WORK_MODES } from '../models/constants.js'
import AppError from '../utils/AppError.js'
import { sendSuccess } from '../utils/response.js'
import { getPagination, buildPagination, queryString, escapeRegex } from '../utils/query.js'
import { deleteResumeIfUnused } from '../services/resumeService.js'

// Fields a recruiter may set; company and recruiter are always derived server-side
const EDITABLE_FIELDS = ['title', 'description', 'location', 'salary', 'experience', 'skills', 'jobType', 'workMode']

// Company fields shown alongside a job
const COMPANY_SUMMARY = 'name logo location website'
const COMPANY_DETAILS = 'name description logo location website'

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function pickJobFields(body = {}) {
  const data = {}
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field]
  }

  for (const field of ['salary', 'experience']) {
    if (data[field] !== undefined && !isPlainObject(data[field])) {
      throw new AppError(`${field} must be an object`, 400)
    }
  }
  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    throw new AppError('skills must be an array of strings', 400)
  }

  return data
}

// Loads a job and ensures the authenticated recruiter owns it
async function findOwnedJob(jobId, user) {
  const job = await Job.findById(jobId)
  if (!job) {
    throw new AppError('Job not found', 404)
  }
  if (!job.recruiter.equals(user._id)) {
    throw new AppError('You can only modify jobs you posted', 403)
  }
  return job
}

// Builds the MongoDB filter for GET /api/jobs from query parameters
function buildJobFilter(query) {
  const filter = {}

  const search = queryString(query.search)
  if (search) {
    filter.$text = { $search: search }
  }

  const location = queryString(query.location)
  if (location) {
    filter.location = { $regex: escapeRegex(location), $options: 'i' }
  }

  const jobType = queryString(query.jobType)
  if (jobType) {
    if (!JOB_TYPES.includes(jobType)) {
      throw new AppError(`jobType must be one of: ${JOB_TYPES.join(', ')}`, 400)
    }
    filter.jobType = jobType
  }

  const workMode = queryString(query.workMode)
  if (workMode) {
    if (!WORK_MODES.includes(workMode)) {
      throw new AppError(`workMode must be one of: ${WORK_MODES.join(', ')}`, 400)
    }
    filter.workMode = workMode
  }

  // Candidate's years of experience: match jobs whose required range includes it
  const experience = queryString(query.experience)
  if (experience !== undefined) {
    const years = Number(experience)
    if (!Number.isFinite(years) || years < 0) {
      throw new AppError('experience must be a non-negative number', 400)
    }
    filter['experience.min'] = { $lte: years }
    filter.$or = [{ 'experience.max': null }, { 'experience.max': { $gte: years } }]
  }

  return filter
}

// GET /api/jobs
export async function getJobs(req, res) {
  const { page, limit, skip } = getPagination(req.query)
  const filter = buildJobFilter(req.query)
  const sort = filter.$text ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .select('-description')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('company', COMPANY_SUMMARY),
    Job.countDocuments(filter),
  ])

  sendSuccess(res, 200, 'Jobs fetched', { jobs, pagination: buildPagination(page, limit, total) })
}

// GET /api/jobs/recruiter/my-jobs
export async function getMyJobs(req, res) {
  const { page, limit, skip } = getPagination(req.query)
  const filter = { recruiter: req.user._id }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .select('-description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('company', COMPANY_SUMMARY),
    Job.countDocuments(filter),
  ])

  // Number of applicants per job on this page
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobs.map((job) => job._id) } } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
  ])
  const countByJob = new Map(counts.map((c) => [String(c._id), c.count]))
  const jobsWithCounts = jobs.map((job) => ({ ...job.toJSON(), applicantsCount: countByJob.get(String(job._id)) || 0 }))

  sendSuccess(res, 200, 'Your jobs fetched', { jobs: jobsWithCounts, pagination: buildPagination(page, limit, total) })
}

// GET /api/jobs/:id
export async function getJobById(req, res) {
  const job = await Job.findById(req.params.id).populate('company', COMPANY_DETAILS)
  if (!job) {
    throw new AppError('Job not found', 404)
  }
  sendSuccess(res, 200, 'Job fetched', job)
}

// POST /api/jobs
export async function createJob(req, res) {
  const data = pickJobFields(req.body)

  // Jobs are always posted under the recruiter's own company
  const company = await Company.findOne({ recruiter: req.user._id }).select('_id')
  if (!company) {
    throw new AppError('Create your company profile before posting jobs', 400)
  }

  const job = await Job.create({ ...data, company: company._id, recruiter: req.user._id })
  await job.populate('company', COMPANY_DETAILS)

  sendSuccess(res, 201, 'Job created', job)
}

// PUT /api/jobs/:id
export async function updateJob(req, res) {
  const updates = pickJobFields(req.body)
  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided to update', 400)
  }

  const job = await findOwnedJob(req.params.id, req.user)
  job.set(updates)
  await job.save()
  await job.populate('company', COMPANY_DETAILS)

  sendSuccess(res, 200, 'Job updated', job)
}

// DELETE /api/jobs/:id
export async function deleteJob(req, res) {
  const job = await findOwnedJob(req.params.id, req.user)

  // Remove the job and anything that references it
  const resumeKeys = await Application.find({ job: job._id }).distinct('resume')
  await Promise.all([
    job.deleteOne(),
    Application.deleteMany({ job: job._id }),
    SavedJob.deleteMany({ job: job._id }),
  ])
  // Resume snapshots that nothing else uses any more
  await Promise.all(resumeKeys.map(deleteResumeIfUnused))

  sendSuccess(res, 200, 'Job deleted')
}
