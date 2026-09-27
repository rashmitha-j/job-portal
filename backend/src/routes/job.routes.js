import { Router } from 'express'
import { getJobs, getMyJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/job.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()
const recruiterOnly = [authenticate, requireRole('recruiter')]

// Public
router.get('/', getJobs)

// Recruiter (declared before /:id so "recruiter" is not treated as an id)
router.get('/recruiter/my-jobs', recruiterOnly, getMyJobs)
router.post('/', recruiterOnly, createJob)
router.put('/:id', recruiterOnly, validateObjectId('id'), updateJob)
router.delete('/:id', recruiterOnly, validateObjectId('id'), deleteJob)

// Public
router.get('/:id', validateObjectId('id'), getJobById)

export default router
