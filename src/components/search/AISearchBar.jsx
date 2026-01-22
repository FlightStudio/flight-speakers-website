import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AISearchBar.css'

function AISearchBar({ variant = 'hero', initialQuery = '', onSearch }) {
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      if (onSearch) {
        onSearch(query)
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`)
      }
    }
  }

  const exampleQueries = [
    "500 women in business conference in Boston",
    "AI keynote for tech leadership summit",
    "Leadership speaker for sales kickoff event",
    "Wellness expert for corporate retreat"
  ]

  return (
    <div className={`ai-search ${variant === 'hero' ? 'ai-search--hero' : ''}`}>
      <form onSubmit={handleSubmit} className="ai-search__form">
        <div className={`ai-search__input-wrapper ${isFocused ? 'ai-search__input-wrapper--focused' : ''}`}>
          <div className="ai-search__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe your event and ideal speaker..."
            className="ai-search__input"
          />
          <button type="submit" className="btn btn-primary ai-search__button">
            Find Speakers
          </button>
        </div>
      </form>

      {variant === 'hero' && (
        <div className="ai-search__examples">
          <span className="ai-search__examples-label">Try:</span>
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              type="button"
              className="ai-search__example"
              onClick={() => {
                setQuery(example)
                navigate(`/search?q=${encodeURIComponent(example)}`)
              }}
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AISearchBar
