import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { USER_ROLES } from './constants.js'

const SALT_ROUNDS = 12
export const PASSWORD_MIN_LENGTH = 8
// bcrypt only uses the first 72 bytes of input
export const PASSWORD_MAX_BYTES = 72

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // Stored only as a bcrypt hash; never returned by default
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`],
      validate: {
        validator: (v) => Buffer.byteLength(v, 'utf8') <= PASSWORD_MAX_BYTES,
        message: `Password must be at most ${PASSWORD_MAX_BYTES} bytes`,
      },
      select: false,
    },
    role: {
      type: String,
      enum: { values: USER_ROLES, message: 'Invalid role: {VALUE}' },
      default: 'candidate',
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Strip sensitive/internal fields from every serialized user
      transform(doc, ret) {
        delete ret.password
        delete ret.__v
        return ret
      },
    },
  }
)

// Hash the password whenever it is set or changed (validation runs first, on the plain value)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
})

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)
