import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: true,
    ca: (process.env.DATABASE_CA_CRT || "").replace(/\\n/g, "\n"),
  },
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err)
  process.exit(1)
})

export default pool
