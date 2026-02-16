import bcrypt from 'bcrypt'
import pool from './connection.js'

async function seedAdmin() {
  const username = 'admin'
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'admin'

  try {
    // Check if admin already exists
    const { rows } = await pool.query(
      'SELECT id FROM admin_users WHERE username = $1',
      [username]
    )

    if (rows.length > 0) {
      console.log(`Admin user "${username}" already exists, skipping.`)
      process.exit(0)
    }

    const hash = await bcrypt.hash(password, 12)
    const id = `admin_${Date.now()}`

    await pool.query(
      'INSERT INTO admin_users (id, username, password_hash) VALUES ($1, $2, $3)',
      [id, username, hash]
    )

    console.log(`Admin user "${username}" created successfully.`)
    console.log(`Password: ${password}`)
    process.exit(0)
  } catch (err) {
    console.error('Failed to seed admin user:', err.message)
    process.exit(1)
  }
}

seedAdmin()
