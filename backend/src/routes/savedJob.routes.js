import { Router } from 'express'
import { getSavedJobs, getSavedStatus, saveJob, unsaveJob } from '../controllers/savedJob.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

// Saved jobs belong to the logged-in candidate
router.use(authenticate, requireRole('candidate'))

router.get('/', getSavedJobs)
router.get('/:jobId', validateObjectId('jobId'), getSavedStatus)
router.post('/:jobId', validateObjectId('jobId'), saveJob)
router.delete('/:jobId', validateObjectId('jobId'), unsaveJob)

export default router
