# Flight Story Speakers - Next Phase Improvements

This document outlines recommended improvements for Phase 2 and beyond, organized by priority and complexity.

---

## Executive Summary

The MVP successfully delivers:
- Homepage with hero, AI search, and speaker grid
- AI-powered search matching with reasoning
- Speaker detail pages with video embeds
- Enquiry form with validation
- Express backend with API endpoints
- Clean, premium greybox styling

The following improvements will elevate this from MVP to production-ready platform.

---

## Phase 2: High Priority (Post-Davos Sprint)

### 1. **Real AI/Vector Search Integration**
**Complexity:** Medium | **Impact:** High

Current implementation uses keyword matching. Upgrade to true semantic search:

```javascript
// Recommended: OpenAI Embeddings + Pinecone/Weaviate
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: userQuery
});

const results = await pinecone.query({
  vector: embedding.data[0].embedding,
  topK: 10,
  includeMetadata: true
});
```

**Tasks:**
- [ ] Set up OpenAI API integration for embeddings
- [ ] Create Pinecone index with speaker bio/topic embeddings
- [ ] Build embedding pipeline for new speakers
- [ ] Update search API to use vector similarity
- [ ] Add re-ranking layer for better relevance

---

### 2. **CMS Integration (Headless CMS)**
**Complexity:** Medium | **Impact:** High

Replace static JSON with a headless CMS for easy content management:

**Recommended:** Sanity.io or Contentful

**Speaker Schema:**
```typescript
interface Speaker {
  id: string;
  name: string;
  headline: string;
  photo: Image;
  bio: PortableText;
  topics: string[];
  audiences: string[];
  videoUrl?: string;
  featured: boolean;
  availability?: 'available' | 'limited' | 'unavailable';
  testimonials?: Testimonial[];
  mediaKit?: File;
}
```

**Tasks:**
- [ ] Set up Sanity/Contentful workspace
- [ ] Create speaker content model
- [ ] Migrate existing speaker data
- [ ] Build API layer to fetch from CMS
- [ ] Add preview mode for drafts
- [ ] Set up webhooks for cache invalidation

---

### 3. **Klaviyo Integration**
**Complexity:** Low | **Impact:** High

Connect enquiry form to Klaviyo for CRM and email marketing:

```javascript
// Klaviyo API Integration
const klaviyo = require('klaviyo-api');

// Add profile to list
await klaviyo.Profiles.createProfile({
  email: enquiry.email,
  firstName: enquiry.name.split(' ')[0],
  lastName: enquiry.name.split(' ').slice(1).join(' '),
  organization: enquiry.organization,
  properties: {
    source: 'speaker_enquiry',
    eventType: enquiry.eventType,
    speakerInterest: enquiry.speakerName
  }
});

// Track event
await klaviyo.Events.createEvent({
  event: 'Speaker Enquiry Submitted',
  customerProperties: { email: enquiry.email },
  properties: { ... }
});
```

**Lists to create:**
- `speaker-enquiries` - All enquiry submissions
- `speaker-newsletter` - Newsletter opt-ins
- `high-intent-leads` - Budget > $50k

---

### 4. **Analytics & Tracking**
**Complexity:** Low | **Impact:** Medium

**Implement:**
- Google Analytics 4 for page views
- Custom events for key actions
- Search query tracking
- Conversion funnel analysis

```javascript
// Track AI search
gtag('event', 'ai_search', {
  query: searchQuery,
  results_count: results.length,
  top_result: results[0]?.id
});

// Track speaker view
gtag('event', 'speaker_view', {
  speaker_id: speaker.id,
  referrer: document.referrer
});

// Track enquiry
gtag('event', 'enquiry_submit', {
  speaker_id: speaker?.id,
  has_budget: !!formData.budgetRange
});
```

---

### 5. **Email Notifications**
**Complexity:** Low | **Impact:** High

Replace console logging with actual email delivery:

**Options:**
- Resend (recommended - modern API, good deliverability)
- SendGrid
- AWS SES

**Tasks:**
- [ ] Set up email service account
- [ ] Create email templates (enquiry received, confirmation)
- [ ] Add BCC to speakers@flightstory.com
- [ ] Implement retry logic for failed sends

---

## Phase 3: Medium Priority

### 6. **Speaker Availability Calendar**
**Complexity:** High | **Impact:** Medium

Add availability management for speakers:

- Calendar view showing available dates
- Integration with Google Calendar API
- Conflict detection
- Hold/book workflow

---

### 7. **Admin Dashboard**
**Complexity:** High | **Impact:** Medium

Build internal admin panel for Flight Story team:

**Features:**
- View/manage enquiries
- Speaker CRUD (if not using CMS)
- Analytics dashboard
- Search query insights
- Lead scoring

**Tech:** React Admin or custom dashboard

---

### 8. **Authentication (Admin Only)**
**Complexity:** Medium | **Impact:** Medium

Secure admin routes with authentication:

**Options:**
- Clerk (recommended - easy setup)
- Auth0
- NextAuth (if migrating to Next.js)

---

### 9. **Enhanced Speaker Profiles**
**Complexity:** Medium | **Impact:** Medium

Add to speaker detail pages:
- Multiple video clips
- Testimonials carousel
- Past events gallery
- Downloadable media kit
- Social proof badges
- Speaking topics deep-dive

---

### 10. **Performance Optimization**
**Complexity:** Medium | **Impact:** Medium

- Image optimization (Next.js Image or cloudinary)
- Lazy loading for below-fold content
- Service worker for offline support
- CDN for static assets
- API response caching

---

## Phase 4: Future Enhancements

### 11. **Advanced AI Features**
- Conversational search ("Find me someone like Simon Sinek")
- AI-generated speaker comparisons
- Personalized recommendations based on past searches
- Natural language event brief parsing

### 12. **Multi-language Support**
- i18n for UI
- Translated speaker bios
- Region-specific speaker recommendations

### 13. **Booking Flow**
- Online quote generation
- Contract e-signing (DocuSign)
- Payment processing (Stripe)
- Calendar integration

### 14. **Speaker Portal**
- Self-service profile updates
- Availability management
- Enquiry notifications
- Performance analytics

### 15. **API for Partners**
- RESTful API for speaker data
- Webhook subscriptions
- OAuth authentication
- Rate limiting

---

## Technical Debt & Cleanup

### Immediate
- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add error boundaries
- [ ] Implement proper logging (Winston/Pino)

### Code Quality
- [ ] Add TypeScript
- [ ] Set up ESLint + Prettier
- [ ] Add pre-commit hooks (Husky)
- [ ] Document component API
- [ ] Create Storybook for components

### Infrastructure
- [ ] Set up staging environment
- [ ] Add health check endpoints
- [ ] Configure monitoring (Sentry)
- [ ] Set up backup strategy
- [ ] Document deployment process

---

## Migration Path: Next.js

Consider migrating to Next.js for:
- Server-side rendering (SEO)
- API routes (consolidate backend)
- Image optimization
- ISR for speaker pages
- Better Vercel integration

**Estimated effort:** 2-3 days with existing components

---

## Design Refinements

The current greybox provides a solid foundation. Future design work should address:

1. **Brand Identity**
   - Custom color palette
   - Typography refinement
   - Logo integration
   - Icon system

2. **Visual Enhancements**
   - Hero animations
   - Micro-interactions
   - Loading states
   - Empty states
   - Error states

3. **Mobile Experience**
   - Bottom navigation
   - Swipe gestures
   - Pull-to-refresh
   - App-like transitions

4. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader testing
   - Keyboard navigation
   - Focus management

---

## Priority Matrix

| Improvement | Impact | Effort | Priority |
|------------|--------|--------|----------|
| Real AI Search | High | Medium | P1 |
| CMS Integration | High | Medium | P1 |
| Klaviyo Integration | High | Low | P1 |
| Analytics | Medium | Low | P1 |
| Email Notifications | High | Low | P1 |
| Admin Dashboard | Medium | High | P2 |
| Availability Calendar | Medium | High | P2 |
| TypeScript Migration | Medium | Medium | P2 |
| Testing Suite | Medium | Medium | P2 |
| Next.js Migration | Medium | Medium | P3 |

---

## Getting Started with Phase 2

1. **Week 1:** CMS setup + Klaviyo + Analytics
2. **Week 2:** Real AI search integration
3. **Week 3:** Email notifications + testing
4. **Week 4:** Design polish + launch prep

---

## Questions for Stakeholders

Before Phase 2:
1. Which CMS is preferred? (Sanity vs Contentful)
2. Budget for AI API costs (OpenAI embeddings)?
3. Priority between admin dashboard vs booking flow?
4. Timeline for external design review?
5. Any branding assets to incorporate?

---

*Document created: January 2026*
*Last updated: January 2026*
*Author: Flight Story Development*
