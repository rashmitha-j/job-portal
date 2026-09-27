import { Router } from 'express'
import { createCompany, getMyCompany, getCompanyById, updateCompany } from '../controllers/company.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()
const recruiterOnly = [authenticate, requireRole('recruiter')]

// Recruiter (declared before /:id so "my-company" is not treated as an id)
router.get('/my-company', recruiterOnly, getMyCompany)
router.post('/', recruiterOnly, createCompany)
router.put('/:id', recruiterOnly, validateObjectId('id'), updateCompany)

// Public
router.get('/:id', validateObjectId('id'), getCompanyById)

export default router
