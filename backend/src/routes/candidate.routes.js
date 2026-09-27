import { Router } from 'express'
import { getMyProfile, upsertMyProfile, uploadMyResume, getDashboard } from '../controllers/candidate.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { resumeUpload } from '../middleware/upload.middleware.js'

const router = Router()

// Every route acts on the logged-in candidate's own data
router.use(authenticate, requireRole('candidate'))

router.get('/profile', getMyProfile)
router.put('/profile', upsertMyProfile)
router.post('/profile/resume', resumeUpload, uploadMyResume)
router.get('/dashboard', getDashboard)

export default router
