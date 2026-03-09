import { useState, useCallback } from 'react'

export const EVENT_TYPES = [
  'Conference / Summit',
  'Corporate Offsite',
  'Leadership Event',
  'Product Launch',
  'Sales Kickoff',
  'Awards / Gala',
  'Internal Training',
  'Virtual Event',
  'Other',
]

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
]

export const ENGAGEMENT_TYPES = ['Paid', 'Pro Bono']

export const HAS_BUDGET_OPTIONS = ['Yes', 'No']

export function getBudgetRanges(currencyCode = 'USD') {
  const curr = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]
  const s = curr.symbol
  const fmt = (n) => `${s}${n.toLocaleString()}`
  return [
    `Under ${fmt(10000)}`,
    `${fmt(10000)} - ${fmt(25000)}`,
    `${fmt(25000)} - ${fmt(50000)}`,
    `${fmt(50000)} - ${fmt(100000)}`,
    `Over ${fmt(100000)}`,
  ]
}

export const BUDGET_RANGES = getBudgetRanges('USD')

export const STEPS = [
  {
    id: 'name',
    heading: "What's your name?",
    field: 'name',
    type: 'text',
    placeholder: 'Your full name',
    required: true,
    skippable: false,
  },
  {
    id: 'organization',
    heading: 'Where do you work?',
    field: 'organization',
    type: 'text',
    placeholder: 'Company or organization',
    required: true,
    skippable: false,
  },
  {
    id: 'email',
    heading: "What's your email?",
    field: 'email',
    type: 'email',
    placeholder: 'you@company.com',
    required: true,
    skippable: false,
  },
  {
    id: 'phone',
    heading: 'Got a phone number?',
    field: 'phone',
    type: 'tel',
    placeholder: '+44 7700 900000',
    required: false,
    skippable: true,
  },
  {
    id: 'eventType',
    heading: 'What type of event is it?',
    field: 'eventType',
    type: 'pills',
    options: EVENT_TYPES,
    required: true,
    skippable: false,
  },
  {
    id: 'eventDate',
    heading: "When's the event?",
    field: 'eventDate',
    type: 'date',
    required: true,
    skippable: false,
  },
  {
    id: 'eventLocation',
    heading: "Where's it happening?",
    field: 'eventLocation',
    type: 'text',
    placeholder: 'City, Country or Virtual',
    required: true,
    skippable: false,
  },
  {
    id: 'audienceSize',
    heading: 'How big is the audience?',
    field: 'audienceSize',
    type: 'text',
    placeholder: 'e.g., 500 attendees',
    required: true,
    skippable: false,
    whyText: 'Audience size helps us recommend speakers experienced with groups your size and suggest the right format, from intimate fireside chat to large keynote.',
  },
  {
    id: 'engagementBudget',
    heading: 'Is this a paid or pro bono event?',
    field: 'engagementType',
    type: 'engagementBudgetTree',
    required: true,
    skippable: false,
    whyText: 'We use this to prioritize your request and match speakers based on your event type, budget, and location. *We only reply to briefs with a legitimate entered speaker fee.',
  },
  {
    id: 'brief',
    heading: "Describe what you're looking for",
    field: 'brief',
    type: 'textarea',
    placeholder: 'Tell us about your event, audience, and the type of speaker you need...',
    required: true,
    skippable: false,
  },
  {
    id: 'additionalDetails',
    heading: 'Anything else you\'d like to add?',
    field: 'additionalDetails',
    type: 'textarea',
    placeholder: 'Any other details, requirements, or preferences...',
    required: false,
    skippable: true,
  },
  {
    id: 'review',
    heading: 'Review your enquiry',
    field: null,
    required: false,
    skippable: false,
  },
]

export const TOTAL_STEPS = STEPS.length

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INITIAL_FORM_DATA = {
  name: '',
  organization: '',
  email: '',
  phone: '',
  eventDate: '',
  eventLocation: '',
  audienceSize: '',
  engagementType: '',
  hasBudget: '',
  budgetRange: '',
  currency: 'USD',
  eventType: '',
  brief: '',
  speakerId: '',
  speakerName: '',
  additionalSpeakerIds: [],
  preSelectedSpeakerIds: [],
  additionalDetails: '',
  proBonoFlexible: false,
  newsletter: false,
}

function validateField(field, value, formData) {
  switch (field) {
    case 'name':
      return value.trim() ? '' : 'Please enter your name'
    case 'organization':
      return value.trim() ? '' : 'Please enter your organization'
    case 'email':
      if (!value.trim()) return 'Please enter your email'
      if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email'
      return ''
    case 'eventType':
      return value.trim() ? '' : 'Please select an event type'
    case 'eventDate':
      return value.trim() ? '' : 'Please select an event date'
    case 'eventLocation':
      return value.trim() ? '' : 'Please enter an event location'
    case 'audienceSize':
      return value.trim() ? '' : 'Please enter the audience size'
    case 'engagementType':
      if (!value.trim()) return 'Please select paid or pro bono'
      if (value === 'Paid' && formData) {
        if (!formData.hasBudget?.trim()) return 'Please select whether you have a budget'
        if (formData.hasBudget === 'Yes' && !formData.budgetRange?.trim()) {
          return 'Please select or enter a budget range'
        }
      }
      return ''
    case 'brief':
      return value.trim() ? '' : 'Please describe what you\'re looking for'
    default:
      return ''
  }
}

// Map field names to their step index (for "Edit" from review)
export const FIELD_STEP_MAP = {}
STEPS.forEach((step, i) => {
  if (step.field) FIELD_STEP_MAP[step.field] = i
})

export function useMultiStepForm({ initialData = {}, speaker = null } = {}) {
  const mergedInitial = {
    ...INITIAL_FORM_DATA,
    ...initialData,
    speakerId: speaker?.id || initialData.speakerId || '',
    speakerName: speaker?.name || initialData.speakerName || '',
  }

  const [formData, setFormData] = useState(mergedInitial)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prefilledFields, setPrefilledFields] = useState(new Set())
  const [returnToReview, setReturnToReview] = useState(false)

  const updateField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    updateField(name, type === 'checkbox' ? checked : value)
  }, [updateField])

  const validateStep = useCallback((stepIndex) => {
    const step = STEPS[stepIndex]
    if (!step.field || !step.required) return true

    const error = validateField(step.field, formData[step.field], formData)
    if (error) {
      setErrors({ [step.field]: error })
      return false
    }

    setErrors({})
    return true
  }, [formData])

  const shouldSkipStep = useCallback((stepIndex) => {
    const s = STEPS[stepIndex]
    if (prefilledFields.has(s.field)) return true
    if (s.shouldShow && !s.shouldShow(formData)) return true
    return false
  }, [prefilledFields, formData])

  const goNext = useCallback(() => {
    if (currentStep >= TOTAL_STEPS - 1) return false
    if (!validateStep(currentStep)) return false

    // If editing from review, go back to review step
    if (returnToReview) {
      setReturnToReview(false)
      setDirection(1)
      setCurrentStep(TOTAL_STEPS - 1)
      return true
    }

    setDirection(1)
    let next = currentStep + 1
    while (next < TOTAL_STEPS - 1 && shouldSkipStep(next)) {
      next++
    }
    setCurrentStep(next)
    return true
  }, [currentStep, validateStep, shouldSkipStep, returnToReview])

  const goBack = useCallback(() => {
    if (currentStep <= 0) return false
    setDirection(-1)
    let prev = currentStep - 1
    while (prev > 0 && shouldSkipStep(prev)) {
      prev--
    }
    setCurrentStep(prev)
    setErrors({})
    return true
  }, [currentStep, shouldSkipStep])

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex == null || stepIndex < 0 || stepIndex >= TOTAL_STEPS) return false
    setDirection(stepIndex > currentStep ? 1 : -1)
    setCurrentStep(stepIndex)
    setErrors({})
    return true
  }, [currentStep])

  const findFirstEmptyRequiredStep = useCallback(() => {
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const step = STEPS[i]
      if (prefilledFields.has(step.field)) continue
      if (step.shouldShow && !step.shouldShow(formData)) continue
      if (step.required && step.field) {
        const val = formData[step.field]
        if (!val || !val.toString().trim()) return i
      }
    }
    // If all required filled, find first non-prefilled step
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const step = STEPS[i]
      if (prefilledFields.has(step.field)) continue
      if (step.shouldShow && !step.shouldShow(formData)) continue
      return i
    }
    return TOTAL_STEPS - 1
  }, [formData, prefilledFields])

  const submitForm = useCallback(async () => {
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Thank you for your enquiry!',
        })
        return true
      } else {
        throw new Error(data.message || 'Something went wrong')
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to submit enquiry. Please try again.',
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_DATA,
      speakerId: speaker?.id || '',
      speakerName: speaker?.name || '',
    })
    setCurrentStep(0)
    setDirection(1)
    setErrors({})
    setStatus({ type: '', message: '' })
    setIsSubmitting(false)
  }, [speaker])

  return {
    formData,
    currentStep,
    direction,
    errors,
    status,
    isSubmitting,
    prefilledFields,
    shouldSkipStep,
    updateField,
    handleChange,
    validateStep,
    goNext,
    goBack,
    goToStep,
    findFirstEmptyRequiredStep,
    submitForm,
    resetForm,
    setFormData,
    setCurrentStep,
    setDirection,
    setStatus,
    setPrefilledFields,
    setReturnToReview,
  }
}
