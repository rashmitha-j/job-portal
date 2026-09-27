import mongoose from 'mongoose'
import { JOB_TYPES, WORK_MODES } from './constants.js'

const MAX_SKILLS = 30

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title must be at most 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: [10000, 'Job description must be at most 10000 characters'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    // Recruiter who posted the job
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter is required'],
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location must be at most 100 characters'],
    },
    // Annual salary range; both bounds optional so "not disclosed" is possible
    salary: {
      min: { type: Number, min: [0, 'Minimum salary cannot be negative'] },
      max: { type: Number, min: [0, 'Maximum salary cannot be negative'] },
      currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'Currency must be a 3-letter code such as INR or USD'],
      },
    },
    // Required experience in years
    experience: {
      min: {
        type: Number,
        min: [0, 'Minimum experience cannot be negative'],
        max: [50, 'Minimum experience must be at most 50 years'],
        default: 0,
      },
      max: {
        type: Number,
        min: [0, 'Maximum experience cannot be negative'],
        max: [50, 'Maximum experience must be at most 50 years'],
      },
    },
    skills: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: [50, 'Each skill must be at most 50 characters'] }],
      validate: {
        validator: (v) => v.length > 0 && v.length <= MAX_SKILLS,
        message: `Provide between 1 and ${MAX_SKILLS} skills`,
      },
    },
    jobType: {
      type: String,
      enum: { values: JOB_TYPES, message: 'Invalid job type: {VALUE}' },
      required: [true, 'Job type is required'],
    },
    workMode: {
      type: String,
      enum: { values: WORK_MODES, message: 'Invalid work mode: {VALUE}' },
      required: [true, 'Work mode is required'],
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
)

// Cross-field checks and skill clean-up (runs before validation on every save)
jobSchema.pre('validate', function () {
  if (Array.isArray(this.skills)) {
    const unique = [...new Set(this.skills.filter(Boolean))]
    if (unique.length !== this.skills.length) this.skills = unique
  }

  const { salary, experience } = this
  if (salary?.min != null && salary?.max != null && salary.max < salary.min) {
    this.invalidate('salary.max', 'Maximum salary cannot be less than minimum salary')
  }
  if (experience?.min != null && experience?.max != null && experience.max < experience.min) {
    this.invalidate('experience.max', 'Maximum experience cannot be less than minimum experience')
  }
})

// Keyword search across job listings
jobSchema.index({ title: 'text', description: 'text', skills: 'text' })
// Newest-first listing
jobSchema.index({ createdAt: -1 })

export default mongoose.model('Job', jobSchema)
