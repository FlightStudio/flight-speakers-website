import { motion } from 'framer-motion'
import { ARTICLES } from '../../data/articles'
import { EASE } from '../../constants/animation'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminNewsGuidePage() {
  return (
    <motion.div
      className="admin-page admin-news-guide"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">News &amp; SEO Editorial Guide</h1>
          <p className="admin-page__subtitle">
            The writing rules and template used across the public News section. Use this as a brief
            when commissioning new articles, or as a self-check before publishing.
          </p>
        </div>
        <a
          href="/news"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-news-guide__link-out"
        >
          View live news page
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3h6v6M11 3 4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </header>

      {/* Current articles overview */}
      <section className="admin-news-guide__section">
        <h2 className="admin-news-guide__h2">Current articles ({ARTICLES.length})</h2>
        <p className="admin-news-guide__intro">
          The published News section is generated from a single data file. To edit or add an article,
          update <code>src/data/articles.js</code> and the public site refreshes automatically.
        </p>
        <div className="admin-news-guide__articles">
          {ARTICLES.map((article) => (
            <a
              key={article.slug}
              href={`/news/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-news-guide__article"
            >
              <div className="admin-news-guide__article-meta">
                <span className="admin-news-guide__article-cat">{article.category}</span>
                <span className="admin-news-guide__article-date">{formatDate(article.date)}</span>
                <span className="admin-news-guide__article-words">~{article.readTime * 200} words</span>
              </div>
              <div className="admin-news-guide__article-title">{article.title}</div>
              <div className="admin-news-guide__article-slug">/news/{article.slug}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Writing template */}
      <section className="admin-news-guide__section">
        <h2 className="admin-news-guide__h2">Writing template</h2>
        <p className="admin-news-guide__intro">
          Every article follows the same structural pattern. This is what consistently ranks for the
          keynote-bureau category on Google in 2026, combining classic SEO listicle structure with
          editorial credibility signals (E-E-A-T).
        </p>

        <ol className="admin-news-guide__steps">
          <li>
            <h3>Title <span>10-12 words</span></h3>
            <p>Include the year, the region or audience, and an intent verb (<em>"to hire"</em>, <em>"for 2026"</em>, <em>"to inspire"</em>). Lead with the search query someone would type.</p>
            <div className="admin-news-guide__example">
              <strong>Good:</strong> The Best Keynote Speakers to Hire in the UK for 2026
            </div>
            <div className="admin-news-guide__example admin-news-guide__example--bad">
              <strong>Avoid:</strong> Inspiring Voices: A Curated Selection of Modern Thought Leaders
            </div>
          </li>

          <li>
            <h3>Opening paragraph <span>50-80 words</span></h3>
            <p>Establish authority (the bureau, the curation), describe the market reality, state what the guide delivers. No hype, no cliché openers.</p>
          </li>

          <li>
            <h3>Question H2 <span>featured-snippet bait</span></h3>
            <p>An H2 phrased as a question ("What makes a strong keynote speaker for UK audiences?") captures Google's featured-snippet box and "People Also Ask" panel. Follow with a 100-200 word direct answer.</p>
          </li>

          <li>
            <h3>Listicle intro H2</h3>
            <p>One short paragraph setting up the list and explaining the selection criteria.</p>
          </li>

          <li>
            <h3>Numbered speaker H2s <span>1, 2, 3 ...</span></h3>
            <p>Each speaker gets their own H2 with the number (e.g. <em>"1. Steven Bartlett"</em>). The body underneath follows a consistent template:</p>
            <ul className="admin-news-guide__substeps">
              <li><strong>First sentence</strong>: credentials line (titles, books, podcasts, organisations they have worked with).</li>
              <li><strong>Middle</strong>: 100-150 words on what they cover and why audiences value them.</li>
              <li><strong>Closing</strong>: implicit value statement — <em>"UK organisations book them for X events"</em> or <em>"Audiences value their ability to Y"</em>. This is the social-proof anchor that ranks.</li>
            </ul>
          </li>

          <li>
            <h3>Soft CTA H2 <span>close</span></h3>
            <p>Direct but not urgent. <em>"Hire One of the Best Keynote Speakers Today"</em>. Internal link to <code>/enquiry</code>. No countdown timers, no "limited spots left", no exclamation marks.</p>
          </li>
        </ol>
      </section>

      {/* Quality rules */}
      <section className="admin-news-guide__section">
        <h2 className="admin-news-guide__h2">Quality rules</h2>
        <p className="admin-news-guide__intro">
          Style and tone choices that signal trustworthy, journalistic content rather than marketing
          copy. Google's Helpful Content systems penalise the latter.
        </p>

        <div className="admin-news-guide__rules-grid">
          <div className="admin-news-guide__rules">
            <h3 className="admin-news-guide__rules-h">Do</h3>
            <ul>
              <li>Active voice, third-person editorial tone</li>
              <li>Concrete authority signals (BBC, Stanford, FTSE 100, Fortune 500, JPMorgan)</li>
              <li>Specific book and podcast names <em>(italicised so Google parses them as proper nouns)</em></li>
              <li>Numerical credibility (<em>"700+ hours of interviews"</em>, <em>"30-year broadcast career"</em>)</li>
              <li>Year in title and recurring through the body</li>
              <li>UK English on UK-targeted articles, US English on US-targeted articles</li>
              <li>Internal links to <code>/enquiry</code>, <code>/speakers</code>, <code>/search</code></li>
              <li>Implicit value statements ("organisations book her for X")</li>
            </ul>
          </div>
          <div className="admin-news-guide__rules admin-news-guide__rules--avoid">
            <h3 className="admin-news-guide__rules-h">Avoid</h3>
            <ul>
              <li>Pricing, fees, costs, or budget figures</li>
              <li>Superlatives — <em>"amazing"</em>, <em>"incredible"</em>, <em>"must-see"</em></li>
              <li>Marketing speak — <em>"thought leader"</em>, <em>"deep dive"</em>, <em>"actionable insights"</em></li>
              <li>Exclamation marks anywhere in the body</li>
              <li>Generic openers — <em>"Let's dive in"</em>, <em>"In today's fast-paced world"</em></li>
              <li>Em dashes — use hyphens, commas, or full stops</li>
              <li>Vague claims without a specific source or example behind them</li>
              <li>Calls to urgency — <em>"limited spots"</em>, <em>"don't miss out"</em></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Authority signals */}
      <section className="admin-news-guide__section">
        <h2 className="admin-news-guide__h2">Speaker authority signals</h2>
        <p className="admin-news-guide__intro">
          When writing a speaker entry, anchor their authority with specific, verifiable details.
          Audiences trust concrete claims; Google rewards them.
        </p>
        <div className="admin-news-guide__signals">
          <div>
            <h4>Books</h4>
            <p>Italicised, with the publisher implied. <em>"Author of </em>Hooked<em> and </em>Indistractable<em>"</em>.</p>
          </div>
          <div>
            <h4>Podcasts &amp; shows</h4>
            <p>Name the show + their role. <em>"Host of </em>The Diary of a CEO<em>"</em>, <em>"Resident expert on the BBC's Married at First Sight UK"</em>.</p>
          </div>
          <div>
            <h4>Education / research</h4>
            <p>Specific positions and institutions. <em>"Lecturer at Stanford"</em>, <em>"WHOOP's Vice President of Performance Science"</em>.</p>
          </div>
          <div>
            <h4>Operating record</h4>
            <p>What they founded, scaled or sold. <em>"Founder of Social Chain"</em>, <em>"Manager of the 20VC fund"</em>.</p>
          </div>
          <div>
            <h4>Awards / public roles</h4>
            <p>Verifiable credentials. <em>"The youngest investor in the history of the BBC's Dragons' Den"</em>, <em>"Served on the protective details of four US presidents"</em>.</p>
          </div>
          <div>
            <h4>Numerical anchors</h4>
            <p>Quantify the body of work. <em>"700+ hours of long-form interviews"</em>, <em>"three decades of broadcast presence"</em>, <em>"a decade of original lab research"</em>.</p>
          </div>
        </div>
      </section>

      {/* How to add a new article */}
      <section className="admin-news-guide__section">
        <h2 className="admin-news-guide__h2">How to add a new article</h2>
        <p className="admin-news-guide__intro">
          Articles are stored in <code>src/data/articles.js</code> as a JavaScript array. To add a new
          one, append an object that follows the schema below, then deploy the frontend (push to
          <code> main</code>; Vercel rebuilds automatically).
        </p>

        <pre className="admin-news-guide__code"><code>{`{
  slug: 'unique-url-safe-slug',                // appears in URL: /news/<slug>
  title: 'Article title (10-12 words)',
  category: 'Rankings',                        // Rankings | Guide | Inspiration | Trends
  date: '2026-04-22',                          // ISO date
  readTime: 9,                                 // minutes; ~200 words/min
  excerpt: 'One-sentence summary, 25-40 words.',
  image: 'https://storage.googleapis.com/...', // speaker photo URL or stock image
  tile: { c1: '#0F172A', c2: '#1E3A5F' },      // gradient fallback if image fails
  body: [
    { type: 'p',  text: 'Opening paragraph...' },
    { type: 'h2', text: 'What makes a strong X speaker?' },
    { type: 'p',  text: 'Answer to the question...' },
    { type: 'h2', text: 'The Best X Speakers to Hire in 2026' },
    { type: 'p',  text: 'List intro...' },
    { type: 'h2', text: '1. Speaker Name' },
    { type: 'p',  text: 'Profile, 100-150 words. [Internal link](/enquiry).' },
    // ... repeat for each speaker
    { type: 'h2', text: 'Hire One of the Best X Speakers Today' },
    { type: 'p',  text: 'Soft CTA paragraph with [link](/enquiry).' },
  ],
}`}</code></pre>

        <p className="admin-news-guide__intro" style={{ marginTop: 16 }}>
          <strong>Tips</strong>: paragraphs accept inline markdown links — <code>[label](/path)</code> is
          rendered as a working link to internal routes. Use <code>type: 'h2'</code> for every heading
          (including numbered speaker entries) — it gives Google the cleanest outline of the article.
        </p>
      </section>

      {/* Pre-publish checklist */}
      <section className="admin-news-guide__section">
        <h2 className="admin-news-guide__h2">Pre-publish checklist</h2>
        <ul className="admin-news-guide__checklist">
          <li>Title is 10-12 words, includes the year and the region or audience</li>
          <li>Opening paragraph is 50-80 words, no hype, no clichés</li>
          <li>First H2 is in question form</li>
          <li>Speaker entries are numbered consistently (1, 2, 3 ...)</li>
          <li>Each speaker has a credentials line + 100-150 word profile + implicit value statement</li>
          <li>No pricing, fees, costs or budget figures anywhere in the body</li>
          <li>No superlatives or marketing-speak phrases</li>
          <li>Active voice, third-person editorial tone throughout</li>
          <li>Internal links to <code>/enquiry</code>, <code>/speakers</code> or <code>/search</code> appear at least twice</li>
          <li>Closing CTA H2 is direct but not urgent</li>
          <li>UK English on UK-targeted articles, US English on US-targeted articles</li>
          <li>Reading time and word count make sense (1,000-1,800 words is the band that ranks)</li>
        </ul>
      </section>
    </motion.div>
  )
}
