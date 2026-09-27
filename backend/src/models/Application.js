import mongoose from 'mongoose'
import { APPLICATION_STATUSES } from './constants.js'

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate is required'],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    // Storage key of the resume submitted with this application (snapshot at time of applying,
    // so later resume replacements don't change what the recruiter received).
    // Downloaded via GET /api/resumes/:key.
    resume: {
      type: String,
      required: [true, 'Resume is required'],
      trim: true,
    },
    resumeName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: { values: APPLICATION_STATUSES, message: 'Invalid status: {VALUE}' },
      default: 'applied',
    },
  },
  { timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' }, toJSON: { versionKey: false } }
)

// A candidate can apply to a job only once; also serves "applications for a job" queries
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true })
// "My applications" for a candidate, newest first
applicationSchema.index({ candidate: 1, appliedAt: -1 })

export default mongoose.model('Application', applicationSchema)
