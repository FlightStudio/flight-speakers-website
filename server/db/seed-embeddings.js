import { getSpeakerProfilesForSearch, updateSpeakerEmbedding } from './queries.js'
import { buildSpeakerText, generateEmbeddings } from '../services/embeddings.js'
import pool from './connection.js'

async function seedEmbeddings() {
  console.log('Fetching speaker profiles...')
  const speakers = await getSpeakerProfilesForSearch()
  console.log(`Found ${speakers.length} speakers`)

  if (speakers.length === 0) {
    console.log('No speakers found. Run db:seed first.')
    process.exit(1)
  }

  const texts = speakers.map(buildSpeakerText)
  console.log('Generating embeddings via Voyage AI...')

  const embeddings = await generateEmbeddings(texts)
  console.log(`Received ${embeddings.length} embeddings (${embeddings[0].length} dimensions)`)

  for (let i = 0; i < speakers.length; i++) {
    await updateSpeakerEmbedding(speakers[i].id, embeddings[i])
    console.log(`  ✓ ${speakers[i].name}`)
  }

  console.log(`\nDone! Embedded ${speakers.length} speakers.`)
}

seedEmbeddings()
  .catch(err => {
    console.error('Failed to seed embeddings:', err)
    process.exit(1)
  })
  .finally(() => pool.end())
