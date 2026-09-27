import { Router } from 'express'
import { downloadResume } from '../controllers/resume.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// Access rules (owner candidate / recruiter of an applied job / admin) are checked in the controller
router.get('/:key', authenticate, downloadResume)

export default router
