import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './AISearchBar.css'

const AISearchBar = forwardRef(function AISearchBar({ variant = 'default', initialQuery = '', onSearch, hideSubmit = false, showEditHint = false }, ref) {
  const [query, setQuery] = useState(initialQuery)
  const inputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  useImperativeHandle(ref, () => ({
    setQuery,
    focus: () => inputRef.current?.focus(),
  }), [])
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

  return (
    <div className={`ai-search ai-search--${variant}`}>
      <form onSubmit={handleSubmit} className="ai-search__form">
        <div className={`ai-search__container ${isFocused ? 'ai-search__container--focused' : ''}`}>
          <div className="ai-search__icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.75 15.75L12.4875 12.4875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe your event and ideal speaker..."
            className="ai-search__input"
          />
          {!hideSubmit && (
            <motion.button
              type="submit"
              className="ai-search__button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!query.trim()}
            >
              Find Speakers
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          )}
          {showEditHint && (
            <button
              type="button"
              className="ai-search__edit"
              onClick={() => inputRef.current?.focus()}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 1.5L14.5 4.5M1 15L1.5 11.5L12 1L15 4L4.5 14.5L1 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  )
})

export default AISearchBar
