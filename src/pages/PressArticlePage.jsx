import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getArticleBySlug, getRelatedArticles } from '../data/articles'
import { EASE } from '../constants/animation'
import './PressPage.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PressArticlePage() {
  const { slug } = useParams()
  const article = getArticleBySlug(slug)

  useEffect(() => {
    if (article) {
      document.title = `${article.title} - Flight Story Speakers`
    }
  }, [article])

  if (!article) {
    return (
      <div className="press-page">
        <div className="container press-container">
          <div className="press-missing">
            <p>Article not found.</p>
            <Link to="/press" className="press-missing__back">← All press</Link>
          </div>
        </div>
      </div>
    )
  }

  const related = getRelatedArticles(slug, 2)

  return (
    <div className="press-page">
      <motion.article
        className="press-article"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="container press-container">
          <div className="press-article__back">
            <Link to="/press">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M11 7H3M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All press
            </Link>
          </div>

          <header className="press-article__header">
            <div className="press-article__flag">
              <span className="press-article__category">{article.category}</span>
              <span className="press-article__dot" aria-hidden="true" />
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{article.readTime} min read</span>
            </div>
            <h1 className="press-article__title">{article.title}</h1>
            <p className="press-article__byline">
              <span className="press-article__byline-label">Written by</span>
              <span className="press-article__byline-name">the Flight Story team</span>
            </p>
          </header>

          <div className="press-article__body">
            {article.body.map((block, i) => {
              if (block.type === 'h2') {
                return <h2 key={i}>{block.text}</h2>
              }
              // Drop-cap treatment on the very first paragraph
              const isLead = i === 0 && block.type === 'p'
              return (
                <p key={i} className={isLead ? 'press-article__lead' : undefined}>
                  {block.text}
                </p>
              )
            })}
          </div>

          {related.length > 0 && (
            <aside className="press-related">
              <h3 className="press-related__heading">Read next</h3>
              <ul>
                {related.map((r, i) => (
                  <li key={r.slug}>
                    <Link to={`/press/${r.slug}`} className="press-related__item">
                      <span className="press-related__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="press-related__category">{r.category}</span>
                      <span className="press-related__title">{r.title}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="press-related__arrow">
                        <path d="M3 6h6M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </motion.article>
    </div>
  )
}

export default PressArticlePage
