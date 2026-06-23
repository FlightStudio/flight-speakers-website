import 'dotenv/config'
import pg from 'pg'
import { speakers } from '../data/speakers.js'
import {seedAdmin} from './seed-admin.js'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },   // Supabase requires TLS
})

async function seed() {
  console.log(`Seeding ${speakers.length} speakers...`)

  for (const speaker of speakers) {
    await pool.query(
      `INSERT INTO speakers (id, name, headline, photo, bio, topics, audiences, keynotes, speaking_format, video_url, social_profiles, fee_min, gender, nationality, location, books)
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
         social_profiles = EXCLUDED.social_profiles,
         fee_min = EXCLUDED.fee_min,
         gender = EXCLUDED.gender,
         nationality = EXCLUDED.nationality,
         location = EXCLUDED.location,
         books = EXCLUDED.books,
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
        JSON.stringify(speaker.socialProfiles || {}),
        speaker.feeMin || null,
        speaker.gender || null,
        speaker.nationality || null,
        speaker.location || null,
        JSON.stringify(speaker.books || []),
      ]
    )

    console.log(`  Seeded: ${speaker.name}`)
  }

  const { rows } = await pool.query('SELECT count(*) AS total FROM speakers')
  console.log(`\nDone. ${rows[0].total} speakers in database.`)

  await seedAdmin();

  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
