// Shared upload helpers for admin routes — multer + GCS plumbing.
// Used by speakers.js (photo/video uploads + staged photo).
import multer from 'multer'
import { Storage } from '@google-cloud/storage'

const GCS_BUCKET = process.env.GCS_BUCKET || 'steven-warehouse-dev-flight-speakers-photos'
const bucket = new Storage().bucket(GCS_BUCKET)

const MAX_IMAGE_SIZE = 5 * 1024 * 1024     // 5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024    // 100 MB
const CACHE_ONE_YEAR = 'public, max-age=31536000'

const ALLOWED_IMAGES = /^image\/(jpeg|png|webp|gif)$/
const ALLOWED_VIDEOS = /^video\/(mp4|webm|quicktime|mov)$/

// Pin output extension to the validated MIME, never trust client filename.
export const IMAGE_EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
export const VIDEO_EXT_BY_MIME = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/mov': '.mov',
}

// Speaker IDs are slugs (see db/queries.js createSpeaker). Reject anything else
// before it reaches the GCS path to block traversal and object overwrite.
export const SPEAKER_ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/

function createUpload(fieldName, mimePattern, maxSize, errorMsg) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      mimePattern.test(file.mimetype) ? cb(null, true) : cb(new Error(errorMsg))
    },
  }).single(fieldName)
}

export const imageUpload = createUpload('photo', ALLOWED_IMAGES, MAX_IMAGE_SIZE, 'Only image files are allowed')
export const videoUpload = createUpload('video', ALLOWED_VIDEOS, MAX_VIDEO_SIZE, 'Only video files (MP4, WebM, MOV) are allowed')

export async function uploadToGCS(file, gcsPath) {
  const blob = bucket.file(gcsPath)
  await blob.save(file.buffer, {
    contentType: file.mimetype,
    metadata: { cacheControl: CACHE_ONE_YEAR },
  })
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}
