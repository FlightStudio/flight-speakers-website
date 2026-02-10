import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AISearchBar from '../components/search/AISearchBar'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import './SearchResultsPage.css'

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''

  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState({ speakers: [], reasonings: {} })

  useEffect(() => {
    if (!query) {
      setResults({ speakers: [], reasonings: {} })
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setResults({ speakers: data.speakers, reasonings: data.reasonings })
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
      {/* Hero Search Section */}
      <section className="search-hero">
        <div className="container">
          <motion.div
            className="search-hero__content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="search-hero__label">AI-Powered Discovery</span>

            <h1 className="search-hero__title">Find Your Perfect Speaker</h1>

            <p className="search-hero__subtitle">
              Describe your event and let our AI match you with world-class talent
            </p>

            <motion.div
              className="search-hero__search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AISearchBar
                variant="large"
                initialQuery={query}
                onSearch={handleSearch}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="section search-results">
        <div className="container">
          <AnimatePresence mode="wait">
            {!query ? (
              <motion.div
                key="empty"
                className="search-empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="search-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M22 40C31.9411 40 40 31.9411 40 22C40 12.0589 31.9411 4 22 4C12.0589 4 4 12.0589 4 22C4 31.9411 12.0589 40 22 40Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M44 44L34.65 34.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                <h2>Describe Your Event</h2>
                <p>
                  Tell us about your audience, theme, and goals. Our AI will analyze your brief
                  and recommend the most relevant speakers.
                </p>

                <div className="search-empty__examples">
                  <span className="search-empty__examples-label">Try an example:</span>
                  <div className="search-empty__examples-grid">
                    {exampleSearches.map((example, index) => (
                      <motion.button
                        key={index}
                        className="search-empty__example"
                        onClick={() => handleSearch(example)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
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
                </div>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="loading"
                className="search-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="search-loading__spinner">
                  <div className="search-loading__dot" />
                  <div className="search-loading__dot" />
                  <div className="search-loading__dot" />
                </div>
                <p className="search-loading__text">Analyzing your brief</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="search-results__header">
                  <div className="search-results__info">
                    <h2>
                      {results.speakers.length} speaker{results.speakers.length !== 1 ? 's' : ''} found
                    </h2>
                    <p className="search-results__query">for "{query}"</p>
                  </div>

                  <Link
                    to={`/enquiry?brief=${encodeURIComponent(query)}`}
                    className="btn btn-primary"
                  >
                    Submit This Brief
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
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
              <Link to="/" className="btn btn-secondary btn-lg">
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
