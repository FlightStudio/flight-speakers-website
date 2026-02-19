import { useState, useEffect, useCallback } from 'react'

export function useEnquiries({ status = 'all', engagementType = 'all', sort = 'newest', page = 1 } = {}) {
  const [enquiries, setEnquiries] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20, sort })
      if (status && status !== 'all') params.set('status', status)
      if (engagementType && engagementType !== 'all') params.set('engagementType', engagementType)

      const res = await fetch(`/api/admin/enquiries?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setEnquiries(data.enquiries)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [status, engagementType, sort, page])

  useEffect(() => { fetchEnquiries() }, [fetchEnquiries])

  return { enquiries, total, isLoading, refetch: fetchEnquiries }
}
