import { useState, useEffect, useCallback } from 'react'

export function useAdminAuth() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      return { success: true }
    }
    return { success: false, message: data.message }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  return { user, isLoading, isAuthenticated: !!user, login, logout }
}
