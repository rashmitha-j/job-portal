import mongoose from 'mongoose'

const savedJobSchema = new mongoose.Schema(
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// A candidate can save a job only once; also serves "my saved jobs" queries
savedJobSchema.index({ candidate: 1, job: 1 }, { unique: true })

export default mongoose.model('SavedJob', savedJobSchema)
