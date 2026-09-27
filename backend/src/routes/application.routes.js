import { Router } from 'express'
import {
  applyToJob,
  getMyApplications,
  getMyApplicationForJob,
  getJobApplicants,
  getApplicationById,
  updateApplicationStatus,
} from '../controllers/application.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

router.use(authenticate)

// Candidate
router.post('/jobs/:jobId', requireRole('candidate'), validateObjectId('jobId'), applyToJob)
router.get('/me', requireRole('candidate'), getMyApplications)
router.get('/me/jobs/:jobId', requireRole('candidate'), validateObjectId('jobId'), getMyApplicationForJob)

// Recruiter (own jobs only) / admin
router.get('/jobs/:jobId', requireRole('recruiter', 'admin'), validateObjectId('jobId'), getJobApplicants)
router.patch('/:id/status', requireRole('recruiter'), validateObjectId('id'), updateApplicationStatus)

// Candidate (own), recruiter (own job) or admin — checked in the controller
router.get('/:id', validateObjectId('id'), getApplicationById)

export default router
