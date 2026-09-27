// MongoDB GridFS resume storage (for production).
// Stores files in the same MongoDB database the app already uses (collections
// resumes.files / resumes.chunks), so they persist across redeploys with no extra
// service, account or dependency. Requires an open Mongoose connection.
import mongoose from 'mongoose'

const BUCKET_NAME = 'resumes'

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME })

export function save(key, buffer) {
  return new Promise((resolve, reject) => {
    bucket()
      .openUploadStream(key, { metadata: { contentType: 'application/pdf' } })
      .on('error', reject)
      .on('finish', resolve)
      .end(buffer)
  })
}

export async function remove(key) {
  const b = bucket()
  const files = await b.find({ filename: key }).toArray()
  await Promise.all(files.map((file) => b.delete(file._id)))
}

// Returns { size } or null when the file does not exist
export async function find(key) {
  const file = await bucket().find({ filename: key }).limit(1).next()
  return file ? { size: file.length } : null
}

export function createStream(key) {
  return bucket().openDownloadStreamByName(key)
}
