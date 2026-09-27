import mongoose from 'mongoose'

const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name must be at most 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description must be at most 5000 characters'],
    },
    website: {
      type: String,
      trim: true,
      match: [URL_PATTERN, 'Website must be a valid http(s) URL'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location must be at most 100 characters'],
    },
    // URL of the logo image
    logo: {
      type: String,
      trim: true,
      match: [URL_PATTERN, 'Logo must be a valid http(s) URL'],
    },
    // Recruiter (User with role "recruiter") who owns this company profile.
    // Unique: each recruiter has exactly one company profile.
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter is required'],
      unique: true,
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
)

export default mongoose.model('Company', companySchema)
