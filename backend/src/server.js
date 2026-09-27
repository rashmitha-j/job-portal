import 'dotenv/config'
import app, { CLIENT_ORIGIN } from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { checkJwtConfig } from './utils/jwt.js'
import { STORAGE_DRIVER } from './services/resumeStorage.js'
// Register all models so their indexes are built on startup
import './models/index.js'

// Hosts such as Render provide PORT; 5000 is the local default
const PORT = process.env.PORT || 5000

async function start() {
  const jwtConfigError = checkJwtConfig()
  if (jwtConfigError) {
    console.error(jwtConfigError)
    process.exit(1)
  }
  if (!process.env.CLIENT_URL) {
    console.warn(`CLIENT_URL is not set; CORS only allows ${CLIENT_ORIGIN}`)
  }

  try {
    await connectDB()
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`)
    process.exit(1)
  }

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (CORS origin: ${CLIENT_ORIGIN}, resume storage: ${STORAGE_DRIVER})`)
  })

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`)
    server.close(async () => {
      await disconnectDB()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start()
