import mongoose from 'mongoose'

const MAX_SKILLS = 50
const MAX_EDUCATION = 10
const MAX_EXPERIENCE = 20

const LINKEDIN_PATTERN = /^https?:\/\/([a-z0-9-]+\.)*linkedin\.com(\/\S*)?$/i
const GITHUB_PATTERN = /^https?:\/\/(www\.)?github\.com(\/\S*)?$/i
const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/

const yearField = (label) => ({
  type: Number,
  min: [1950, `${label} must be 1950 or later`],
  max: [2100, `${label} must be 2100 or earlier`],
  validate: { validator: Number.isInteger, message: `${label} must be a whole year` },
})

// Rejects an end year earlier than the start year (open-ended entries leave endYear empty)
function checkYearRange() {
  if (this.startYear != null && this.endYear != null && this.endYear < this.startYear) {
    this.invalidate('endYear', 'End year cannot be before start year')
  }
}

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      required: [true, 'Institution is required'],
      trim: true,
      maxlength: [150, 'Institution must be at most 150 characters'],
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
      maxlength: [100, 'Degree must be at most 100 characters'],
    },
    fieldOfStudy: { type: String, trim: true, maxlength: [100, 'Field of study must be at most 100 characters'] },
    startYear: yearField('Start year'),
    endYear: yearField('End year'),
  },
  { _id: false }
)
educationSchema.pre('validate', checkYearRange)

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title must be at most 100 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [150, 'Company must be at most 150 characters'],
    },
    location: { type: String, trim: true, maxlength: [100, 'Location must be at most 100 characters'] },
    startYear: yearField('Start year'),
    // Empty means "present"
    endYear: yearField('End year'),
    description: { type: String, trim: true, maxlength: [2000, 'Description must be at most 2000 characters'] },
  },
  { _id: false }
)
experienceSchema.pre('validate', checkYearRange)

// Current resume; the file itself lives in the resume storage service under `key`
const resumeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 150 },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false }
)

const candidateProfileSchema = new mongoose.Schema(
  {
    // One profile per candidate user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_PATTERN, 'Phone must be 7–20 digits and may include +, spaces, dashes or brackets'],
    },
    location: { type: String, trim: true, maxlength: [100, 'Location must be at most 100 characters'] },
    bio: { type: String, trim: true, maxlength: [2000, 'Bio must be at most 2000 characters'] },
    skills: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: [50, 'Each skill must be at most 50 characters'] }],
      validate: { validator: (v) => v.length <= MAX_SKILLS, message: `Add at most ${MAX_SKILLS} skills` },
    },
    education: {
      type: [educationSchema],
      validate: { validator: (v) => v.length <= MAX_EDUCATION, message: `Add at most ${MAX_EDUCATION} education entries` },
    },
    experience: {
      type: [experienceSchema],
      validate: { validator: (v) => v.length <= MAX_EXPERIENCE, message: `Add at most ${MAX_EXPERIENCE} experience entries` },
    },
    linkedinUrl: {
      type: String,
      trim: true,
      match: [LINKEDIN_PATTERN, 'LinkedIn URL must be a linkedin.com link starting with http(s)://'],
    },
    githubUrl: {
      type: String,
      trim: true,
      match: [GITHUB_PATTERN, 'GitHub URL must be a github.com link starting with http(s)://'],
    },
    resume: { type: resumeSchema, default: undefined },
  },
  { timestamps: true, toJSON: { versionKey: false } }
)

// Normalize skills: drop blanks and duplicates
candidateProfileSchema.pre('validate', function () {
  if (Array.isArray(this.skills)) {
    const unique = [...new Set(this.skills.filter(Boolean))]
    if (unique.length !== this.skills.length) this.skills = unique
  }
})

export default mongoose.model('CandidateProfile', candidateProfileSchema)
