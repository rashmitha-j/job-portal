import jwt from 'jsonwebtoken'

const ALGORITHM = 'HS256'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined. Add it to backend/.env (see .env.example).')
  }
  return secret
}

const getExpiresIn = () => process.env.JWT_EXPIRES_IN || '1d'

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, getSecret(), {
    algorithm: ALGORITHM,
    expiresIn: getExpiresIn(),
  })
}

// Checked at startup so a misconfigured deployment fails immediately instead of on first login.
// Returns an error message, or null when the configuration is valid.
export function checkJwtConfig() {
  if (!process.env.JWT_SECRET) {
    return 'JWT_SECRET is not defined. Set it in the environment (locally: backend/.env, see .env.example).'
  }
  const expiresIn = getExpiresIn()
  // jsonwebtoken reads a unit-less numeric string as milliseconds, which is almost never intended
  if (/^\d+$/.test(expiresIn.trim())) {
    return `JWT_EXPIRES_IN "${expiresIn}" has no unit; use a value like 1d, 12h or 3600s.`
  }
  try {
    jwt.sign({}, 'config-check', { algorithm: ALGORITHM, expiresIn })
  } catch {
    return `JWT_EXPIRES_IN "${expiresIn}" is not a valid duration; use a value like 1d, 12h or 3600s.`
  }
  return null
}

// Throws TokenExpiredError / JsonWebTokenError on failure
export function verifyToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] })
}
