import Application from '../models/Application.js'
import CandidateProfile from '../models/CandidateProfile.js'
import Job from '../models/Job.js'
import { APPLICATION_STATUSES, APPLICATION_STATUS_TRANSITIONS } from '../models/constants.js'
import AppError from '../utils/AppError.js'
import { sendSuccess } from '../utils/response.js'
import { getPagination, buildPagination, queryString } from '../utils/query.js'

const JOB_WITH_COMPANY = {
  path: 'job',
  select: 'title location jobType workMode recruiter company',
  populate: { path: 'company', select: 'name logo location' },
}
// Profile fields a recruiter sees for an applicant (the current profile resume stays private;
// recruiters get the resume snapshot stored on the application)
const APPLICANT_PROFILE_FIELDS = 'user phone location bio skills education experience linkedinUrl githubUrl'

function parseStatusFilter(query) {
  const status = queryString(query.status)
  if (status && !APPLICATION_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${APPLICATION_STATUSES.join(', ')}`, 400)
  }
  return status
}

// Admins can view everything; recruiters only jobs they posted
const canViewJobApplications = (user, job) => user.role === 'admin' || job.recruiter.equals(user._id)

// POST /api/applications/jobs/:jobId
export async function applyToJob(req, res) {
  const candidate = req.user._id
  const jobId = req.params.jobId

  const [job, profile] = await Promise.all([
    Job.exists({ _id: jobId }),
    CandidateProfile.findOne({ user: candidate }).select('resume'),
  ])
  if (!job) {
    throw new AppError('Job not found', 404)
  }
  if (!profile?.resume) {
    throw new AppError('Upload your resume before applying', 400)
  }
  if (await Application.exists({ candidate, job: jobId })) {
    throw new AppError('You have already applied to this job', 409)
  }

  let application
  try {
    // Status always starts at "applied" (schema default); nothing from the body is used
    application = await Application.create({
      candidate,
      job: jobId,
      resume: profile.resume.key,
      resumeName: profile.resume.originalName,
    })
  } catch (err) {
    // Unique { job, candidate } index catches concurrent duplicates
    if (err.code === 11000) throw new AppError('You have already applied to this job', 409)
    throw err
  }

  await application.populate(JOB_WITH_COMPANY)
  sendSuccess(res, 201, 'Application submitted', application)
}

// GET /api/applications/me
export async function getMyApplications(req, res) {
  const { page, limit, skip } = getPagination(req.query)
  const filter = { candidate: req.user._id }
  const status = parseStatusFilter(req.query)
  if (status) filter.status = status

  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit).populate(JOB_WITH_COMPANY),
    Application.countDocuments(filter),
  ])

  sendSuccess(res, 200, 'Applications fetched', { applications, pagination: buildPagination(page, limit, total) })
}

// GET /api/applications/me/jobs/:jobId — the candidate's application for one job, or null
export async function getMyApplicationForJob(req, res) {
  const application = await Application.findOne({ candidate: req.user._id, job: req.params.jobId })
  sendSuccess(res, 200, application ? 'Application fetched' : 'Not applied', application)
}

// GET /api/applications/jobs/:jobId — applicants for a job the recruiter posted
export async function getJobApplicants(req, res) {
  const job = await Job.findById(req.params.jobId).select('title recruiter')
  if (!job) {
    throw new AppError('Job not found', 404)
  }
  if (!canViewJobApplications(req.user, job)) {
    throw new AppError('You can only view applicants for jobs you posted', 403)
  }

  const { page, limit, skip } = getPagination(req.query)
  const filter = { job: job._id }
  const status = parseStatusFilter(req.query)
  if (status) filter.status = status

  const [applications, total, statusGroups] = await Promise.all([
    Application.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit).populate('candidate', 'name email'),
    Application.countDocuments(filter),
    Application.aggregate([{ $match: { job: job._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ])

  // Attach each applicant's profile
  const profiles = await CandidateProfile.find({
    user: { $in: applications.map((a) => a.candidate?._id).filter(Boolean) },
  }).select(APPLICANT_PROFILE_FIELDS)
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]))

  sendSuccess(res, 200, 'Applicants fetched', {
    job: { _id: job._id, title: job.title },
    applications: applications.map((a) => ({
      ...a.toJSON(),
      profile: profileByUser.get(String(a.candidate?._id)) || null,
    })),
    statusCounts: Object.fromEntries(statusGroups.map((g) => [g._id, g.count])),
    pagination: buildPagination(page, limit, total),
  })
}

// GET /api/applications/:id — candidate (own), recruiter (own job) or admin
export async function getApplicationById(req, res) {
  const application = await Application.findById(req.params.id)
    .populate(JOB_WITH_COMPANY)
    .populate('candidate', 'name email')
  if (!application || !application.job) {
    throw new AppError('Application not found', 404)
  }

  const { user } = req
  const isOwnApplication = user.role === 'candidate' && application.candidate._id.equals(user._id)
  const isJobOwner = user.role === 'recruiter' && application.job.recruiter.equals(user._id)
  if (!isOwnApplication && !isJobOwner && user.role !== 'admin') {
    throw new AppError('You do not have access to this application', 403)
  }

  const data = application.toJSON()
  if (user.role !== 'candidate') {
    data.profile = await CandidateProfile.findOne({ user: application.candidate._id }).select(APPLICANT_PROFILE_FIELDS)
  }
  sendSuccess(res, 200, 'Application fetched', data)
}

// PATCH /api/applications/:id/status — recruiter who posted the job only
export async function updateApplicationStatus(req, res) {
  const status = req.body?.status
  if (typeof status !== 'string' || !APPLICATION_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${APPLICATION_STATUSES.join(', ')}`, 400)
  }

  const application = await Application.findById(req.params.id).populate('job', 'recruiter title')
  if (!application || !application.job) {
    throw new AppError('Application not found', 404)
  }
  if (!application.job.recruiter.equals(req.user._id)) {
    throw new AppError('You can only manage applications for jobs you posted', 403)
  }

  const current = application.status
  if (status === current) {
    throw new AppError(`Application is already ${current}`, 400)
  }
  if (!APPLICATION_STATUS_TRANSITIONS[current].includes(status)) {
    const allowed = APPLICATION_STATUS_TRANSITIONS[current]
    throw new AppError(
      allowed.length
        ? `Cannot change status from ${current} to ${status}. Allowed: ${allowed.join(', ')}`
        : `Application is ${current}; its status can no longer change`,
      400
    )
  }

  application.status = status
  await application.save()
  await application.populate('candidate', 'name email')

  sendSuccess(res, 200, `Status updated to ${status}`, application)
}
