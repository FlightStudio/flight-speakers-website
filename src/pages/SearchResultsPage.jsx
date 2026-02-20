import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AISearchBar from '../components/search/AISearchBar'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import BriefActions from '../components/brief/BriefActions'
import { EASE } from '../constants/animation'
import './SearchResultsPage.css'

// Animated analyzing orb — morphing gradient blob
function AnalyzingOrb() {
  return (
    <div className="analyzing-orb">
      <motion.div
        className="analyzing-orb__ring analyzing-orb__ring--outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="analyzing-orb__ring analyzing-orb__ring--inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="analyzing-orb__core"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// Cycling status messages — plays once through, then holds last message
function AnalyzingMessages({ query }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const messages = useMemo(() => [
    'Reading your brief',
    'Understanding your audience',
    'Matching speaker expertise',
    'Ranking best fits',
  ], [])

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => {
        if (prev >= messages.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="analyzing-messages">
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          className="analyzing-messages__text"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {messages[messageIndex]}
        </motion.p>
      </AnimatePresence>
      <motion.p
        className="analyzing-messages__query"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        "{query}"
      </motion.p>
    </div>
  )
}

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchBarRef = useRef(null)
  const query = searchParams.get('q') || ''

  // Always scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(() => {
    // Restore cached results for this query (back navigation)
    try {
      const cached = sessionStorage.getItem('searchResultsCache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.q === query && query) {
          return { speakers: parsed.speakers, reasonings: parsed.reasonings, scores: parsed.scores || {} }
        }
      }
    } catch {}
    return { speakers: [], reasonings: {}, scores: {} }
  })
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem('selectedSpeakerIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const updateSelectedIds = useCallback((updater) => {
    setSelectedSpeakerIds(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      sessionStorage.setItem('selectedSpeakerIds', JSON.stringify([...next]))
      return next
    })
  }, [])

  const toggleSpeakerSelect = useCallback((speakerId) => {
    updateSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(speakerId)) next.delete(speakerId)
      else next.add(speakerId)
      return next
    })
  }, [updateSelectedIds])

  const selectedSpeakers = useMemo(
    () => results.speakers.filter(s => selectedSpeakerIds.has(s.id)),
    [results.speakers, selectedSpeakerIds]
  )

  useEffect(() => {
    if (!query) {
      setResults({ speakers: [], reasonings: {}, scores: {} })
      return
    }

    // Check if we already have cached results for this exact query (back navigation)
    try {
      const cached = sessionStorage.getItem('searchResultsCache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.q === query) {
          // Restore from cache, preserve selections, skip fetch
          setResults({ speakers: parsed.speakers, reasonings: parsed.reasonings, scores: parsed.scores || {} })
          return
        }
      }
    } catch {}

    // New query: reset selections and fetch
    sessionStorage.removeItem('selectedSpeakerIds')
    setSelectedSpeakerIds(new Set())

    const controller = new AbortController()
    setIsLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const r = { speakers: data.speakers, reasonings: data.reasonings, scores: data.scores || {} }
          setResults(r)
          // Cache results so back navigation is instant
          sessionStorage.setItem('searchResultsCache', JSON.stringify({ q: query, ...r }))
        }
        setIsLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Search failed:', err)
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [query])

  const handleSearch = (newQuery) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`)
  }

  const exampleSearches = [
    "Women in business conference for 500 attendees",
    "AI keynote for tech leadership summit",
    "Motivational speaker for sales kickoff",
    "Corporate wellness retreat for executives"
  ]

  return (
    <div className="search-results-page">
      {/* Full-screen analyzing overlay */}
      <AnimatePresence>
        {isLoading && query && (
          <motion.div
            className="analyzing-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: EASE } }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="analyzing-overlay__content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <AnalyzingOrb />
              <motion.h2
                className="analyzing-overlay__title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              >
                Analyzing your brief
              </motion.h2>
              <AnalyzingMessages query={query} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single-screen hero: title, search bar, examples */}
      <section className={`search-hero${!query ? ' search-hero--full' : ''}`}>
        <div className="container">
          <motion.div
            className="search-hero__content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="search-hero__title">Find Your Perfect Speaker</h1>

            <motion.div
              className="search-hero__search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AISearchBar
                ref={searchBarRef}
                variant="large"
                initialQuery={query}
                onSearch={handleSearch}
              />
            </motion.div>

            {!query && (
              <motion.div
                className="search-hero__examples"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="search-hero__examples-label">Try an example:</span>
                <div className="search-hero__examples-grid">
                  {exampleSearches.map((example, index) => (
                    <motion.button
                      key={index}
                      className="search-hero__example"
                      onClick={() => {
                        searchBarRef.current?.setQuery(example)
                        searchBarRef.current?.focus()
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {example}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      {query && (
      <section className="section search-results">
        <div className="container">
          <AnimatePresence mode="wait">
            {isLoading ? (
              /* Invisible placeholder while overlay is showing */
              <motion.div
                key="loading"
                style={{ minHeight: 200 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
              />
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <div className="search-results__header">
                  <div className="search-results__info">
                    <h2>
                      {results.speakers.length} speaker{results.speakers.length !== 1 ? 's' : ''} found
                      {selectedSpeakerIds.size > 0 && (
                        <span className="search-results__selected-count">
                          {' '}&middot; {selectedSpeakerIds.size} selected
                        </span>
                      )}
                    </h2>
                    <p className="search-results__query">for "{query}"</p>
                    <span className="search-results__ai-badge">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
                      </svg>
                      Ranked by AI semantic analysis. Scores reflect how closely each speaker matches your brief
                    </span>
                  </div>

                  <div className="search-results__actions">
                    <Link
                      to={`/enquiry?brief=${encodeURIComponent(query)}`}
                      state={{ selectedSpeakers }}
                      className="btn btn-primary"
                      onClick={() => sessionStorage.removeItem('selectedSpeakerIds')}
                    >
                      Submit This Brief
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </div>

                {results.speakers.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <SpeakerGrid
                      speakers={results.speakers}
                      showReasoning={true}
                      reasonings={results.reasonings}
                      scores={results.scores}
                      searchBrief={query}
                      selectable={true}
                      selectedIds={selectedSpeakerIds}
                      onToggleSelect={toggleSpeakerSelect}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="search-no-results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3>No matches found</h3>
                    <p>
                      Try broadening your search or submit your brief directly
                      for personalized recommendations.
                    </p>
                    <Link to="/enquiry" className="btn btn-primary">
                      Submit Your Brief
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      )}

      {/* Sticky Brief Button — only when speakers are selected */}
      {query && !isLoading && selectedSpeakerIds.size > 0 && (
        <BriefActions
          speaker={selectedSpeakers[0] || results.speakers[0]}
          reasoning={results.reasonings[(selectedSpeakers[0] || results.speakers[0])?.id]}
          matchScore={results.scores[(selectedSpeakers[0] || results.speakers[0])?.id]}
          selectedSpeakers={selectedSpeakers.slice(1).map(s => ({
            ...s,
            matchScore: results.scores[s.id],
            reasoning: results.reasonings[s.id],
          }))}
          aiRecommendations={results.speakers
            .filter(s => !selectedSpeakerIds.has(s.id))
            .slice(0, 4)
            .map(s => ({
              ...s,
              matchScore: results.scores[s.id],
              reasoning: results.reasonings[s.id],
            }))}
          query={query}
          variant="sticky"
          showSubmitBrief={true}
          selectedSpeakersForSubmit={selectedSpeakers}
        />
      )}

      {/* Browse All CTA */}
      {query && !isLoading && (
        <motion.section
          className="section browse-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="container">
            <div className="browse-cta__content">
              <h2>Browse Our Full Roster</h2>
              <p>Discover all the world-class speakers in our curated collection</p>
              <Link to="/speakers" className="btn btn-secondary btn-lg">
                View All Speakers
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  )
}

export default SearchResultsPage
