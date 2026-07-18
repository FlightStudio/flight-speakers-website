import express from 'express'
import crypto from 'crypto'
import { requireAdmin } from '../../middleware/auth.js'
import { getSpeakerById, updateSpeaker } from '../../db/queries.js'
import { createDraft } from '../../db/draft-queries.js'
import { getSpeakerAnalytics, getSpeakerDetailAnalytics } from '../../db/analytics-queries.js'
import { deleteSpeaker } from '../../db/admin-queries.js'
import { validate, speakerCreateSchema, speakerPatchSchema } from '../../schemas/index.js'
import {
  createToken,
  getActiveAvailabilityToken,
  revokeToken,
} from '../../db/token-queries.js'
import {
  imageUpload,
  videoUpload,
  uploadToGCS,
  downloadVideoFromUrl,
  downloadImageFromUrl,
  IMAGE_EXT_BY_MIME,
  VIDEO_EXT_BY_MIME,
  SPEAKER_ID_RE,
} from './_uploads.js'
import { isYouTubeUrl, probeYouTubeFormats, downloadYouTubeVideo } from './_youtube.js'

const router = express.Router()

// ── Uploads ────────────────────────────────────────────────────────────────

router.post('/speakers/:id/photo', requireAdmin, imageUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  if (!SPEAKER_ID_RE.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid speaker id' })
  }
  const ext = IMAGE_EXT_BY_MIME[req.file.mimetype]
  if (!ext) return res.status(400).json({ success: false, message: 'Unsupported image type' })
  try {
    const gcsPath = `speakers/${req.params.id}${ext}`
    const url = await uploadToGCS(req.file, gcsPath)
    await updateSpeaker(req.params.id, { photo: url })
    res.json({ success: true, photo: url })
  } catch (err) {
    console.error('Photo upload error:', err)
    res.status(500).json({ success: false, message: 'Upload failed' })
  }
})

// POST /api/admin/uploads/photo — staged upload for new-speaker flow.
// Returns a GCS URL the client can include in the speaker draft submission.
// No DB write; the URL persists once an `approveDraft` runs and saves it on
// the speaker record. Orphan staged photos accumulate in GCS — a future
// cleanup job should sweep speakers/staged/ older than 7 days.
router.post('/uploads/photo', requireAdmin, imageUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const ext = IMAGE_EXT_BY_MIME[req.file.mimetype]
  if (!ext) return res.status(400).json({ success: false, message: 'Unsupported image type' })
  try {
    const id = crypto.randomBytes(8).toString('hex')
    const gcsPath = `speakers/staged/${id}${ext}`
    const url = await uploadToGCS(req.file, gcsPath)
    res.json({ success: true, photo: url })
  } catch (err) {
    console.error('Staged photo upload error:', err)
    res.status(500).json({ success: false, message: 'Upload failed' })
  }
})

// POST /api/admin/uploads/remove-background — strips the background from a
// speaker photo locally with @imgly/background-removal-node (open-source
// ONNX segmentation). Unlike generative models, it computes an alpha mask
// and keeps the subject's original pixels untouched. Takes the photo's URL,
// returns a staged GCS URL with the transparent PNG — the speaker record
// only changes when the form is saved, so the original photo is untouched
// until then.
router.post('/uploads/remove-background', requireAdmin, async (req, res) => {
  const { photo } = req.body || {}
  if (!photo || typeof photo !== 'string') {
    return res.status(400).json({ success: false, message: 'No photo URL provided' })
  }

  // Lazy import — the package bundles ~80 MB of ONNX models, so it loads on
  // first use rather than at server boot.
  let removeBackground
  try {
    ({ removeBackground } = await import('@imgly/background-removal-node'))
  } catch (err) {
    console.error('Background removal unavailable:', err.message)
    return res.status(503).json({ success: false, message: '@imgly/background-removal-node is not installed — run npm install' })
  }

  try {
    const { buffer, mimeType } = await downloadImageFromUrl(photo)
    if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
      return res.status(400).json({ success: false, message: 'Only JPEG, PNG or WebP photos can be processed' })
    }

    const resultBlob = await removeBackground(new Blob([buffer], { type: mimeType }), {
      output: { format: 'image/png' },
    })
    const outBuffer = Buffer.from(await resultBlob.arrayBuffer())

    const gcsPath = `speakers/staged/${crypto.randomBytes(8).toString('hex')}-nobg.png`
    const url = await uploadToGCS({ buffer: outBuffer, mimetype: 'image/png' }, gcsPath)
    res.json({ success: true, photo: url })
  } catch (err) {
    console.error('Remove background error:', err.message)
    res.status(500).json({ success: false, message: err.message || 'Background removal failed' })
  }
})

// POST /api/admin/youtube/formats — lists available qualities for a YouTube URL.
// No DB write, so the one endpoint serves both new and existing speaker flows.
router.post('/youtube/formats', requireAdmin, async (req, res) => {
  const { url } = req.body
  if (!url || typeof url !== 'string' || !isYouTubeUrl(url)) {
    return res.status(400).json({ success: false, message: 'A valid YouTube URL is required' })
  }
  try {
    const { title, formats } = await probeYouTubeFormats(url)
    res.json({ success: true, title, formats })
  } catch (err) {
    console.error('YouTube formats probe error:', err)
    res.status(400).json({ success: false, message: err.message || 'Failed to read video info' })
  }
})

// POST /api/admin/uploads/video-url — staged download from link for new-speaker flow.
// YouTube URLs go through yt-dlp (with a chosen `quality`); everything else uses
// the direct-file fetch path.
router.post('/uploads/video-url', requireAdmin, async (req, res) => {
  const { url, quality } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'url is required' })
  }
  try {
    const { buffer, mimeType } = isYouTubeUrl(url)
      ? await downloadYouTubeVideo(url, quality)
      : await downloadVideoFromUrl(url)
    const ext = VIDEO_EXT_BY_MIME[mimeType]
    const id = crypto.randomBytes(8).toString('hex')
    const gcsPath = `speakers/staged/videos/${id}${ext}`
    const gcsUrl = await uploadToGCS({ buffer, mimetype: mimeType }, gcsPath)
    res.json({ success: true, videoUrl: gcsUrl })
  } catch (err) {
    console.error('Staged video URL download error:', err)
    res.status(400).json({ success: false, message: err.message || 'Download failed' })
  }
})

// POST /api/admin/uploads/video — staged upload for new-speaker flow.
router.post('/uploads/video', requireAdmin, videoUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const ext = VIDEO_EXT_BY_MIME[req.file.mimetype]
  if (!ext) return res.status(400).json({ success: false, message: 'Unsupported video type' })
  try {
    const id = crypto.randomBytes(8).toString('hex')
    const gcsPath = `speakers/staged/videos/${id}${ext}`
    const url = await uploadToGCS(req.file, gcsPath)
    res.json({ success: true, videoUrl: url })
  } catch (err) {
    console.error('Staged video upload error:', err)
    res.status(500).json({ success: false, message: 'Upload failed' })
  }
})

router.post('/speakers/:id/video-url', requireAdmin, async (req, res) => {
  if (!SPEAKER_ID_RE.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid speaker id' })
  }
  const { url, quality } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'url is required' })
  }
  try {
    const { buffer, mimeType } = isYouTubeUrl(url)
      ? await downloadYouTubeVideo(url, quality)
      : await downloadVideoFromUrl(url)
    const ext = VIDEO_EXT_BY_MIME[mimeType]
    const gcsPath = `speakers/videos/${req.params.id}${ext}`
    const gcsUrl = await uploadToGCS({ buffer, mimetype: mimeType }, gcsPath)
    await updateSpeaker(req.params.id, { videoUrl: gcsUrl })
    res.json({ success: true, videoUrl: gcsUrl })
  } catch (err) {
    console.error('Video URL download error:', err)
    res.status(400).json({ success: false, message: err.message || 'Download failed' })
  }
})

router.post('/speakers/:id/video', requireAdmin, videoUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  if (!SPEAKER_ID_RE.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid speaker id' })
  }
  const ext = VIDEO_EXT_BY_MIME[req.file.mimetype]
  if (!ext) return res.status(400).json({ success: false, message: 'Unsupported video type' })
  try {
    const gcsPath = `speakers/videos/${req.params.id}${ext}`
    const url = await uploadToGCS(req.file, gcsPath)
    await updateSpeaker(req.params.id, { videoUrl: url })
    res.json({ success: true, videoUrl: url })
  } catch (err) {
    console.error('Video upload error:', err)
    res.status(500).json({ success: false, message: 'Upload failed' })
  }
})

// ── CRUD ───────────────────────────────────────────────────────────────────
// /speakers/analytics MUST be defined before /speakers/:id so :id doesn't
// match "analytics". Same constraint inside Express's route matcher.

router.get('/speakers/analytics', requireAdmin, async (req, res) => {
  try {
    const validPeriods = ['day', 'week', 'all']
    const period = validPeriods.includes(req.query.period) ? req.query.period : 'all'
    const analytics = await getSpeakerAnalytics(period)
    res.json({ success: true, analytics })
  } catch (err) {
    console.error('Speaker analytics error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch speaker analytics' })
  }
})

// POST /api/admin/speakers — creates a draft for review
router.post('/speakers', requireAdmin, async (req, res) => {
  const data = validate(req, res, speakerCreateSchema)
  if (!data) return
  try {
    const draft = await createDraft({ type: 'new', data, submittedBy: req.admin.username })
    res.status(201).json({ success: true, draft })
  } catch (err) {
    console.error('Speaker draft create error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit speaker for review' })
  }
})

// PATCH /api/admin/speakers/:id — creates an update draft for review
router.patch('/speakers/:id', requireAdmin, async (req, res) => {
  const data = validate(req, res, speakerPatchSchema)
  if (!data) return
  try {
    const existing = await getSpeakerById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    // Critical #5 fix: drop photo from the patch if unchanged. Photo updates
    // happen via the dedicated upload endpoint, which writes directly. Without
    // this, an admin editing with a stale photo URL in form state could revert
    // a more-recent upload made by another admin (or another tab).
    if (data.photo !== undefined && data.photo === existing.photo) {
      delete data.photo
    }
    const draft = await createDraft({
      speakerId: req.params.id,
      type: 'update',
      data,
      submittedBy: req.admin.username,
    })
    res.json({ success: true, draft })
  } catch (err) {
    console.error('Speaker draft update error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit update for review' })
  }
})

router.get('/speakers/:id', requireAdmin, async (req, res) => {
  try {
    const speaker = await getSpeakerById(req.params.id)
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const analytics = await getSpeakerDetailAnalytics(req.params.id)
    res.json({ success: true, speaker, analytics })
  } catch (err) {
    console.error('Speaker detail error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch speaker details' })
  }
})

router.delete('/speakers/:id', requireAdmin, async (req, res) => {
  try {
    const speaker = await getSpeakerById(req.params.id)
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' })
    }
    const deleted = await deleteSpeaker(req.params.id)
    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete speaker' })
    }
    res.json({ success: true, message: `Speaker "${speaker.name}" deleted` })
  } catch (err) {
    console.error('Speaker delete error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete speaker' })
  }
})

// One un-revoked availability token per speaker. Returns the existing one or
// lazily creates a new one with far-future expiry — effectively perpetual
// until rotated.
router.get('/speakers/:id/availability-link', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    let token = await getActiveAvailabilityToken(id)
    if (!token) {
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 100)
      token = await createToken({
        speakerId: id,
        type: 'availability',
        expiresAt: farFuture.toISOString(),
      })
    }
    res.json({ success: true, token: token.token, createdAt: token.created_at })
  } catch (err) {
    console.error('availability-link error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch link' })
  }
})

router.post('/speakers/:id/availability-link/rotate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const current = await getActiveAvailabilityToken(id)
    if (current) {
      await revokeToken(current.token)
    }
    const farFuture = new Date()
    farFuture.setFullYear(farFuture.getFullYear() + 100)
    const token = await createToken({
      speakerId: id,
      type: 'availability',
      expiresAt: farFuture.toISOString(),
    })
    res.json({ success: true, token: token.token, createdAt: token.created_at })
  } catch (err) {
    console.error('rotate availability-link error:', err)
    res.status(500).json({ success: false, message: 'Failed to rotate link' })
  }
})

export default router
