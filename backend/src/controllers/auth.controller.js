import bcrypt from 'bcrypt'
import User, { PASSWORD_MIN_LENGTH, PASSWORD_MAX_BYTES } from '../models/User.js'
import AppError from '../utils/AppError.js'
import { signToken } from '../utils/jwt.js'

// Roles a user may choose at registration; admins are created out-of-band
const SELF_REGISTER_ROLES = ['candidate', 'recruiter']

// Compared against when the email is unknown so login takes similar time either way
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== ''

function authResponse(res, statusCode, message, user) {
  res.status(statusCode).json({
    success: true,
    message,
    data: { user, token: signToken(user) },
  })
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password, role = 'candidate' } = req.body ?? {}

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new AppError('Name, email and password are required', 400)
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`, 400)
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    throw new AppError(`Password must be at most ${PASSWORD_MAX_BYTES} bytes`, 400)
  }
  if (role === 'admin') {
    throw new AppError('Admin accounts cannot be self-registered', 403)
  }
  if (!SELF_REGISTER_ROLES.includes(role)) {
    throw new AppError(`Role must be one of: ${SELF_REGISTER_ROLES.join(', ')}`, 400)
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError('An account with this email already exists', 409)
  }

  // Password is hashed by the User model's pre-save hook.
  // A concurrent duplicate still fails on the unique index (handled as 409).
  const user = await User.create({ name, email: normalizedEmail, password, role })

  authResponse(res, 201, 'Registration successful', user)
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body ?? {}

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new AppError('Email and password are required', 400)
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH)

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401)
  }

  authResponse(res, 200, 'Login successful', user)
}

// GET /api/auth/me
export function getMe(req, res) {
  res.status(200).json({ success: true, data: { user: req.user } })
}
