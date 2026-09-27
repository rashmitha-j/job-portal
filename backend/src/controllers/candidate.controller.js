import path from 'node:path'
import CandidateProfile from '../models/CandidateProfile.js'
import Application from '../models/Application.js'
import SavedJob from '../models/SavedJob.js'
import AppError from '../utils/AppError.js'
import { sendSuccess } from '../utils/response.js'
import { saveResume, deleteResume } from '../services/resumeStorage.js'
import { deleteResumeIfUnused } from '../services/resumeService.js'

// Fields a candidate may edit; `user` always comes from req.user and `resume` only via upload
const EDITABLE_FIELDS = ['phone', 'location', 'bio', 'skills', 'education', 'experience', 'linkedinUrl', 'githubUrl']
const ARRAY_FIELDS = ['skills', 'education', 'experience']

// Fields counted towards profile completion
const COMPLETION_FIELDS = {
  phone: 'Phone',
  location: 'Location',
  bio: 'Bio',
  skills: 'Skills',
  education: 'Education',
  experience: 'Experience',
  linkedinUrl: 'LinkedIn',
  githubUrl: 'GitHub',
  resume: 'Resume',
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function pickProfileFields(body = {}) {
  const data = {}
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field]
  }
  for (const field of ARRAY_FIELDS) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      throw new AppError(`${field} must be an array`, 400)
    }
  }
  for (const field of ['education', 'experience']) {
    if (data[field]?.some((entry) => !isPlainObject(entry))) {
      throw new AppError(`Each ${field} entry must be an object`, 400)
    }
  }
  return data
}

function profileCompletion(profile) {
  const isFilled = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))
  const missing = Object.entries(COMPLETION_FIELDS)
    .filter(([field]) => !isFilled(profile?.[field]))
    .map(([, label]) => label)
  const total = Object.keys(COMPLETION_FIELDS).length
  return { percent: Math.round(((total - missing.length) / total) * 100), missing }
}

// GET /api/candidate/profile
export async function getMyProfile(req, res) {
  const profile = await CandidateProfile.findOne({ user: req.user._id })
  sendSuccess(res, 200, profile ? 'Profile fetched' : 'You have not created a profile yet', profile)
}

// PUT /api/candidate/profile (creates the profile on first save)
export async function upsertMyProfile(req, res) {
  const updates = pickProfileFields(req.body)
  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided to update', 400)
  }

  let profile = await CandidateProfile.findOne({ user: req.user._id })
  const isNew = !profile
  if (isNew) profile = new CandidateProfile({ user: req.user._id })

  profile.set(updates)
  await profile.save()

  sendSuccess(res, isNew ? 201 : 200, isNew ? 'Profile created' : 'Profile updated', profile)
}

// POST /api/candidate/profile/resume (multipart/form-data, field "resume")
export async function uploadMyResume(req, res) {
  const originalName = path.basename(req.file.originalname).replace(/[\x00-\x1f\x7f]/g, '').slice(-150) || 'resume.pdf'
  const key = await saveResume(req.file.buffer)

  let previousKey
  let profile
  try {
    profile = (await CandidateProfile.findOne({ user: req.user._id })) || new CandidateProfile({ user: req.user._id })
    previousKey = profile.resume?.key
    profile.resume = { key, originalName, size: req.file.size, uploadedAt: new Date() }
    await profile.save()
  } catch (err) {
    // Don't leave an orphaned file behind if the profile could not be saved
    await deleteResume(key)
    throw err
  }

  // The old file is removed unless an application still uses it
  await deleteResumeIfUnused(previousKey)

  sendSuccess(res, 200, previousKey ? 'Resume replaced' : 'Resume uploaded', profile)
}

// GET /api/candidate/dashboard
export async function getDashboard(req, res) {
  const candidate = req.user._id

  const [profile, savedCount, applicationsCount, statusGroups, recentApplications] = await Promise.all([
    CandidateProfile.findOne({ user: candidate }),
    SavedJob.countDocuments({ candidate }),
    Application.countDocuments({ candidate }),
    Application.aggregate([
      { $match: { candidate } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ candidate })
      .sort({ appliedAt: -1 })
      .limit(5)
      .select('job status appliedAt updatedAt')
      .populate({ path: 'job', select: 'title location company', populate: { path: 'company', select: 'name' } }),
  ])

  sendSuccess(res, 200, 'Dashboard fetched', {
    user: { name: req.user.name, email: req.user.email },
    profile: {
      exists: Boolean(profile),
      location: profile?.location || null,
      skills: profile?.skills || [],
      hasResume: Boolean(profile?.resume),
      completion: profileCompletion(profile),
    },
    savedCount,
    applicationsCount,
    statusCounts: Object.fromEntries(statusGroups.map((g) => [g._id, g.count])),
    recentApplications,
  })
}
