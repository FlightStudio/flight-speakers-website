import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useMultiStepForm, STEPS, TOTAL_STEPS, FIELD_STEP_MAP, CURRENCIES, getBudgetRanges, HAS_BUDGET_OPTIONS, ENGAGEMENT_TYPES } from '../../hooks/useMultiStepForm'
import FormProgressBar from './FormProgressBar'
import FormNavigation from './FormNavigation'
import FormField from './FormField'
import AvailabilityCalendar from './AvailabilityCalendar'
import StepReview from './steps/StepReview'
import StepConfirmPrefill from './steps/StepConfirmPrefill'
import SuccessScreen from './SuccessScreen'
import WhyWeAsk from './WhyWeAsk'
import BriefActions from '../brief/BriefActions'
import { getCachedParseBrief } from '../../utils/prefetch'
import { EASE } from '../../constants/animation'
import './MultiStepEnquiryForm.css'

function MultiStepEnquiryForm({ speaker = null, prefillBrief = '', preSelectedSpeakers = [] }) {
  const [showConfirmation, setShowConfirmation] = useState(!!prefillBrief)
  const [extractedData, setExtractedData] = useState({})
  const [isParsing, setIsParsing] = useState(!!prefillBrief)
  const [recommendedSpeakers, setRecommendedSpeakers] = useState([])
  const [recommendedScores, setRecommendedScores] = useState({})
  const [recommendedReasonings, setRecommendedReasonings] = useState({})
  const [recsLoading, setRecsLoading] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const [initialData] = useState(() => {
    const data = {}
    if (prefillBrief) data.brief = prefillBrief
    // Pre-selected speakers from search results (excluding primary speaker)
    const preIds = preSelectedSpeakers
      .map(s => s.id)
      .filter(id => id !== speaker?.id)
    if (preIds.length > 0) {
      data.additionalSpeakerIds = preIds
      data.preSelectedSpeakerIds = preIds
    }
    return data
  })

  const form = useMultiStepForm({ initialData, speaker })

  const {
    formData,
    currentStep,
    direction,
    errors,
    status,
    isSubmitting,
    handleChange,
    goNext,
    goBack,
    goToStep,
    findFirstEmptyRequiredStep,
    submitForm,
    resetForm,
    setFormData,
    setDirection,
    setPrefilledFields,
    setReturnToReview,
  } = form

  const budgetRanges = useMemo(() => getBudgetRanges(formData.currency), [formData.currency])
  const currencySymbol = useMemo(() => {
    const curr = CURRENCIES.find(c => c.code === formData.currency)
    return curr?.symbol || '$'
  }, [formData.currency])

  // Parse brief — check prefetch cache first, then fetch
  useEffect(() => {
    if (!prefillBrief) return

    let cancelled = false

    async function parseBrief() {
      try {
        // Check if already prefetched
        let data = await getCachedParseBrief(prefillBrief)

        if (!data) {
          const res = await fetch('/api/parse-brief', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief: prefillBrief }),
          })
          data = await res.json()
        }

        if (cancelled) return
        if (data.extracted && Object.keys(data.extracted).length > 0) {
          if (data.extracted.budgetRange || data.extracted.customBudget) {
            if (!data.extracted.engagementType) data.extracted.engagementType = 'Paid'
          }
          // If an exact custom budget was extracted, use it as the budgetRange value
          // (the form's custom budget input handles non-range values)
          if (data.extracted.customBudget) {
            data.extracted.budgetRange = data.extracted.customBudget
            // Map extracted currency to form currency if provided
            if (data.extracted.budgetCurrency) {
              const currencyMap = { GBP: 'GBP', USD: 'USD', EUR: 'EUR' }
              if (currencyMap[data.extracted.budgetCurrency]) {
                data.extracted.currency = currencyMap[data.extracted.budgetCurrency]
              }
            }
          }
          setExtractedData(data.extracted)
          setFormData(prev => ({ ...prev, ...data.extracted }))
        }
      } catch {
        // Graceful degradation
      } finally {
        if (!cancelled) setIsParsing(false)
      }
    }

    parseBrief()
    return () => { cancelled = true }
  }, [prefillBrief, setFormData])

  const handleConfirmPrefill = useCallback(() => {
    // Mark extracted fields + brief as prefilled so they're skipped in navigation
    const prefilled = new Set(Object.keys(extractedData).filter(k => extractedData[k]))
    // Never skip budget step — user must confirm currency and range
    prefilled.delete('engagementType')
    prefilled.delete('budgetRange')
    if (prefillBrief) prefilled.add('brief')
    setPrefilledFields(prefilled)

    setShowConfirmation(false)
    // Find first empty required step, skipping prefilled fields inline
    // (can't rely on state update being applied yet)
    let target = TOTAL_STEPS - 1
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const s = STEPS[i]
      if (prefilled.has(s.field)) continue
      if (s.required && s.field) {
        const val = formData[s.field]
        if (!val || !val.toString().trim()) { target = i; break }
      }
    }
    setDirection(1)
    goToStep(target)
  }, [extractedData, prefillBrief, formData, setPrefilledFields, goToStep, setDirection])

  const handleEditFromPrefill = useCallback((stepIndex) => {
    // Mark all prefilled fields except the one being edited
    const prefilled = new Set(Object.keys(extractedData).filter(k => extractedData[k]))
    // Never skip budget step
    prefilled.delete('engagementType')
    prefilled.delete('budgetRange')
    if (prefillBrief) prefilled.add('brief')
    // Remove the field being edited so it shows
    const editedField = STEPS[stepIndex]?.field
    if (editedField) prefilled.delete(editedField)
    setPrefilledFields(prefilled)

    setShowConfirmation(false)
    setDirection(1)
    goToStep(stepIndex)
  }, [extractedData, prefillBrief, setPrefilledFields, goToStep, setDirection])

  const handleSkip = useCallback(() => {
    setDirection(1)
    let next = currentStep + 1
    while (next < TOTAL_STEPS - 1 && form.shouldSkipStep(next)) {
      next++
    }
    goToStep(next)
  }, [currentStep, form.shouldSkipStep, goToStep, setDirection])

  // Keep recommendation data in sync with formData so it's included on submit
  useEffect(() => {
    if (recommendedSpeakers.length === 0) return
    const recommendations = recommendedSpeakers.map(s => ({
      speakerId: s.id,
      speakerName: s.name,
      score: recommendedScores[s.id] ?? null,
      reasoning: recommendedReasonings[s.id] ?? null,
      selected: (formData.additionalSpeakerIds || []).includes(s.id),
    }))
    setFormData(prev => {
      if (JSON.stringify(prev.recommendations) === JSON.stringify(recommendations)) return prev
      return { ...prev, recommendations }
    })
  }, [recommendedSpeakers, recommendedScores, recommendedReasonings, formData.additionalSpeakerIds, setFormData])

  const handleSubmit = useCallback(async () => {
    await submitForm()
  }, [submitForm])

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return
    if (e.target.tagName === 'TEXTAREA') return
    e.preventDefault()
    if (currentStep < TOTAL_STEPS - 1) goNext()
  }, [currentStep, goNext])

  const step = STEPS[currentStep]
  const isReviewStep = step.id === 'review'

  // Prefetch recommended speakers — start immediately for prefilled briefs,
  // debounce for manual typing on/past the brief step.
  // Uses a ref (not state) for dedup to avoid triggering effect cleanup
  // which would abort the in-flight fetch via the AbortController.
  const briefForSearch = prefillBrief || formData.brief
  const prefetchedBriefRef = useRef('')
  useEffect(() => {
    if (!briefForSearch || briefForSearch.length < 20) return
    if (briefForSearch === prefetchedBriefRef.current) return

    // For prefilled briefs, start immediately; for typed briefs, debounce
    const isPrefilled = !!prefillBrief && briefForSearch === prefillBrief

    // Show skeleton immediately so the review step has visual feedback
    setRecsLoading(true)

    const controller = new AbortController()
    const delay = isPrefilled ? 0 : 800
    const timer = setTimeout(() => {
      prefetchedBriefRef.current = briefForSearch
      fetch(`/api/search?q=${encodeURIComponent(briefForSearch)}&limit=6`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const excludeIds = new Set([
              formData.speakerId,
              ...(formData.preSelectedSpeakerIds || []),
            ].filter(Boolean))
            const filtered = (data.speakers || []).filter(s => !excludeIds.has(s.id))
            setRecommendedSpeakers(filtered.slice(0, 4))
            setRecommendedScores(data.scores || {})
            setRecommendedReasonings(data.reasonings || {})
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('[Recommendations] Fetch failed:', err)
          }
          // Allow retry on next brief change
          prefetchedBriefRef.current = ''
        })
        .finally(() => setRecsLoading(false))
    }, delay)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [briefForSearch, formData.speakerId, formData.preSelectedSpeakerIds, prefillBrief])

  const toggleSpeaker = useCallback((speakerId) => {
    setFormData(prev => {
      const ids = prev.additionalSpeakerIds || []
      const next = ids.includes(speakerId)
        ? ids.filter(id => id !== speakerId)
        : [...ids, speakerId]
      return { ...prev, additionalSpeakerIds: next }
    })
  }, [setFormData])

  // Auto-focus on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector('.mstep-step')
      if (!container) return
      const input = container.querySelector('input:not([type="checkbox"]):not([type="hidden"]), select, textarea')
      if (input) input.focus()
    }, 150)
    return () => clearTimeout(timer)
  }, [currentStep, showConfirmation])

  // Build categorized speaker lists for the brief/share functionality
  const briefSelectedSpeakers = useMemo(() => {
    return preSelectedSpeakers
      .filter(s => s.id !== speaker?.id)
      .map(s => ({ ...s, matchScore: null, reasoning: null }))
  }, [preSelectedSpeakers, speaker])

  const briefAiRecommendations = useMemo(() => {
    const toggledIds = formData.additionalSpeakerIds || []
    return recommendedSpeakers
      .filter(s => toggledIds.includes(s.id) && s.id !== speaker?.id)
      .map(s => ({
        ...s,
        matchScore: recommendedScores[s.id] ?? null,
        reasoning: recommendedReasonings[s.id] ?? null,
      }))
  }, [recommendedSpeakers, recommendedScores, recommendedReasonings, formData.additionalSpeakerIds, speaker])

  // Build speakers array for progress bar — adapts by stage:
  // Early steps: primary + pre-selected speakers from search
  // Review step: primary + pre-selected + toggled recommended speakers
  const progressSpeakers = useMemo(() => {
    const speakers = []
    const seenIds = new Set()
    if (speaker) {
      seenIds.add(speaker.id)
    }
    // Always show pre-selected speakers from search results
    for (const s of preSelectedSpeakers) {
      if (!seenIds.has(s.id)) {
        speakers.push(s)
        seenIds.add(s.id)
      }
    }
    // At the review step, also show recommended speakers the user toggled on
    if (isReviewStep) {
      const toggledIds = formData.additionalSpeakerIds || []
      for (const s of recommendedSpeakers) {
        if (toggledIds.includes(s.id) && !seenIds.has(s.id)) {
          speakers.push(s)
          seenIds.add(s.id)
        }
      }
    }
    return speakers
  }, [speaker, preSelectedSpeakers, isReviewStep, formData.additionalSpeakerIds, recommendedSpeakers])

  const slideDistance = shouldReduceMotion ? 0 : 40
  const variants = {
    enter: (dir) => ({ y: dir > 0 ? slideDistance : -slideDistance, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir) => ({ y: dir > 0 ? -slideDistance : slideDistance, opacity: 0 }),
  }

  // Success
  if (status.type === 'success') {
    return (
      <div className="mstep">
        <SuccessScreen
          name={formData.name}
          speaker={speaker}
          brief={prefillBrief || formData.brief}
          selectedSpeakers={preSelectedSpeakers.filter(s => s.id !== speaker?.id)}
          aiRecommendations={recommendedSpeakers.filter(s => s.id !== speaker?.id).map(s => ({
            ...s,
            matchScore: recommendedScores[s.id] ?? null,
            reasoning: recommendedReasonings[s.id] ?? null,
          }))}
        />
      </div>
    )
  }

  // Confirmation screen
  if (showConfirmation) {
    return (
      <div className="mstep">
        <StepConfirmPrefill
          extractedData={extractedData}
          brief={prefillBrief}
          isParsing={isParsing}
          onConfirm={handleConfirmPrefill}
          onEditField={(stepIdx) => handleEditFromPrefill(stepIdx)}
          fieldStepMap={FIELD_STEP_MAP}
        />
      </div>
    )
  }

  // Render current step content
  const renderStepContent = () => {
    if (isReviewStep) {
      return (
        <StepReview
          formData={formData}
          handleChange={handleChange}
          goToStep={(stepIdx) => {
            setReturnToReview(true)
            goToStep(stepIdx)
          }}
          primarySpeaker={speaker}
          preSelectedSpeakers={preSelectedSpeakers}
          recommendedSpeakers={recommendedSpeakers}
          recommendedScores={recommendedScores}
          onToggleSpeaker={toggleSpeaker}
          recsLoading={recsLoading}
        />
      )
    }

    // Engagement + budget tree: Paid/Pro Bono → budget Yes/No → range
    if (step.type === 'engagementBudgetTree') {
      return (
        <div className="mstep-step__fields">
          {/* Level 1: Paid / Pro Bono */}
          <div className="mstep-budget-toggle">
            {ENGAGEMENT_TYPES.map(opt => (
              <button
                key={opt}
                type="button"
                className={`mstep-budget-toggle__btn ${formData.engagementType === opt ? 'mstep-budget-toggle__btn--active' : ''}`}
                onClick={() => {
                  handleChange({ target: { name: 'engagementType', value: opt } })
                  if (opt === 'Pro Bono') {
                    handleChange({ target: { name: 'budgetRange', value: '' } })
                  }
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Pro Bono — subject to change option */}
          {formData.engagementType === 'Pro Bono' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mstep-tree-level"
            >
              <label className="mstep-probono-flexible">
                <input
                  type="checkbox"
                  name="proBonoFlexible"
                  checked={formData.proBonoFlexible || false}
                  onChange={handleChange}
                />
                <span>Pro bono for now, but this may be subject to change</span>
              </label>
            </motion.div>
          )}

          {/* Level 2: Budget yes/no (only for Paid) */}
          {formData.engagementType === 'Paid' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mstep-tree-level"
            >
              <div className="mstep-tree-level__label">What's your budget range?</div>
                <div className="mstep-budget-row">
                  <div className="mstep-budget-row__currency">
                    <select
                      name="currency"
                      value={formData.currency || 'USD'}
                      onChange={(e) => {
                        const newCurrency = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          currency: newCurrency,
                          budgetRange: '',
                        }))
                      }}
                      className="mstep-currency-select"
                    >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="mstep-budget-row__range">
                  <div className="mstep-budget-custom">
                    <span className="mstep-budget-custom__symbol">{currencySymbol}</span>
                    <input
                      type="text"
                      name="budgetRange"
                      className="form-input mstep-budget-custom__input"
                      placeholder=""
                      value={formData.budgetRange || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,.\-\s]/g, '')
                        handleChange({ target: { name: 'budgetRange', value: val } })
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {errors.engagementType && <div className="mstep-field__error">{errors.engagementType}</div>}
        </div>
      )
    }

    // Pill selector for options (replaces native <select>)
    if (step.type === 'pills' && step.options) {
      return (
        <div className="mstep-step__fields">
          <div className="mstep-pills">
            {step.options.map(opt => (
              <button
                key={opt}
                type="button"
                className={`mstep-pills__btn ${formData[step.field] === opt ? 'mstep-pills__btn--active' : ''}`}
                onClick={() => handleChange({ target: { name: step.field, value: opt } })}
              >
                {opt}
              </button>
            ))}
          </div>
          {errors[step.field] && <div className="mstep-field__error">{errors[step.field]}</div>}
        </div>
      )
    }

    // Calendar for date step
    if (step.id === 'eventDate') {
      return (
        <div className="mstep-step__fields mstep-step__fields--calendar">
          <AvailabilityCalendar
            value={formData.eventDate}
            onChange={handleChange}
            speakerId={speaker?.id || 'general'}
          />
        </div>
      )
    }

    // Single field
    return (
      <div className="mstep-step__fields">
        <FormField
          label=""
          name={step.field}
          type={step.type}
          value={formData[step.field]}
          onChange={handleChange}
          error={errors[step.field]}
          required={step.required}
          placeholder={step.placeholder}
          options={step.options}
          rows={step.type === 'textarea' ? 5 : undefined}
          autoFocus
        />
        {step.id === 'organization' && (
          <label className="mstep-probono-flexible">
            <input
              type="checkbox"
              name="isSpeakersAgency"
              checked={formData.isSpeakersAgency || false}
              onChange={handleChange}
            />
            <span>Is this a speakers agency?</span>
          </label>
        )}
      </div>
    )
  }

  return (
    <div className="mstep" onKeyDown={handleKeyDown}>
      <FormProgressBar currentStep={currentStep} speaker={speaker} speakers={progressSpeakers} />

      <div className="mstep-step" aria-live="polite">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: EASE }}
            className="mstep-step__inner"
          >
            <h2 className="mstep-step__heading">{step.heading}</h2>
            {renderStepContent()}
            {step.whyText && <WhyWeAsk text={step.whyText} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {status.type === 'error' && (
        <div className="mstep-error" role="alert">{status.message}</div>
      )}

      <FormNavigation
        onBack={goBack}
        onNext={isReviewStep ? handleSubmit : goNext}
        onSkip={handleSkip}
        showBack={currentStep > 0}
        showSkip={step.skippable}
        nextLabel={isReviewStep ? 'Submit Enquiry' : 'Continue'}
        isSubmitting={isSubmitting}
      />

    </div>
  )
}

export default MultiStepEnquiryForm
