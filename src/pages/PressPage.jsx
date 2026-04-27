import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ARTICLES } from '../data/articles'
import { EASE } from '../constants/animation'
import './PressPage.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatIssueMonth(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()
}

function PressPage() {
  useEffect(() => {
    document.title = 'Press - Flight Story Speakers'
  }, [])

  const [featured, ...rest] = ARTICLES

  return (
    <div className="press-page">
      <motion.header
        className="press-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <div className="container press-container">
          <div className="press-hero__meta">
            <span className="press-hero__eyebrow">Press</span>
            <span className="press-hero__rule" aria-hidden="true" />
            <span className="press-hero__issue">{formatIssueMonth(featured.date)} · Issue 01</span>
          </div>
          <h1 className="press-hero__title">
            Commentary on <em>the business of</em> great speakers.
          </h1>
          <p className="press-hero__sub">
            Perspective, guides and opinion from the team at Flight Story.
          </p>
        </div>
      </motion.header>

      <section className="press-list">
        <div className="container press-container">
          {/* Featured (first article) */}
          <motion.article
            className="press-feature"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Link to={`/press/${featured.slug}`} className="press-feature__link">
              <div className="press-feature__header">
                <span className="press-feature__flag">Featured</span>
                <span className="press-feature__dot" aria-hidden="true" />
                <span className="press-feature__category">{featured.category}</span>
              </div>
              <h2 className="press-feature__title">{featured.title}</h2>
              <p className="press-feature__excerpt">{featured.excerpt}</p>
              <div className="press-feature__foot">
                <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                <span aria-hidden="true">·</span>
                <span>{featured.readTime} min read</span>
                <span className="press-feature__more">
                  Read the article
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7h8M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </Link>
          </motion.article>

          <div className="press-divider" aria-hidden="true">
            <span>More from the desk</span>
          </div>

          {/* Numbered list of remaining articles */}
          <ol className="press-stack">
            {rest.map((article, i) => (
              <motion.li
                key={article.slug}
                className="press-stack__item"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
              >
                <Link to={`/press/${article.slug}`} className="press-stack__link">
                  <span className="press-stack__num" aria-hidden="true">
                    {String(i + 2).padStart(2, '0')}
                  </span>
                  <div className="press-stack__content">
                    <span className="press-stack__category">{article.category}</span>
                    <span className="press-stack__title">{article.title}</span>
                    <span className="press-stack__meta">
                      <time dateTime={article.date}>{formatDate(article.date)}</time>
                      <span aria-hidden="true">·</span>
                      <span>{article.readTime} min read</span>
                    </span>
                  </div>
                  <svg className="press-stack__arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7h8M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}

export default PressPage
