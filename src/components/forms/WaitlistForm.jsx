import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  useWaitlistForm,
  TOPIC_OPTIONS,
  SPEAKING_EXPERIENCE_OPTIONS,
  REPRESENTATION_OPTIONS,
  WAITLIST_CURRENCIES,
  WAITLIST_STEPS,
  WAITLIST_TOTAL_STEPS,
  getWaitlistBudgetBrackets,
} from '../../hooks/useWaitlistForm'
import FormNavigation from './FormNavigation'
import FormField from './FormField'
import { EASE } from '../../constants/animation'
import './MultiStepEnquiryForm.css'

// Simple progress bar that accepts totalSteps as a prop
// (avoids hard-coupling to TOTAL_STEPS from the enquiry hook)
function WaitlistProgressBar({ currentStep, totalSteps }) {
  return (
    <div
      className="mstep-progress"
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
    >
      <div className="mstep-progress__dots">
        {Array.from({ length: totalSteps }, (_, i) => (
          <motion.span
            key={i}
            className={`mstep-progress__dot${i <= currentStep ? ' mstep-progress__dot--active' : ''}`}
            initial={false}
            animate={{ scale: i === currentStep ? 1.3 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

// Section anchor badge e.g. "01 ABOUT YOU"
function StepAnchor({ label, title }) {
  return (
    <div className="wstep-anchor">
      <span className="wstep-anchor__num">{label}</span>
      <span className="wstep-anchor__title">{title}</span>
    </div>
  )
}

// Success screen specific to waitlist
function WaitlistSuccessScreen({ firstName }) {
  return (
    <motion.div
      className="mstep-success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="mstep-success__icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <motion.circle
            cx="32" cy="32" r="30"
            stroke="currentColor" strokeWidth="2" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          <motion.path
            d="M20 32L28 40L44 24"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
          />
        </svg>
      </div>

      <motion.h2
        className="mstep-success__title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
      >
        Thank you{firstName ? `, ${firstName}` : ''}
      </motion.h2>

      <motion.p
        className="mstep-success__message"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
      >
        We've received your application and added you to the waitlist.
      </motion.p>

      <motion.p
        className="mstep-success__message"
        style={{ fontSize: 'var(--text-base)', marginTop: '-1rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0, ease: EASE }}
      >
        We review submissions monthly. You'll hear from us if there's a fit.
      </motion.p>

      <motion.div
        className="mstep-success__actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.2, ease: EASE }}
      >
        <Link to="/" className="mstep-success__action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12L12 4L21 12M5 10V20H19V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to home
        </Link>
      </motion.div>
    </motion.div>
  )
}

function WaitlistForm() {
  const {
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
  } = useWaitlistForm()

  const shouldReduceMotion = useReducedMotion()
  const step = WAITLIST_STEPS[currentStep]
  const isReviewStep = step.id === 'review'
  const budgetBrackets = getWaitlistBudgetBrackets(formData.feeCurrency)
  const firstName = formData.fullName ? formData.fullName.trim().split(' ')[0] : ''

  // Auto-focus first input on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector('.mstep-step')
      if (!container) return
      const input = container.querySelector('input:not([type="checkbox"]):not([type="hidden"]), select, textarea')
      if (input) input.focus()
    }, 150)
    return () => clearTimeout(timer)
  }, [currentStep])

  // When currency changes, reset bracket selection to avoid stale value
  const handleCurrencyChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, feeCurrency: e.target.value, feeBracket: '' }))
  }, [setFormData])

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return
    if (e.target.tagName === 'TEXTAREA') return
    e.preventDefault()
    if (!isReviewStep) goNext()
  }, [isReviewStep, goNext])

  const slideDistance = shouldReduceMotion ? 0 : 40
  const variants = {
    enter: (dir) => ({ y: dir > 0 ? slideDistance : -slideDistance, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir) => ({ y: dir > 0 ? -slideDistance : slideDistance, opacity: 0 }),
  }

  // Success state
  if (status.type === 'success') {
    return (
      <div className="mstep">
        <WaitlistSuccessScreen firstName={firstName} />
      </div>
    )
  }

  const renderStepContent = () => {
    // ── Step 0: About You ──────────────────────────────────────────────────
    if (step.id === 'about') {
      return (
        <div className="mstep-step__fields">
          <FormField
            label="Full name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
            placeholder="Your full name"
            autoFocus
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="you@example.com"
          />
          <FormField
            label="Phone (optional)"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="+44 7700 900000"
          />
          <FormField
            label="Based in"
            name="basedIn"
            type="text"
            value={formData.basedIn}
            onChange={handleChange}
            error={errors.basedIn}
            required
            placeholder="London, UK"
          />
          <FormField
            label="Current title &amp; company"
            name="titleCompany"
            type="text"
            value={formData.titleCompany}
            onChange={handleChange}
            error={errors.titleCompany}
            required
            placeholder="CEO, Founder, Author — and the organisation"
          />
        </div>
      )
    }

    // ── Step 1: Your Work (main) ───────────────────────────────────────────
    if (step.id === 'work-main') {
      return (
        <div className="mstep-step__fields">
          <FormField
            label="What do you speak about?"
            name="speaksAbout"
            type="textarea"
            value={formData.speaksAbout}
            onChange={handleChange}
            error={errors.speaksAbout}
            required
            placeholder="In your own words. The talks, themes, or expertise you're known for."
            rows={4}
            autoFocus
          />

          <div className="mstep-field">
            <label className="mstep-field__label">Topic areas</label>
            <div className="wstep-topics">
              {TOPIC_OPTIONS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  className={`wstep-topic-btn${formData.topics.includes(topic) ? ' wstep-topic-btn--active' : ''}`}
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
            {errors.topics && (
              <motion.p
                className="mstep-field__error"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {errors.topics}
              </motion.p>
            )}
          </div>

          <FormField
            label="Speaking experience"
            name="speakingExperience"
            type="select"
            value={formData.speakingExperience}
            onChange={handleChange}
            error={errors.speakingExperience}
            required
            options={SPEAKING_EXPERIENCE_OPTIONS}
            placeholder="Select your experience level"
          />
        </div>
      )
    }

    // ── Step 2: Your Work (fee) ────────────────────────────────────────────
    if (step.id === 'work-fee') {
      return (
        <div className="mstep-step__fields">
          <div className="mstep-field">
            <label className="mstep-field__label">Typical speaking fee</label>
            <div className="wstep-fee-row">
              <div className="wstep-fee-row__currency">
                <select
                  name="feeCurrency"
                  value={formData.feeCurrency}
                  onChange={handleCurrencyChange}
                  className="mstep-currency-select"
                >
                  {WAITLIST_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="wstep-fee-row__brackets">
                {budgetBrackets.map(bracket => (
                  <button
                    key={bracket}
                    type="button"
                    className={`mstep-budget-options__btn${formData.feeBracket === bracket ? ' mstep-budget-options__btn--active' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, feeBracket: bracket }))
                      if (errors.feeBracket) {
                        // clear error
                      }
                    }}
                  >
                    {bracket}
                  </button>
                ))}
              </div>
            </div>
            {errors.feeBracket && (
              <motion.p
                className="mstep-field__error"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {errors.feeBracket}
              </motion.p>
            )}
          </div>
        </div>
      )
    }

    // ── Step 3: Profile & Links ────────────────────────────────────────────
    if (step.id === 'profile') {
      return (
        <div className="mstep-step__fields">
          <FormField
            label="Website (optional)"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            error={errors.website}
            placeholder="https://yoursite.com"
            autoFocus
          />
          <FormField
            label="LinkedIn (optional)"
            name="linkedin"
            type="text"
            value={formData.linkedin}
            onChange={handleChange}
            error={errors.linkedin}
            placeholder="linkedin.com/in/..."
          />
          <FormField
            label="Showreel or talk video (optional)"
            name="showreel"
            type="url"
            value={formData.showreel}
            onChange={handleChange}
            error={errors.showreel}
            placeholder="YouTube, Vimeo, or a public link"
          />
          <FormField
            label="Instagram / social handle (optional)"
            name="instagram"
            type="text"
            value={formData.instagram}
            onChange={handleChange}
            error={errors.instagram}
            placeholder="@yourhandle"
          />
          <FormField
            label="Notable engagements (optional)"
            name="notableEngagements"
            type="textarea"
            value={formData.notableEngagements}
            onChange={handleChange}
            error={errors.notableEngagements}
            placeholder="SXSW 2025, TED, internal keynote at Google, etc."
            rows={3}
          />
        </div>
      )
    }

    // ── Step 4: Representation ─────────────────────────────────────────────
    if (step.id === 'representation') {
      return (
        <div className="mstep-step__fields">
          <div className="mstep-field">
            <label className="mstep-field__label">Current representation status</label>
            <div className="wstep-rep-cards">
              {REPRESENTATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`wstep-rep-card${formData.representationStatus === opt.value ? ' wstep-rep-card--active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'representationStatus', value: opt.value } })}
                >
                  <div className="wstep-rep-card__radio" aria-hidden="true" />
                  <div className="wstep-rep-card__text">
                    <span className="wstep-rep-card__title">{opt.title}</span>
                    <span className="wstep-rep-card__helper">{opt.helper}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.representationStatus && (
              <motion.p
                className="mstep-field__error"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {errors.representationStatus}
              </motion.p>
            )}
          </div>

          <FormField
            label="Why FlightSpeakers? (optional)"
            name="whyFlightspeakers"
            type="textarea"
            value={formData.whyFlightspeakers}
            onChange={handleChange}
            error={errors.whyFlightspeakers}
            placeholder="What drew you to the roster, or what you're hoping for from a partner."
            rows={3}
          />
        </div>
      )
    }

    // ── Step 5: Review + Consent ───────────────────────────────────────────
    if (step.id === 'review') {
      return (
        <div className="wstep-review">
          {/* Section 01 */}
          <div className="wstep-review__section">
            <div className="wstep-review__section-label">01 About You</div>
            <div className="wstep-review__grid">
              <ReviewCell label="Full name" value={formData.fullName} onClick={() => goToStep(0)} />
              <ReviewCell label="Email" value={formData.email} onClick={() => goToStep(0)} />
              <ReviewCell label="Based in" value={formData.basedIn} onClick={() => goToStep(0)} />
              <ReviewCell label="Title &amp; company" value={formData.titleCompany} onClick={() => goToStep(0)} />
              {formData.phone && (
                <ReviewCell label="Phone" value={formData.phone} onClick={() => goToStep(0)} />
              )}
            </div>
          </div>

          {/* Section 02 */}
          <div className="wstep-review__section">
            <div className="wstep-review__section-label">02 Your Work</div>
            <div className="wstep-review__grid">
              <div className="wstep-review__cell wstep-review__cell--wide" onClick={() => goToStep(1)} style={{ cursor: 'pointer' }}>
                <div className="wstep-review__label">Speaks about</div>
                <div className="wstep-review__value" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {formData.speaksAbout || <span className="wstep-review__value--empty">—</span>}
                </div>
              </div>
              <ReviewCell label="Topics" value={formData.topics.join(', ')} onClick={() => goToStep(1)} />
              <ReviewCell label="Experience" value={formData.speakingExperience} onClick={() => goToStep(1)} />
              <ReviewCell label="Fee" value={`${formData.feeCurrency} — ${formData.feeBracket}`} onClick={() => goToStep(2)} />
            </div>
          </div>

          {/* Section 03 */}
          <div className="wstep-review__section">
            <div className="wstep-review__section-label">03 Profile &amp; Links</div>
            <div className="wstep-review__grid">
              <ReviewCell label="Website" value={formData.website} emptyLabel="Not provided" onClick={() => goToStep(3)} />
              <ReviewCell label="LinkedIn" value={formData.linkedin} emptyLabel="Not provided" onClick={() => goToStep(3)} />
              <ReviewCell label="Showreel" value={formData.showreel} emptyLabel="Not provided" onClick={() => goToStep(3)} />
              <ReviewCell label="Instagram" value={formData.instagram} emptyLabel="Not provided" onClick={() => goToStep(3)} />
            </div>
          </div>

          {/* Section 04 */}
          <div className="wstep-review__section">
            <div className="wstep-review__section-label">04 Representation</div>
            <div className="wstep-review__grid">
              <div className="wstep-review__cell wstep-review__cell--wide" onClick={() => goToStep(4)} style={{ cursor: 'pointer' }}>
                <div className="wstep-review__label">Status</div>
                <div className="wstep-review__value">{formData.representationStatus || <span className="wstep-review__value--empty">—</span>}</div>
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="wstep-consent">
            <label className="wstep-consent__checkbox">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
              />
              <span className="wstep-consent__text">
                I agree to FlightSpeakers storing my information for the purpose of evaluating roster fit.
                {' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">See our privacy policy.</a>
              </span>
            </label>
            {errors.consent && (
              <motion.p
                className="mstep-field__error"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {errors.consent}
              </motion.p>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="mstep" onKeyDown={handleKeyDown}>
      <WaitlistProgressBar currentStep={currentStep} totalSteps={WAITLIST_TOTAL_STEPS} />

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
            <StepAnchor label={step.label} title={step.title} />
            <h2 className="mstep-step__heading">{getStepHeading(step.id)}</h2>
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {status.type === 'error' && (
        <div className="mstep-error" role="alert">{status.message}</div>
      )}

      <FormNavigation
        onBack={goBack}
        onNext={isReviewStep ? submitForm : goNext}
        showBack={currentStep > 0}
        showSkip={false}
        nextLabel={isReviewStep ? 'Join the Waitlist →' : 'Continue'}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

// Helper: review cell component
function ReviewCell({ label, value, emptyLabel = '—', onClick }) {
  const display = value && value.trim() ? value : null
  return (
    <div className="wstep-review__cell" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="wstep-review__label">{label}</div>
      {display
        ? <div className="wstep-review__value">{display}</div>
        : <div className="wstep-review__value wstep-review__value--empty">{emptyLabel}</div>
      }
    </div>
  )
}

function getStepHeading(stepId) {
  switch (stepId) {
    case 'about':          return 'Tell us about yourself'
    case 'work-main':      return 'What do you speak about?'
    case 'work-fee':       return 'What\'s your typical fee?'
    case 'profile':        return 'Your profile and links'
    case 'representation': return 'Representation'
    case 'review':         return 'Review your application'
    default:               return ''
  }
}

export default WaitlistForm
