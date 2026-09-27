import path from 'node:path'
import multer from 'multer'
import AppError from '../utils/AppError.js'

export const MAX_RESUME_BYTES = 5 * 1024 * 1024 // 5 MB
const PDF_SIGNATURE = Buffer.from('%PDF-')

const upload = multer({
  // Kept in memory only long enough to validate and hand to the storage service
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 0 },
  fileFilter(req, file, cb) {
    const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf'
    cb(isPdf ? null : new AppError('Only PDF files are allowed', 400), isPdf)
  },
})

// Expects multipart/form-data with the file in the "resume" field.
// The declared type/extension is checked above; the content itself must also be a PDF.
export const resumeUpload = [
  upload.single('resume'),
  (req, res, next) => {
    if (!req.file) {
      throw new AppError('Please attach a PDF resume in the "resume" field', 400)
    }
    if (!req.file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
      throw new AppError('The uploaded file is not a valid PDF', 400)
    }
    next()
  },
]
