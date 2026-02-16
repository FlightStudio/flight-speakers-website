import { useState, useEffect, useCallback } from 'react'

export function useSpeaker(id) {
  const [speaker, setSpeaker] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/speakers/${id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Speaker not found' : 'Failed to load')
        return res.json()
      })
      .then(data => {
        if (data.success) setSpeaker(data.speaker)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const saveSpeaker = useCallback(async (data) => {
    setSaving(true)
    setError(null)
    try {
      const url = id ? `/api/admin/speakers/${id}` : '/api/admin/speakers'
      const method = id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message || 'Failed to save')
      setSaving(false)
      return result.speaker || result.draft
    } catch (err) {
      setError(err.message)
      setSaving(false)
      throw err
    }
  }, [id])

  return { speaker, loading, error, saving, saveSpeaker }
}
