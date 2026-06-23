// One-off seeder for speaker book covers. Downloads from Open Library
// (or reads from a local file for books OL doesn't have), uploads to GCS,
// and prints a JS snippet to paste into server/data/speakers.js.
//
// Run: node server/scripts/seed-books.js
//
// For books with `localPath`, drop the cover image at the path before running.

import 'dotenv/config'
import { Storage } from '@google-cloud/storage'
import { readFile } from 'node:fs/promises'

const GCS_BUCKET = process.env.GCS_BUCKET || 'steven-warehouse-dev-flight-speakers-photos'
const bucket = new Storage().bucket(GCS_BUCKET)

const SMALL_FILE_THRESHOLD = 20 * 1024 // 20 KB — warn if cover is suspiciously low-res

const BOOKS = [
  // Steven Bartlett
  { speakerId: 'steven-bartlett', slug: 'the-diary-of-a-ceo', title: 'The Diary of a CEO', openLibraryCoverId: 15208285 },
  { speakerId: 'steven-bartlett', slug: 'happy-sexy-millionaire', title: 'Happy Sexy Millionaire', openLibraryCoverId: 12440455 },
  // Nir Eyal
  { speakerId: 'nir-eyal', slug: 'hooked', title: 'Hooked', openLibraryCoverId: 12511799 },
  { speakerId: 'nir-eyal', slug: 'indistractable', title: 'Indistractable', openLibraryCoverId: 9129784 },
  // Vanessa Van Edwards
  { speakerId: 'vanessa-van-edwards', slug: 'captivate', title: 'Captivate', openLibraryCoverId: 10951273 },
  { speakerId: 'vanessa-van-edwards', slug: 'cues', title: 'Cues', openLibraryCoverId: 12854323 },
  // Davina McCall — OL has no covers for these; user stages images locally
  { speakerId: 'davina-mccall', slug: 'menopausing', title: 'Menopausing', localPath: 'tmp/manual-covers/davina-mccall/menopausing.jpg' },
  { speakerId: 'davina-mccall', slug: 'lessons-for-survival', title: 'Lessons for Survival', localPath: 'tmp/manual-covers/davina-mccall/lessons-for-survival.jpg' },
  // Paul C Brunson
  { speakerId: 'paul-c-brunson', slug: 'its-complicated', title: "It's Complicated But It Doesn't Have To Be", openLibraryCoverId: 7516589 },
  // Evy Poumpouras
  { speakerId: 'evy-poumpouras', slug: 'becoming-bulletproof', title: 'Becoming Bulletproof', openLibraryCoverId: 10359658 },
  // Vonda Wright
  { speakerId: 'vonda-wright', slug: 'fitness-after-40', title: 'Fitness After 40', openLibraryCoverId: 12641684 },
  { speakerId: 'vonda-wright', slug: 'younger-in-8-weeks', title: 'Younger in 8 Weeks', openLibraryCoverId: 12633838 },
  { speakerId: 'vonda-wright', slug: 'guide-to-thrive', title: "Dr Vonda Wright's Guide to Thrive", openLibraryCoverId: 8255548 },
]

async function loadBookBuffer(book) {
  if (book.openLibraryCoverId) {
    const url = `https://covers.openlibrary.org/b/id/${book.openLibraryCoverId}-L.jpg?default=false`
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`Open Library returned HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    return { buffer, contentType: res.headers.get('content-type') || 'image/jpeg' }
  }
  if (book.localPath) {
    const buffer = await readFile(book.localPath)
    const contentType = book.localPath.endsWith('.png') ? 'image/png' : 'image/jpeg'
    return { buffer, contentType }
  }
  throw new Error('book has no source (need openLibraryCoverId or localPath)')
}

async function uploadCover(speakerId, slug, buffer, contentType) {
  const ext = contentType === 'image/png' ? '.png' : '.jpg'
  const gcsPath = `books/${speakerId}/${slug}${ext}`
  await bucket.file(gcsPath).save(buffer, {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  })
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}

async function main() {
  const grouped = {}
  let warnings = 0
  let failures = 0

  for (const book of BOOKS) {
    const label = `[${book.speakerId}/${book.slug}]`
    try {
      console.log(`${label} loading...`)
      const { buffer, contentType } = await loadBookBuffer(book)
      if (buffer.byteLength < SMALL_FILE_THRESHOLD) {
        console.warn(`${label}   small file (${(buffer.byteLength / 1024).toFixed(1)} KB) — review for low resolution`)
        warnings++
      }
      const coverUrl = await uploadCover(book.speakerId, book.slug, buffer, contentType)
      console.log(`${label}   uploaded -> ${coverUrl}`)
      if (!grouped[book.speakerId]) grouped[book.speakerId] = []
      grouped[book.speakerId].push({ title: book.title, coverUrl })
    } catch (err) {
      console.error(`${label}   FAILED: ${err.message}`)
      failures++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('PASTE INTO server/data/speakers.js (one block per speaker):')
  console.log('='.repeat(70))
  for (const [speakerId, books] of Object.entries(grouped)) {
    const json = JSON.stringify(books, null, 6).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n')
    console.log(`\n// ${speakerId}\nbooks: ${json},`)
  }

  console.log('\n' + '='.repeat(70))
  console.log(`Done. ${BOOKS.length - failures} succeeded, ${failures} failed, ${warnings} small-file warnings.`)
  if (failures > 0) process.exitCode = 1
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
