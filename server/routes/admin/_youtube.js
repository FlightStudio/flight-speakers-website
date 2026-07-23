import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

const MAX_VIDEO_SIZE = 300 * 1024 * 1024 // 300 MB — see plan/SpeakerForm cap
const PROBE_TIMEOUT_MS = 30_000
const DOWNLOAD_TIMEOUT_MS = 180_000
// stderr/stdout cap for the probe (the JSON dump can be large); downloads write
// to disk so their stdio stays small.
const PROBE_MAX_BUFFER = 32 * 1024 * 1024

// Heights we expose as quality options, and the only values accepted back for
// download. Anything yt-dlp reports gets snapped to this ladder.
//
// Capped at 1080p on purpose: above that YouTube only ships VP9/AV1 (often
// 10-bit HDR) with no H.264, and remuxing those into MP4 yields a file the
// browser can't decode (black video, audio fine). H.264 — which plays in every
// browser incl. Safari/iOS — tops out at 1080p, so that's our ceiling.
const ALLOWED_HEIGHTS = [1080, 720, 480, 360, 240, 144]

const HEIGHT_LABELS = {
  1080: '1080p',
  720: '720p',
  480: '480p',
  360: '360p',
  240: '240p',
  144: '144p',
}

// Only H.264 video is universally playable in a hero <video>. A YouTube format
// is usable for us only if its video codec is avc1.
function isH264(format) {
  return String(format.vcodec || '').startsWith('avc1')
}

// Hostnames we route through yt-dlp. Everything else stays on the direct-file
// fetch path in _uploads.js (downloadVideoFromUrl).
const YOUTUBE_HOST_RE = [
  /^(www\.|m\.|music\.)?youtube\.com$/i,
  /^youtu\.be$/i,
  /^(www\.)?youtube-nocookie\.com$/i,
]

export function isYouTubeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  return YOUTUBE_HOST_RE.some(re => re.test(parsed.hostname))
}

// Builds the shared anti-blocking flags. Needs a writable dir for the cookies
// copy (yt-dlp rewrites the file; secret mounts are read-only).
async function buildAntiBlockArgs(tmpDir) {
  const args = []

  if (process.env.YTDLP_PLAYER_CLIENT) {
    args.push('--extractor-args', `youtube:player_client=${process.env.YTDLP_PLAYER_CLIENT}`)
  }
  if (process.env.YTDLP_COOKIES_FILE) {
    const dest = path.join(tmpDir, 'cookies.txt')
    await fs.copyFile(process.env.YTDLP_COOKIES_FILE, dest)
    args.push('--cookies', dest)
  }
  if (process.env.YTDLP_PROXY) args.push('--proxy', process.env.YTDLP_PROXY)
  if (process.env.YTDLP_SOURCE_ADDRESS) {
    args.push('--source-address', process.env.YTDLP_SOURCE_ADDRESS)
  }
  if (process.env.YTDLP_SLEEP_REQUESTS) {
    args.push('--sleep-requests', String(process.env.YTDLP_SLEEP_REQUESTS))
  }
  if (process.env.YTDLP_RATE_LIMIT) {
    args.push('--limit-rate', process.env.YTDLP_RATE_LIMIT)
  }

  return args
}

// Lists the distinct video qualities available for a YouTube URL, snapped to
// ALLOWED_HEIGHTS. Returns { title, formats: [{ height, label }] } sorted desc.
export async function probeYouTubeFormats(rawUrl) {
  if (!isYouTubeUrl(rawUrl)) throw new Error('Not a supported YouTube URL')

  let stdout
  try {
    ({ stdout } = await execFileAsync(
      'yt-dlp',
      [
        '-J',
        '--no-warnings',
        '--no-playlist',
        '--',
        rawUrl
      ],
      { timeout: PROBE_TIMEOUT_MS, maxBuffer: PROBE_MAX_BUFFER },
    ))
  } catch (err) {
    throw new Error(parseYtdlpError(err))
  }

  let info
  try {
    info = JSON.parse(stdout)
  } catch {
    throw new Error('Could not read video info')
  }

  const present = new Set()
  for (const f of info.formats || []) {
    // Keep only real H.264 video streams — those are the ones we can store as a
    // browser-playable MP4. Audio-only/storyboard/VP9/AV1 are skipped.
    if (!f.height || !isH264(f)) continue
    const snapped = snapHeight(f.height)
    if (snapped) present.add(snapped)
  }

  const formats = ALLOWED_HEIGHTS
    .filter(h => present.has(h))
    .map(h => ({ height: h, label: HEIGHT_LABELS[h] }))

  if (formats.length === 0) throw new Error('No downloadable video qualities found')

  return { title: info.title || 'Untitled', formats }
}

// Downloads a YouTube video at (up to) the requested height, merging into MP4.
// Returns { buffer, mimeType } matching downloadVideoFromUrl in _uploads.js, so
// the caller's GCS upload code is reused unchanged.
export async function downloadYouTubeVideo(rawUrl, quality) {
  if (!isYouTubeUrl(rawUrl)) throw new Error('Not a supported YouTube URL')

  const height = Number(quality)
  if (!Number.isInteger(height) || !ALLOWED_HEIGHTS.includes(height)) {
    throw new Error('Invalid or missing quality')
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ytdl-'))
  try {
    const antiBlock = await buildAntiBlockArgs(dir)

    // Prefer the best H.264 video + AAC audio at-or-below the chosen height,
    // merged to MP4 (guaranteed browser-playable). Fall back to a progressive
    // H.264 stream, then any progressive stream as a last resort.
    const selector =
      `bv*[height<=${height}][vcodec^=avc1]+ba[acodec^=mp4a]/` +
      `b[height<=${height}][vcodec^=avc1]/` +
      `b[height<=${height}]`
    const outTemplate = path.join(dir, 'video.%(ext)s')

    try {
      await execFileAsync(
        'yt-dlp',
        [
          '-f', selector,
          '--merge-output-format', 'mp4',
          '--no-playlist',
          '--no-part',
          '--no-warnings',
          '--max-filesize', String(MAX_VIDEO_SIZE),
          '-o', outTemplate,
          ...antiBlock,
          '--', rawUrl,
        ],
        { timeout: DOWNLOAD_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      )
    } catch (err) {
      throw new Error(parseYtdlpError(err))
    }

    const files = await fs.readdir(dir)
    const outFile = files.find(f => f.startsWith('video.') && f !== 'cookies.txt')
    if (!outFile) throw new Error('Download produced no file (video may exceed 300 MB)')

    const filePath = path.join(dir, outFile)
    const { size } = await fs.stat(filePath)
    if (size > MAX_VIDEO_SIZE) throw new Error('Video exceeds 300 MB limit')

    const buffer = await fs.readFile(filePath)
    return { buffer, mimeType: 'video/mp4' }
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

function snapHeight(height) {
  // Map an actual stream height to the nearest standard rung at or below it
  // (e.g. 1072 -> 1080? no — at-or-below, so 720). Pick the largest rung <= h.
  for (const h of ALLOWED_HEIGHTS) {
    if (height >= h) return h
  }
  return null
}

// yt-dlp surfaces useful detail on stderr; pull a clean line for the admin.
function parseYtdlpError(err) {
  if (err?.killed || err?.signal === 'SIGTERM') return 'Download timed out'
  const stderr = (err?.stderr || '').toString()
  if (/Sign in to confirm/i.test(stderr)) {
    return 'YouTube bot check hit — set YTDLP_COOKIES_FILE (or a proxy) on the service'
  }
  const line = stderr.split('\n').map(l => l.trim()).find(l => l.startsWith('ERROR:'))
  if (line) return line.replace(/^ERROR:\s*/, '').slice(0, 300)
  if (/ENOENT/.test(err?.message || '')) return 'yt-dlp is not installed on the server'
  return 'Failed to fetch the YouTube video'
}
