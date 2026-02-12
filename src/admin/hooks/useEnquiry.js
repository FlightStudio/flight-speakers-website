import { useState, useEffect, useCallback } from 'react'

export function useEnquiry(id) {
  const [enquiry, setEnquiry] = useState(null)
  const [speakers, setSpeakers] = useState({ requested: null, related: [], semantic: [], additional: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function fetchEnquiry() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/enquiries/${id}`, { credentials: 'include' })
        const data = await res.json()
        if (data.success) {
          setEnquiry(data.enquiry)
          setSpeakers(data.speakers)
        }
      } catch (err) {
        console.error('Failed to fetch enquiry:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEnquiry()
  }, [id])

  const updateEnquiry = useCallback(async (updates) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (data.success) {
        setEnquiry(data.enquiry)
        return { success: true }
      }
      return { success: false, message: data.message }
    } catch {
      return { success: false, message: 'Failed to update enquiry' }
    }
  }, [id])

  return { enquiry, speakers, isLoading, updateEnquiry }
}
