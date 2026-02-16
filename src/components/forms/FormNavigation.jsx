function FormNavigation({
  onBack,
  onNext,
  onSkip,
  showBack = true,
  showSkip = false,
  nextLabel = 'Continue',
  isSubmitting = false,
}) {
  return (
    <div className="mstep-nav">
      <div className="mstep-nav__left">
        {showBack && (
          <button type="button" className="btn btn-ghost mstep-nav__back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
      </div>
      <div className="mstep-nav__right">
        {showSkip && (
          <button type="button" className="btn btn-ghost mstep-nav__skip" onClick={onSkip}>
            Skip
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary mstep-nav__next"
          onClick={onNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : nextLabel}
        </button>
      </div>
    </div>
  )
}

export default FormNavigation
