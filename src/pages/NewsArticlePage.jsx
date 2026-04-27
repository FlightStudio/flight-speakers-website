import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getArticleBySlug, getRelatedArticles } from '../data/articles'
import { EASE } from '../constants/animation'
import './NewsPage.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderInline(text) {
  // Lightweight markdown-link parser: [label](/path) -> <Link>
  const parts = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const [, label, href] = match
    if (href.startsWith('/')) {
      parts.push(<Link key={key++} to={href}>{label}</Link>)
    } else {
      parts.push(<a key={key++} href={href} target="_blank" rel="noopener noreferrer">{label}</a>)
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function NewsArticlePage() {
  const { slug } = useParams()
  const article = getArticleBySlug(slug)

  useEffect(() => {
    if (article) {
      document.title = `${article.title} - Flight Story Speakers`
    }
  }, [article])

  if (!article) {
    return (
      <div className="news-page">
        <div className="container news-article__container">
          <div className="news-missing">
            <p>Article not found.</p>
            <Link to="/news" className="news-missing__back">All news</Link>
          </div>
        </div>
      </div>
    )
  }

  const related = getRelatedArticles(slug, 2)

  return (
    <div className="news-page">
      <motion.article
        className="news-article"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="container news-article__container">
          <div className="news-article__back">
            <Link to="/news">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M11 7H3M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All news
            </Link>
          </div>

          <header className="news-article__header">
            <div className="news-article__flag">
              <span className="news-article__category">{article.category}</span>
              <span className="news-article__dot" aria-hidden="true" />
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{article.readTime} min read</span>
            </div>
            <h1 className="news-article__title">{article.title}</h1>
            <p className="news-article__byline">
              <span className="news-article__byline-label">Written by</span>
              <span className="news-article__byline-name">the Flight Story team</span>
            </p>
          </header>

          <div className="news-article__body">
            {article.body.map((block, i) => {
              if (block.type === 'h2') {
                return <h2 key={i}>{block.text}</h2>
              }
              const isLead = i === 0 && block.type === 'p'
              return (
                <p key={i} className={isLead ? 'news-article__lead' : undefined}>
                  {renderInline(block.text)}
                </p>
              )
            })}
          </div>

          {related.length > 0 && (
            <aside className="news-related">
              <h3 className="news-related__heading">Read next</h3>
              <ul>
                {related.map((r, i) => (
                  <li key={r.slug}>
                    <Link to={`/news/${r.slug}`} className="news-related__item">
                      <span className="news-related__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="news-related__category">{r.category}</span>
                      <span className="news-related__title">{r.title}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="news-related__arrow">
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

export default NewsArticlePage
