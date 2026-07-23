import 'dotenv/config'
import { Storage } from '@google-cloud/storage'

const GCS_BUCKET = process.env.GCS_BUCKET || 'steven-warehouse-dev-flight-speakers-photos'

// Origins allowed to fetch bucket objects cross-origin. Sourced from the same
// ALLOWED_ORIGINS the API uses, plus common local dev ports as a fallback so a
// bare checkout still works. Deduped.
const DEV_FALLBACK = ['http://localhost:3000', 'http://localhost:5173']
const configured = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const origins = [...new Set([...configured, ...DEV_FALLBACK])]

const corsPolicy = [
  {
    origin: origins,
    method: ['GET', 'HEAD'],
    responseHeader: ['Content-Type', 'Content-Length', 'Cache-Control'],
    maxAgeSeconds: 3600,
  },
]

async function main() {
  const bucket = new Storage().bucket(GCS_BUCKET)

  const [before] = await bucket.getMetadata()
  console.log(`Bucket: ${GCS_BUCKET}`)
  console.log('Current CORS:', JSON.stringify(before.cors ?? [], null, 2))

  await bucket.setCorsConfiguration(corsPolicy)

  const [after] = await bucket.getMetadata()
  console.log('\nApplied CORS:', JSON.stringify(after.cors ?? [], null, 2))
  console.log(`\nDone. Allowed origins: ${origins.join(', ')}`)
}

main().catch((err) => {
  console.error('\nFailed to set bucket CORS:', err.message)
  if (err.code === 403 || /permission|forbidden/i.test(err.message)) {
    console.error(
      'The service account lacks storage.buckets.update. Grant it the ' +
      '"Storage Admin" role on this bucket (Storage Object Admin is not enough), ' +
      'or run the gsutil equivalent from an authorized account:\n' +
      `  gsutil cors set cors.json gs://${GCS_BUCKET}`
    )
  }
  process.exit(1)
})
