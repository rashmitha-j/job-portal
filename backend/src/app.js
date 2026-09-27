import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import jobRoutes from './routes/job.routes.js'
import companyRoutes from './routes/company.routes.js'
import candidateRoutes from './routes/candidate.routes.js'
import savedJobRoutes from './routes/savedJob.routes.js'
import applicationRoutes from './routes/application.routes.js'
import resumeRoutes from './routes/resume.routes.js'
import { notFound, errorHandler } from './middleware/error.middleware.js'

// The deployed frontend's origin. Browsers send Origin without a trailing slash,
// so strip one from the setting to avoid silently blocking every request.
export const CLIENT_ORIGIN = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '')

const app = express()

app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json())

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/candidate', candidateRoutes)
app.use('/api/saved-jobs', savedJobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/resumes', resumeRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
