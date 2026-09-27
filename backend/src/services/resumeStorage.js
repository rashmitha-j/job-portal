// Resume file storage.
//
// The rest of the app only uses the functions below and an opaque `key`; where the bytes
// live is decided by a driver chosen with the RESUME_STORAGE environment variable:
//
//   local  (default) – files on disk under UPLOAD_DIR (default backend/uploads). For development.
//   gridfs           – files in MongoDB GridFS, in the app's existing database. Use in production:
//                      it persists across redeploys and needs no extra service.
//
// Another backend (e.g. S3) only needs a driver exporting save / remove / find / createStream.
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import AppError from '../utils/AppError.js'
import * as localDiskDriver from './storage/localDiskDriver.js'
import * as gridfsDriver from './storage/gridfsDriver.js'

const DRIVERS = { local: localDiskDriver, gridfs: gridfsDriver }

export const STORAGE_DRIVER = (process.env.RESUME_STORAGE || 'local').trim().toLowerCase()
const driver = DRIVERS[STORAGE_DRIVER]
if (!driver) {
  throw new Error(`Invalid RESUME_STORAGE "${process.env.RESUME_STORAGE}". Use one of: ${Object.keys(DRIVERS).join(', ')}`)
}

// Keys are server-generated UUIDs, which also rules out path traversal
const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/

export const isValidResumeKey = (key) => typeof key === 'string' && KEY_PATTERN.test(key)

// Stores a validated PDF buffer and returns its storage key
export async function saveResume(buffer) {
  const key = `${randomUUID()}.pdf`
  await driver.save(key, buffer)
  return key
}

export async function deleteResume(key) {
  if (!isValidResumeKey(key)) return
  await driver.remove(key)
}

// Streams the resume to the client as an inline PDF
export async function sendResume(res, key, downloadName = 'resume.pdf') {
  const file = isValidResumeKey(key) ? await driver.find(key) : null
  if (!file) {
    throw new AppError('Resume file is no longer available', 404)
  }

  const asciiName = downloadName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '')
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Length': String(file.size),
    'Content-Disposition': `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  })

  await pipeline(driver.createStream(key), res)
}
