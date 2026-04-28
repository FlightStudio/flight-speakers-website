// Article generation scheduler.
// Fires twice a week (Mon + Thu at 09:00 UTC) in production.
// No-op in development unless ENABLE_ARTICLE_CRON=true is set.

import cron from 'node-cron'
import { generateArticle } from './articleGenerator.js'

export function startArticleScheduler() {
  const isProduction = process.env.NODE_ENV === 'production'
  const forceEnabled = process.env.ENABLE_ARTICLE_CRON === 'true'

  if (!isProduction && !forceEnabled) {
    console.log('[ArticleScheduler] Skipped (not production; set ENABLE_ARTICLE_CRON=true to override)')
    return
  }

  // 9:00 UTC every Monday (1) and Thursday (4)
  cron.schedule('0 9 * * 1,4', () => {
    console.log('[ArticleScheduler] Firing scheduled article generation...')
    generateArticle()
      .then(article => {
        console.log(`[ArticleScheduler] Draft created: ${article.id} — "${article.title}"`)
      })
      .catch(err => {
        console.error('[ArticleScheduler] Generation failed:', err.message)
      })
  })

  console.log('[ArticleScheduler] Scheduled: Mon + Thu at 09:00 UTC')
}
