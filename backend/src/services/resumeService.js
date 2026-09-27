import Application from '../models/Application.js'
import CandidateProfile from '../models/CandidateProfile.js'
import Job from '../models/Job.js'
import { deleteResume } from './resumeStorage.js'

// Deletes a resume file only when neither a profile nor any application still references it.
// Applications keep a snapshot of the resume they were submitted with, so replacing a
// profile resume must not remove a file a recruiter still needs.
export async function deleteResumeIfUnused(key) {
  if (!key) return
  const [inProfile, inApplication] = await Promise.all([
    CandidateProfile.exists({ 'resume.key': key }),
    Application.exists({ resume: key }),
  ])
  if (!inProfile && !inApplication) {
    await deleteResume(key)
  }
}

// Used by the resume download route: may this user read the resume stored under `key`?
// Returns the file name to use, or null when access is not allowed.
export async function findReadableResume(user, key) {
  if (user.role === 'candidate') {
    const profile = await CandidateProfile.findOne({ user: user._id, 'resume.key': key }).select('resume')
    if (profile) return profile.resume.originalName
    const own = await Application.findOne({ candidate: user._id, resume: key }).select('resumeName')
    return own ? own.resumeName || 'resume.pdf' : null
  }

  const applications = await Application.find({ resume: key }).select('job resumeName')
  if (applications.length === 0) {
    if (user.role !== 'admin') return null
    const profile = await CandidateProfile.findOne({ 'resume.key': key }).select('resume')
    return profile ? profile.resume.originalName : null
  }
  if (user.role === 'admin') return applications[0].resumeName || 'resume.pdf'

  if (user.role === 'recruiter') {
    const ownedJobIds = await Job.find({
      _id: { $in: applications.map((a) => a.job) },
      recruiter: user._id,
    }).distinct('_id')
    const match = applications.find((a) => ownedJobIds.some((id) => id.equals(a.job)))
    return match ? match.resumeName || 'resume.pdf' : null
  }
  return null
}
