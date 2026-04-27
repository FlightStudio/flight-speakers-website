// DEV-ONLY placeholder editorial content for the Press section.
// Purpose: SEO + GEO targeting. Replace bodies with real, well-researched
// content before relying on search rankings. Titles are written for
// search-intent (how-to / top-X / explained / trends).
//
// Each article body is an array of blocks. Block `type` is either 'p'
// (paragraph) or 'h2' (sub-heading). The PressArticlePage renders blocks
// with semantic HTML so crawlers parse the heading structure correctly.

export const ARTICLES = [
  {
    slug: 'choose-right-keynote-speaker',
    title: 'How to Choose the Right Keynote Speaker for Your Event',
    category: 'Guide',
    date: '2026-04-22',
    readTime: 6,
    excerpt: 'A practical framework for event organisers navigating the speaker market. From setting a budget to writing a brief that surfaces the right names.',
    body: [
      { type: 'p', text: 'The speaker you book is the single biggest determinant of how your event is remembered. Yet most bureaus present a catalogue of hundreds and leave the evaluation to you. The result is a selection process driven by name recognition rather than fit. Here is a better way to think about it.' },
      { type: 'h2', text: 'Start with the outcome, not the name' },
      { type: 'p', text: 'Before browsing names, articulate what you want the audience to think, feel, or do afterwards. A specific outcome narrows the shortlist from hundreds to five. Vague outcomes like "inspire the team" almost always produce vague feedback and forgettable talks.' },
      { type: 'h2', text: 'Budget realistically' },
      { type: 'p', text: 'Keynote fees in the UK range from £5,000 for emerging voices to £150,000+ for globally recognised figures. Most corporate events sit in the £15,000–£45,000 band. Above that, you are paying partly for the name on the agenda, which can be worth it for marketing, but rarely for content alone.' },
      { type: 'h2', text: 'Write a brief, not a requirements list' },
      { type: 'p', text: 'A brief that describes the audience, the moment in the agenda, and the intended shift in behaviour gives the bureau and the speaker enough to be genuinely useful. A list of required topics, by contrast, produces generic talks.' },
    ],
  },
  {
    slug: 'top-ai-speakers-2026',
    title: 'Top AI & Technology Speakers for Business Events in 2026',
    category: 'Rankings',
    date: '2026-04-12',
    readTime: 8,
    excerpt: 'The names shaping boardroom conversations on artificial intelligence this year, and why their talks move the needle for serious corporate audiences.',
    body: [
      { type: 'p', text: 'The conversation around AI in business has matured. The headline-grabbing speculation of 2023 has given way to practical questions about deployment, productivity, and risk. Speakers who can answer those questions credibly are booked eighteen months in advance.' },
      { type: 'h2', text: 'What audiences are actually asking' },
      { type: 'p', text: 'In our bookings over the last twelve months, three questions dominate board-level briefs: how do we integrate AI without breaking compliance, which parts of our operation should we automate first, and how do we measure return when the underlying technology is changing quarterly. The speakers below address those questions from different angles.' },
      { type: 'h2', text: 'Who to book and why' },
      { type: 'p', text: 'The strongest AI speakers in 2026 come from three backgrounds: hands-on operators who have shipped AI products at scale, researchers who can explain the underlying models in business terms, and strategists who have watched technology shifts in previous cycles and can draw parallels. A good event typically features one of each.' },
      { type: 'h2', text: 'A note on fees' },
      { type: 'p', text: 'Expect UK speaker fees in the AI category to sit between £20,000 and £80,000. Speakers who have recently founded or exited AI companies command the top of that range.' },
    ],
  },
  {
    slug: 'speaker-fees-explained',
    title: 'Speaker Fees Explained: What to Budget for a Keynote in 2026',
    category: 'Pricing',
    date: '2026-04-05',
    readTime: 5,
    excerpt: 'UK speaker fees from £5k to £150k+. What drives the price, what fair value looks like, and where budgets are quietly being over-spent.',
    body: [
      { type: 'p', text: 'Speaker fees are one of the least transparent line items in an event budget. Bureaus quote on request, agents negotiate privately, and published rate cards are rare. Here is what is actually happening behind those opaque numbers.' },
      { type: 'h2', text: 'The four tiers' },
      { type: 'p', text: 'For UK bookings, most keynote fees fall into four tiers: emerging voices at £5,000–£15,000, established specialists at £15,000–£45,000, recognised authors and executives at £45,000–£100,000, and globally famous names at £100,000 and above. The price jumps are driven by name recognition, not by talk quality.' },
      { type: 'h2', text: 'What drives the price' },
      { type: 'p', text: 'Three factors dominate: how well known the speaker is to your audience, how much time they will spend preparing, and how much travel is involved. Of these, preparation is the one most worth paying for, because it separates a bespoke talk from a canned one.' },
      { type: 'h2', text: 'Where budgets get wasted' },
      { type: 'p', text: 'The most common over-spend is paying for a famous name whose talk is not tailored to the audience. The second most common is under-spending on a speaker who will then deliver a stock talk. Fair value sits in the middle: pay for preparation, not just for fame.' },
    ],
  },
  {
    slug: 'female-keynote-speakers',
    title: 'The Rise of Female Keynote Speakers in Tech and Business',
    category: 'Trends',
    date: '2026-03-28',
    readTime: 5,
    excerpt: 'Booking data from 2024–2026 shows a quiet shift in who corporate audiences want to hear from, and why the old "all-male panel" defence is falling apart.',
    body: [
      { type: 'p', text: 'Across our own bookings and several public data sets, the share of female keynote speakers at UK corporate events has moved from roughly 28% in 2024 to 41% in early 2026. That is a meaningful shift in a category that moves slowly.' },
      { type: 'h2', text: 'What changed' },
      { type: 'p', text: 'Three things. First, the generation of women who founded and scaled tech companies in the 2010s are now in their prime speaking years. Second, audiences, particularly younger ones, increasingly read speaker gender as a proxy for how seriously an organisation takes inclusion. Third, the old defence that "we could not find any" has become untenable as rosters like ours publish their full lists.' },
      { type: 'h2', text: 'What it means for event planners' },
      { type: 'p', text: 'The practical implication is that an all-male speaker line-up now reads as a deliberate choice rather than a procurement accident. Planners should assume their audience will notice.' },
    ],
  },
  {
    slug: 'ai-booking-industry',
    title: 'How AI is Changing the Speaker Booking Industry',
    category: 'Perspective',
    date: '2026-03-14',
    readTime: 7,
    excerpt: 'Automated matching, semantic search, and what the bureau model looks like in the age of large language models. A short view from inside the category.',
    body: [
      { type: 'p', text: 'The speaker booking industry has run on relationships and spreadsheets for forty years. Bureaus knew their speakers, agents knew their clients, and matching happened in someone’s head. That model is being quietly rewritten.' },
      { type: 'h2', text: 'From rolodex to semantic search' },
      { type: 'p', text: 'The practical change is that a client can now describe an event in natural language, and an AI system can surface matching speakers in seconds, with reasoning attached. The curation that used to live in an agent’s head now lives in a model that has read every speaker profile, every past booking, and every audience brief.' },
      { type: 'h2', text: 'What AI still cannot do' },
      { type: 'p', text: 'AI will not replace the judgement call on whether a particular speaker will connect with a particular audience on a particular evening. Those calls require human context that is not in the training data, and they are where bureaus still add the most value.' },
      { type: 'h2', text: 'The honest conclusion' },
      { type: 'p', text: 'The best booking agencies of the next decade will use AI to do the search and shortlisting faster and more accurately, and will use their humans for the judgement calls that still matter. Ours is built that way by design.' },
    ],
  },
]

export function getArticleBySlug(slug) {
  return ARTICLES.find((a) => a.slug === slug) || null
}

export function getRelatedArticles(currentSlug, limit = 2) {
  return ARTICLES.filter((a) => a.slug !== currentSlug).slice(0, limit)
}
