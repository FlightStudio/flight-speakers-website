// Shared upload helpers for admin routes — multer + GCS plumbing.
// Used by speakers.js (photo/video uploads + staged photo).
import multer from 'multer'
import { Storage } from '@google-cloud/storage'
import dns from 'dns/promises'
import net from 'net'

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
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      mimePattern.test(file.mimetype) ? cb(null, true) : cb(new Error(errorMsg))
    },
  }).single(fieldName)

  const maxMB = Math.round(maxSize / (1024 * 1024))
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: `File too large. Maximum size is ${maxMB} MB.` })
      }
      return res.status(400).json({ success: false, message: err.message || 'Upload error' })
    })
  }
}

export const imageUpload = createUpload('photo', ALLOWED_IMAGES, MAX_IMAGE_SIZE, 'Only image files are allowed')
export const videoUpload = createUpload('video', ALLOWED_VIDEOS, MAX_VIDEO_SIZE, 'Only video files (MP4, WebM, MOV) are allowed')

// SSRF protection: block RFC-1918 / loopback addresses
const PRIVATE_IP_RE = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

function isPrivateOrLoopback(ip) {
  return PRIVATE_IP_RE.some(re => re.test(ip))
}

// Downloads a video from a remote URL, enforcing SSRF protection and the
// same 100 MB cap as direct uploads. Returns { buffer, mimeType }.
export async function downloadVideoFromUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported')
  }

  const { hostname } = parsed
  if (net.isIP(hostname)) {
    if (isPrivateOrLoopback(hostname)) throw new Error('Private IP addresses are not allowed')
  } else {
    const v4 = await dns.resolve4(hostname).catch(() => [])
    const v6 = await dns.resolve6(hostname).catch(() => [])
    for (const addr of [...v4, ...v6]) {
      if (isPrivateOrLoopback(addr)) throw new Error('URL resolves to a private address')
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  let response
  try {
    response = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'FlightSpeakers/1.0' },
    })
  } catch (err) {
    throw new Error('Failed to fetch video: ' + err.message)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) throw new Error(`Remote server returned ${response.status}`)

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!VIDEO_EXT_BY_MIME[contentType]) {
    throw new Error(`Unsupported content type: ${contentType || 'unknown'}`)
  }

  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > MAX_VIDEO_SIZE) throw new Error('Video exceeds 100 MB limit')

  const chunks = []
  let totalSize = 0
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalSize += value.length
    if (totalSize > MAX_VIDEO_SIZE) {
      await reader.cancel()
      throw new Error('Video exceeds 100 MB limit')
    }
    chunks.push(Buffer.from(value))
  }

  return { buffer: Buffer.concat(chunks), mimeType: contentType }
}

export async function uploadToGCS(file, gcsPath) {
  const blob = bucket.file(gcsPath)
  await blob.save(file.buffer, {
    contentType: file.mimetype,
    metadata: { cacheControl: CACHE_ONE_YEAR },
  })
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}
