import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'

export default function AdminLoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const result = await onLogin(username, password)
    setIsLoading(false)
    if (!result.success) {
      setError(result.message || 'Invalid credentials')
    }
  }

  return (
    <div className="admin-login">
      <motion.div
        className="admin-login__card"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="admin-login__logo">
          <h1>Flight Story</h1>
          <p>Admin Dashboard</p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <div className="admin-login__field">
            <label className="admin-login__label">Username</label>
            <input
              className="admin-login__input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              required
            />
          </div>

          <div className="admin-login__field">
            <label className="admin-login__label">Password</label>
            <input
              className="admin-login__input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            className="admin-login__submit"
            type="submit"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && <div className="admin-login__error">{error}</div>}
        </form>
      </motion.div>
    </div>
  )
}
