import 'dotenv/config'
import pg from 'pg'
import { speakers } from '../data/speakers.js'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function seed() {
  console.log(`Seeding ${speakers.length} speakers...`)

  for (const speaker of speakers) {
    await pool.query(
      `INSERT INTO speakers (id, name, headline, photo, bio, topics, audiences, keynotes, speaking_format, video_url, featured, social_profiles, fee_min, gender, nationality, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         headline = EXCLUDED.headline,
         photo = EXCLUDED.photo,
         bio = EXCLUDED.bio,
         topics = EXCLUDED.topics,
         audiences = EXCLUDED.audiences,
         keynotes = EXCLUDED.keynotes,
         speaking_format = EXCLUDED.speaking_format,
         video_url = EXCLUDED.video_url,
         featured = EXCLUDED.featured,
         social_profiles = EXCLUDED.social_profiles,
         fee_min = EXCLUDED.fee_min,
         gender = EXCLUDED.gender,
         nationality = EXCLUDED.nationality,
         location = EXCLUDED.location,
         updated_at = NOW()`,
      [
        speaker.id,
        speaker.name,
        speaker.headline,
        speaker.photo,
        speaker.bio,
        speaker.topics,
        speaker.audiences,
        speaker.keynotes || [],
        speaker.speakingFormat || null,
        speaker.videoUrl,
        speaker.featured,
        JSON.stringify(speaker.socialProfiles || {}),
        speaker.feeMin || null,
        speaker.gender || null,
        speaker.nationality || null,
        speaker.location || null,
      ]
    )

    console.log(`  Seeded: ${speaker.name}`)
  }

  const { rows } = await pool.query('SELECT count(*) AS total FROM speakers')
  console.log(`\nDone. ${rows[0].total} speakers in database.`)

  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
