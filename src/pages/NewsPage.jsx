import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ARTICLES, mapArticleFromApi } from '../data/articles'
import { EASE } from '../constants/animation'
import './NewsPage.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TileVisual({ article, eager = false }) {
  if (article.image) {
    return (
      <div className="news-tile__visual">
        <img
          src={article.image}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          className="news-tile__img"
        />
      </div>
    )
  }
  // Fallback: gradient block (used if image fails to provide)
  return (
    <div
      className="news-tile__visual news-tile__visual--gradient"
      style={{ '--tile-c1': article.tile?.c1, '--tile-c2': article.tile?.c2 }}
    />
  )
}

function NewsPage() {
  const [articles, setArticles] = useState(null)

  useEffect(() => {
    document.title = 'News - Flight Speakers'
  }, [])

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles.map(mapArticleFromApi))
        } else {
          setArticles(ARTICLES)
        }
      })
      .catch(() => {
        setArticles(ARTICLES)
      })
  }, [])

  // While loading, show static articles to avoid blank flash
  const displayArticles = articles ?? ARTICLES
  const [featured, ...rest] = displayArticles

  return (
    <div className="news-page">
      <motion.header
        className="news-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="container">
          <span className="news-hero__eyebrow">News</span>
          <h1 className="news-hero__title">Insights, rankings and guides on the global speaker industry.</h1>
        </div>
      </motion.header>

      <section className="news-grid-section">
        <div className="container">
          {/* Featured (most recent) — magazine-style hero */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Link to={`/news/${featured.slug}`} className="news-feature">
                <div className="news-feature__visual">
                  {featured.image ? (
                    <img
                      src={featured.image}
                      alt=""
                      loading="eager"
                      className="news-feature__img"
                    />
                  ) : (
                    <div
                      className="news-feature__visual--gradient"
                      style={{ '--tile-c1': featured.tile?.c1, '--tile-c2': featured.tile?.c2 }}
                    />
                  )}
                </div>
                <div className="news-feature__body">
                  <span className="news-feature__category">{featured.category}</span>
                  <h2 className="news-feature__title">{featured.title}</h2>
                  <p className="news-feature__excerpt">{featured.excerpt}</p>
                  <div className="news-feature__meta">
                    <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{featured.readTime} min read</span>
                    <span className="news-feature__cta" aria-hidden="true">
                      Read
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7h8M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grid for the rest */}
          {rest.length > 0 && (
            <div className="news-grid">
              {rest.map((article, i) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                >
                  <Link to={`/news/${article.slug}`} className="news-tile">
                    <TileVisual article={article} eager={i < 3} />
                    <div className="news-tile__body">
                      <span className="news-tile__category">{article.category}</span>
                      <h3 className="news-tile__title">{article.title}</h3>
                      <p className="news-tile__excerpt">{article.excerpt}</p>
                      <div className="news-tile__meta">
                        <time dateTime={article.date}>{formatDate(article.date)}</time>
                        <span className="news-tile__sep" aria-hidden="true">·</span>
                        <span>{article.readTime} min read</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default NewsPage
