import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import AISearchBar from '../components/search/AISearchBar'
import SpeakerGrid from '../components/speakers/SpeakerGrid'
import { speakers } from '../data/speakers'
import { matchSpeakers } from '../utils/aiMatching'
import './SearchResultsPage.css'

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''

  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState({ speakers: [], reasonings: {} })

  useEffect(() => {
    if (query) {
      setIsLoading(true)
      // Simulate API call delay for realistic UX
      const timer = setTimeout(() => {
        const matched = matchSpeakers(query, speakers)
        setResults(matched)
        setIsLoading(false)
      }, 800)
      return () => clearTimeout(timer)
    } else {
      setResults({ speakers: [], reasonings: {} })
    }
  }, [query])

  const handleSearch = (newQuery) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`)
  }

  return (
    <div className="search-results-page">
      {/* Search Header */}
      <section className="search-header">
        <div className="container">
          <h1 className="search-header__title">Find Your Speaker</h1>
          <p className="search-header__subtitle">
            Describe your event and our AI will match you with the perfect speakers
          </p>
          <AISearchBar
            variant="compact"
            initialQuery={query}
            onSearch={handleSearch}
          />
        </div>
      </section>

      {/* Results Section */}
      <section className="section search-results">
        <div className="container">
          {!query ? (
            <div className="search-empty">
              <div className="search-empty__icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M32 8L38 20L52 22L42 32L44 46L32 40L20 46L22 32L12 22L26 20L32 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Tell us about your event</h2>
              <p>
                Enter a description of your event, audience, and the type of speaker you're looking for.
                Our AI will analyze your brief and recommend the best matches.
              </p>
              <div className="search-empty__suggestions">
                <h3>Example searches:</h3>
                <ul>
                  <li>
                    <button onClick={() => handleSearch("500 women in business conference in Boston in February")}>
                      500 women in business conference in Boston in February
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleSearch("AI keynote for tech leadership summit, 200 attendees")}>
                      AI keynote for tech leadership summit, 200 attendees
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleSearch("Motivational speaker for sales kickoff, theme: peak performance")}>
                      Motivational speaker for sales kickoff, theme: peak performance
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleSearch("Corporate retreat wellness speaker for 50 executives")}>
                      Corporate retreat wellness speaker for 50 executives
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : isLoading ? (
            <div className="search-loading">
              <div className="search-loading__spinner"></div>
              <p>Analyzing your brief and finding matches...</p>
            </div>
          ) : (
            <>
              <div className="search-results__header">
                <div className="search-results__info">
                  <h2>
                    {results.speakers.length} Speaker{results.speakers.length !== 1 ? 's' : ''} Found
                  </h2>
                  <p className="search-results__query">
                    For: "{query}"
                  </p>
                </div>
                <Link
                  to={`/enquiry?brief=${encodeURIComponent(query)}`}
                  className="btn btn-primary"
                >
                  Submit This Brief
                </Link>
              </div>

              {results.speakers.length > 0 ? (
                <SpeakerGrid
                  speakers={results.speakers}
                  showReasoning={true}
                  reasonings={results.reasonings}
                />
              ) : (
                <div className="search-no-results">
                  <h3>No exact matches found</h3>
                  <p>Try broadening your search or submit your brief and our team will find the perfect speaker.</p>
                  <Link to="/enquiry" className="btn btn-primary">
                    Submit Your Brief
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Browse All CTA */}
      {query && (
        <section className="section browse-cta">
          <div className="container">
            <div className="browse-cta__content">
              <h2>Want to see all speakers?</h2>
              <p>Browse our full roster of curated talent</p>
              <Link to="/" className="btn btn-secondary">
                View All Speakers
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default SearchResultsPage
