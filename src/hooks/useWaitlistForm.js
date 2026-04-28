import { useState, useCallback } from 'react'

// ── Constants exported for use by the form component ──────────────────────

export const TOPIC_OPTIONS = [
  'Leadership & Culture',
  'Business & Strategy',
  'Technology & AI',
  'Health & Performance',
  'Marketing & Brand',
  'Entrepreneurship',
  'Future of Work',
  'Diversity & Inclusion',
  'Creator Economy',
  'Other',
]

export const SPEAKING_EXPERIENCE_OPTIONS = [
  'Just starting out',
  '5–25 paid talks',
  '25–100 paid talks',
  '100+ paid talks',
  "Don't track this — I speak when invited",
]

export const REPRESENTATION_OPTIONS = [
  {
    value: 'Looking for exclusive representation',
    title: 'Looking for exclusive representation',
    helper: 'I want a single bureau managing my speaking work end-to-end.',
  },
  {
    value: 'Open to non-exclusive representation',
    title: 'Open to non-exclusive representation',
    helper: 'I\'d consider working with multiple bureaus on a per-engagement basis.',
  },
  {
    value: 'Currently represented elsewhere',
    title: 'Currently represented elsewhere',
    helper: 'I have an existing bureau but want to be on your radar.',
  },
  {
    value: 'Not sure yet',
    title: 'Not sure yet',
    helper: 'Exploring what representation looks like and whether it\'s right for me.',
  },
]

export const WAITLIST_CURRENCIES = [
  { code: 'GBP', symbol: '£', label: 'GBP £' },
  { code: 'USD', symbol: '$', label: 'USD $' },
  { code: 'EUR', symbol: '€', label: 'EUR €' },
]

export function getWaitlistBudgetBrackets(currencyCode = 'GBP') {
  const curr = WAITLIST_CURRENCIES.find(c => c.code === currencyCode) || WAITLIST_CURRENCIES[0]
  const s = curr.symbol
  return [
    `Under ${s}5,000`,
    `${s}5,000–${s}15,000`,
    `${s}15,000–${s}30,000`,
    `${s}30,000–${s}75,000`,
    `${s}75,000+`,
    'Pro bono only',
    'Negotiable / depends on event',
  ]
}

// ── Step definitions ───────────────────────────────────────────────────────

// 6 steps: About You / Your Work (main) / Your Work (fee) / Profile & Links / Representation / Review+Consent
export const WAITLIST_STEPS = [
  { id: 'about',          label: '01', title: 'ABOUT YOU' },
  { id: 'work-main',      label: '02', title: 'YOUR WORK' },
  { id: 'work-fee',       label: '02', title: 'YOUR WORK' },
  { id: 'profile',        label: '03', title: 'PROFILE & LINKS' },
  { id: 'representation', label: '04', title: 'REPRESENTATION' },
  { id: 'review',         label: '05', title: 'REVIEW' },
]

export const WAITLIST_TOTAL_STEPS = WAITLIST_STEPS.length

// ── Initial state ──────────────────────────────────────────────────────────

const INITIAL_FORM_DATA = {
  // Section 01
  fullName: '',
  email: '',
  phone: '',
  basedIn: '',
  titleCompany: '',
  // Section 02
  speaksAbout: '',
  topics: [],
  speakingExperience: '',
  feeCurrency: 'GBP',
  feeBracket: '',
  // Section 03
  website: '',
  linkedin: '',
  showreel: '',
  instagram: '',
  notableEngagements: '',
  // Section 04
  representationStatus: '',
  whyFlightspeakers: '',
  // Consent
  consent: false,
}

// ── Field validation ───────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateStep(stepId, formData) {
  const errors = {}

  if (stepId === 'about') {
    if (!formData.fullName.trim()) errors.fullName = 'Please enter your full name'
    if (!formData.email.trim()) errors.email = 'Please enter your email'
    else if (!EMAIL_REGEX.test(formData.email)) errors.email = 'Please enter a valid email address'
    if (!formData.basedIn.trim()) errors.basedIn = 'Please enter where you\'re based'
    if (!formData.titleCompany.trim()) errors.titleCompany = 'Please enter your title and company'
  }

  if (stepId === 'work-main') {
    if (!formData.speaksAbout.trim()) errors.speaksAbout = 'Please describe what you speak about'
    if (formData.topics.length === 0) errors.topics = 'Please select at least one topic area'
    if (!formData.speakingExperience) errors.speakingExperience = 'Please select your speaking experience'
  }

  if (stepId === 'work-fee') {
    if (!formData.feeBracket) errors.feeBracket = 'Please select a fee bracket'
  }

  if (stepId === 'representation') {
    if (!formData.representationStatus) errors.representationStatus = 'Please select a representation status'
  }

  if (stepId === 'review') {
    if (!formData.consent) errors.consent = 'Please agree to the privacy policy to continue'
  }

  return errors
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useWaitlistForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const toggleTopic = useCallback((topic) => {
    setFormData(prev => {
      const topics = prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
      return { ...prev, topics }
    })
    setErrors(prev => {
      if (!prev.topics) return prev
      const next = { ...prev }
      delete next.topics
      return next
    })
  }, [])

  const goNext = useCallback(() => {
    const stepId = WAITLIST_STEPS[currentStep].id
    const stepErrors = validateStep(stepId, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return false
    }
    if (currentStep >= WAITLIST_TOTAL_STEPS - 1) return false
    setErrors({})
    setDirection(1)
    setCurrentStep(prev => prev + 1)
    return true
  }, [currentStep, formData])

  const goBack = useCallback(() => {
    if (currentStep <= 0) return false
    setDirection(-1)
    setCurrentStep(prev => prev - 1)
    setErrors({})
    return true
  }, [currentStep])

  const goToStep = useCallback((index) => {
    if (index < 0 || index >= WAITLIST_TOTAL_STEPS) return
    setDirection(index > currentStep ? 1 : -1)
    setCurrentStep(index)
    setErrors({})
  }, [currentStep])

  const submitForm = useCallback(async () => {
    // Final validation on review step
    const stepErrors = validateStep('review', formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return false
    }

    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        basedIn: formData.basedIn,
        titleCompany: formData.titleCompany,
        speaksAbout: formData.speaksAbout,
        topics: formData.topics,
        speakingExperience: formData.speakingExperience,
        feeCurrency: formData.feeCurrency,
        feeBracket: formData.feeBracket,
        website: formData.website || null,
        linkedin: formData.linkedin || null,
        showreel: formData.showreel || null,
        instagram: formData.instagram || null,
        notableEngagements: formData.notableEngagements || null,
        representationStatus: formData.representationStatus,
        whyFlightspeakers: formData.whyFlightspeakers || null,
        consent: formData.consent,
      }

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus({ type: 'success', message: '' })
        return true
      } else {
        throw new Error(data.message || 'Something went wrong')
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to submit. Please try again.',
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  return {
    formData,
    setFormData,
    currentStep,
    direction,
    errors,
    status,
    isSubmitting,
    handleChange,
    toggleTopic,
    goNext,
    goBack,
    goToStep,
    submitForm,
  }
}
