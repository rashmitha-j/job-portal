// Local-disk resume storage (default; for local development).
// Files do NOT survive redeploys on most hosts (ephemeral filesystems).
import { createReadStream } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : fileURLToPath(new URL('../../../uploads', import.meta.url))
const RESUME_DIR = path.join(UPLOAD_ROOT, 'resumes')

const filePathFor = (key) => path.join(RESUME_DIR, key)

export async function save(key, buffer) {
  await mkdir(RESUME_DIR, { recursive: true })
  await writeFile(filePathFor(key), buffer, { flag: 'wx' })
}

export async function remove(key) {
  await rm(filePathFor(key), { force: true })
}

// Returns { size } or null when the file does not exist
export async function find(key) {
  try {
    const { size } = await stat(filePathFor(key))
    return { size }
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

export function createStream(key) {
  return createReadStream(filePathFor(key))
}
