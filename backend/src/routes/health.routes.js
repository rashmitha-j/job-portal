import { Router } from 'express'

const router = Router()

// GET /api/health
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Job Portal API is running',
    timestamp: new Date().toISOString(),
  })
})

export default router
