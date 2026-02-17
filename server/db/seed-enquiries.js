import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const statuses = ['new', 'reviewed', 'accepted', 'rejected', 'responded']

const sampleEnquiries = [
  // Steven Bartlett (4 enquiries - very popular)
  { speakerId: 'steven-bartlett', speakerName: 'Steven Bartlett', name: 'Laura Chen', email: 'laura.chen@techcorp.com', organization: 'TechCorp Global', phone: '+44 7700 900123', eventDate: '2026-04-15', eventLocation: 'London, ExCeL Centre', audienceSize: '2000+', budgetRange: '£20,000-£50,000', eventType: 'conference', brief: 'We are hosting our annual leadership summit and want Steven to deliver a keynote on entrepreneurship and resilience. Our audience is C-suite executives and senior leaders from FTSE 100 companies.', status: 'accepted', daysAgo: 2 },
  { speakerId: 'steven-bartlett', speakerName: 'Steven Bartlett', name: 'Marcus Williams', email: 'marcus@bravemedia.co', organization: 'Brave Media', phone: '+44 7700 900456', eventDate: '2026-05-20', eventLocation: 'Manchester, Bridgewater Hall', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'corporate-event', brief: 'Looking for Steven to host a fireside chat about mental health and leadership at our creative industries summit. Audience: marketing and creative directors.', status: 'reviewed', daysAgo: 5 },
  { speakerId: 'steven-bartlett', speakerName: 'Steven Bartlett', name: 'Priya Sharma', email: 'priya@futureforward.org', organization: 'Future Forward Foundation', eventDate: '2026-06-10', eventLocation: 'Birmingham NEC', audienceSize: '1000-2000', budgetRange: '£20,000-£50,000', eventType: 'conference', brief: 'Annual youth entrepreneurship conference. We want Steven to inspire 1500 young entrepreneurs aged 18-25 with his story and insights on building businesses.', status: 'new', daysAgo: 1 },
  { speakerId: 'steven-bartlett', speakerName: 'Steven Bartlett', name: 'James Richardson', email: 'james.r@bankgroup.com', organization: 'National Bank Group', phone: '+44 20 7946 0958', eventDate: '2026-03-28', eventLocation: 'London, The Savoy', audienceSize: '200-500', budgetRange: '£50,000+', eventType: 'corporate-event', brief: 'Private leadership dinner for our top 200 executives. We would like Steven for an intimate 30-minute talk on trust and ambition.', status: 'responded', daysAgo: 12 },

  // Jordan Schwarzenberger (2)
  { speakerId: 'jordan-schwarzenberger', speakerName: 'Jordan Schwarzenberger', name: 'Sophie Turner', email: 'sophie@brandlabs.io', organization: 'BrandLabs', eventDate: '2026-05-05', eventLocation: 'London, Shoreditch Studios', audienceSize: '200-500', budgetRange: '£5,000-£10,000', eventType: 'workshop', brief: 'Workshop on creator economy for brand managers. Want Jordan to break down how modern brands are actually built through community and content.', status: 'accepted', daysAgo: 8 },
  { speakerId: 'jordan-schwarzenberger', speakerName: 'Jordan Schwarzenberger', name: 'Tom Fletcher', email: 'tom@mediahub.co.uk', organization: 'MediaHub UK', phone: '+44 7911 123456', eventDate: '2026-07-12', eventLocation: 'Leeds, First Direct Arena', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Digital marketing conference. Jordan to speak on how the Sidemen built an empire and what brands can learn from creator-led business models.', status: 'new', daysAgo: 3 },

  // Harry Stebbings (3)
  { speakerId: 'harry-stebbings', speakerName: 'Harry Stebbings', name: 'David Park', email: 'david@ventureweek.com', organization: 'Venture Week', eventDate: '2026-04-22', eventLocation: 'London, Barbican Centre', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Annual VC and startup conference. We want Harry to deliver the opening keynote on what separates the best founders from the rest.', status: 'accepted', daysAgo: 15 },
  { speakerId: 'harry-stebbings', speakerName: 'Harry Stebbings', name: 'Rebecca Osei', email: 'rebecca@scaleup.vc', organization: 'ScaleUp Ventures', phone: '+44 7700 100200', eventDate: '2026-06-03', eventLocation: 'Edinburgh, EICC', audienceSize: '200-500', budgetRange: '£10,000-£20,000', eventType: 'corporate-event', brief: 'LP annual meeting. Fireside chat with Harry about decision-making in venture and what patterns he sees in successful portfolio companies.', status: 'reviewed', daysAgo: 6 },
  { speakerId: 'harry-stebbings', speakerName: 'Harry Stebbings', name: 'Alex Wright', email: 'alex@founders.club', organization: 'Founders Club', eventDate: '2026-09-15', eventLocation: 'London, County Hall', audienceSize: '100-200', budgetRange: '£5,000-£10,000', eventType: 'workshop', brief: 'Intimate workshop for early-stage founders on fundraising and scaling. 50 hand-picked founders, looking for 90 mins of insight and Q&A.', status: 'new', daysAgo: 2 },

  // Vanessa Van Edwards (2)
  { speakerId: 'vanessa-van-edwards', speakerName: 'Vanessa Van Edwards', name: 'Karen Mitchell', email: 'karen@salesforce-emea.com', organization: 'Salesforce EMEA', phone: '+44 20 7946 0100', eventDate: '2026-05-18', eventLocation: 'London, O2 Centre', audienceSize: '1000-2000', budgetRange: '£20,000-£50,000', eventType: 'conference', brief: 'Sales kickoff event. Want Vanessa to teach our 1200 sales reps about body language, first impressions, and communication that closes deals.', status: 'responded', daysAgo: 20 },
  { speakerId: 'vanessa-van-edwards', speakerName: 'Vanessa Van Edwards', name: 'Daniel Brooks', email: 'daniel@hrleaders.org', organization: 'HR Leaders Network', eventDate: '2026-08-10', eventLocation: 'Bristol, Watershed', audienceSize: '200-500', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Annual HR conference on workplace culture. Vanessa to present on trust signals and how leaders can communicate more effectively.', status: 'new', daysAgo: 4 },

  // Nischa Shah (2)
  { speakerId: 'nischa-shah', speakerName: 'Nischa Shah', name: 'Emma Collins', email: 'emma@finlit.org', organization: 'Financial Literacy Trust', eventDate: '2026-04-08', eventLocation: 'London, Kings Place', audienceSize: '200-500', budgetRange: '£5,000-£10,000', eventType: 'conference', brief: 'Youth financial literacy conference. Nischa to speak about money anxiety, career pressure, and making smart financial decisions in your 20s.', status: 'accepted', daysAgo: 18 },
  { speakerId: 'nischa-shah', speakerName: 'Nischa Shah', name: 'Oliver Grant', email: 'oliver@deloitte.co.uk', organization: 'Deloitte UK', phone: '+44 20 7007 7000', eventDate: '2026-06-25', eventLocation: 'London, Deloitte HQ', audienceSize: '100-200', budgetRange: '£5,000-£10,000', eventType: 'corporate-event', brief: 'Internal wellbeing week. Want Nischa for a lunchtime session on financial wellbeing and managing career pressure for graduates and associates.', status: 'reviewed', daysAgo: 7 },

  // Dr Kristen Holmes (2)
  { speakerId: 'kristen-holmes', speakerName: 'Dr Kristen Holmes', name: 'Sarah Kim', email: 'sarah@performancelab.co', organization: 'Performance Lab', eventDate: '2026-05-30', eventLocation: 'London, Royal Institution', audienceSize: '200-500', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Corporate wellness conference. Kristen to present on sustainable performance, recovery science, and why pushing harder is not the answer.', status: 'new', daysAgo: 3 },
  { speakerId: 'kristen-holmes', speakerName: 'Dr Kristen Holmes', name: 'Michael Tan', email: 'michael@sportsinnovate.com', organization: 'Sports Innovate', phone: '+44 7900 654321', eventDate: '2026-07-20', eventLocation: 'Manchester, Etihad Campus', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Sports technology conference. Dr Holmes to share insights on biometric data, recovery, and what elite athletes teach us about sustainable peak performance.', status: 'rejected', daysAgo: 22 },

  // Davina McCall (3)
  { speakerId: 'davina-mccall', speakerName: 'Davina McCall', name: 'Charlotte Evans', email: 'charlotte@womeninbiz.co.uk', organization: 'Women in Business UK', phone: '+44 7800 111222', eventDate: '2026-04-12', eventLocation: 'London, QEII Centre', audienceSize: '1000-2000', budgetRange: '£20,000-£50,000', eventType: 'conference', brief: 'Annual women in business awards and conference. Davina as keynote speaker on confidence, health, and thriving through change.', status: 'accepted', daysAgo: 10 },
  { speakerId: 'davina-mccall', speakerName: 'Davina McCall', name: 'Rachel Adams', email: 'rachel@pharmahealth.com', organization: 'PharmaHealth International', eventDate: '2026-09-05', eventLocation: 'London, Hilton Park Lane', audienceSize: '500-1000', budgetRange: '£20,000-£50,000', eventType: 'corporate-event', brief: 'Women\'s health symposium. Davina to share her advocacy work on menopause and women\'s health, connecting it to workplace policy and culture change.', status: 'reviewed', daysAgo: 5 },
  { speakerId: 'davina-mccall', speakerName: 'Davina McCall', name: 'Tom Hardy', email: 'tom@charityalliance.org', organization: 'Charity Alliance', eventDate: '2026-11-15', eventLocation: 'Birmingham, Symphony Hall', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'gala', brief: 'Annual charity gala dinner. Looking for Davina to host and deliver an inspirational speech about resilience and giving back.', status: 'new', daysAgo: 1 },

  // Paul C Brunson (1)
  { speakerId: 'paul-c-brunson', speakerName: 'Paul C Brunson', name: 'Lisa Okafor', email: 'lisa@culturehub.co', organization: 'CultureHub', eventDate: '2026-06-18', eventLocation: 'London, Roundhouse', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Leadership and culture conference. Paul to speak on emotional intelligence, trust, and how personal patterns shape team dynamics.', status: 'reviewed', daysAgo: 9 },

  // Nir Eyal (2)
  { speakerId: 'nir-eyal', speakerName: 'Nir Eyal', name: 'Chris Zhang', email: 'chris@productminds.io', organization: 'Product Minds', phone: '+1 415 555 0199', eventDate: '2026-05-28', eventLocation: 'San Francisco, Moscone Center', audienceSize: '1000-2000', budgetRange: '£20,000-£50,000', eventType: 'conference', brief: 'Product design conference. Nir to deliver a keynote on habit formation, behaviour design, and building products people can\'t put down.', status: 'accepted', daysAgo: 14 },
  { speakerId: 'nir-eyal', speakerName: 'Nir Eyal', name: 'Amy Foster', email: 'amy@focusforward.co.uk', organization: 'Focus Forward', eventDate: '2026-08-22', eventLocation: 'London, Business Design Centre', audienceSize: '200-500', budgetRange: '£10,000-£20,000', eventType: 'workshop', brief: 'Workshop on attention and focus for corporate teams. Want Nir to help our managers understand distraction and redesign their work environment.', status: 'new', daysAgo: 6 },

  // Cliff Weitzman (1)
  { speakerId: 'cliff-weitzman', speakerName: 'Cliff Weitzman', name: 'Jasmine Patel', email: 'jasmine@edtech.global', organization: 'EdTech Global', eventDate: '2026-07-08', eventLocation: 'London, Here East', audienceSize: '500-1000', budgetRange: '£5,000-£10,000', eventType: 'conference', brief: 'EdTech conference on accessibility and inclusion. Cliff to share his journey building Speechify and how constraints drive innovation.', status: 'new', daysAgo: 4 },

  // Dr Vonda Wright (1)
  { speakerId: 'vonda-wright', speakerName: 'Dr Vonda Wright', name: 'Robert Chen', email: 'robert@longevityconf.com', organization: 'Longevity Conference', phone: '+1 212 555 0188', eventDate: '2026-10-03', eventLocation: 'New York, Javits Center', audienceSize: '1000-2000', budgetRange: '£10,000-£20,000', eventType: 'conference', brief: 'Longevity and healthspan summit. Dr Wright to present on extending physical capability across demanding executive careers.', status: 'reviewed', daysAgo: 11 },

  // Evy Poumpouras (2)
  { speakerId: 'evy-poumpouras', speakerName: 'Evy Poumpouras', name: 'Martin Hayes', email: 'martin@securitysummit.eu', organization: 'European Security Summit', eventDate: '2026-04-28', eventLocation: 'Brussels, Square Convention Centre', audienceSize: '500-1000', budgetRange: '£20,000-£50,000', eventType: 'conference', brief: 'Security leadership conference. Evy to deliver the keynote on decision-making under pressure, drawn from her Secret Service experience.', status: 'accepted', daysAgo: 16 },
  { speakerId: 'evy-poumpouras', speakerName: 'Evy Poumpouras', name: 'Nicole Turner', email: 'nicole@saleskickoff.com', organization: 'SalesForce Pro', phone: '+44 7700 900789', eventDate: '2026-06-15', eventLocation: 'London, ICC', audienceSize: '500-1000', budgetRange: '£10,000-£20,000', eventType: 'corporate-event', brief: 'Annual sales kickoff. Evy to inspire our sales leaders on courage, responsibility, and performing under intense pressure.', status: 'new', daysAgo: 2 },

  // Paul Scanlon (1)
  { speakerId: 'paul-scanlon', speakerName: 'Paul Scanlon', name: 'Greg Phillips', email: 'greg@teambuilders.co.uk', organization: 'TeamBuilders', eventDate: '2026-08-14', eventLocation: 'Cardiff, Millennium Centre', audienceSize: '200-500', budgetRange: '£5,000-£10,000', eventType: 'corporate-event', brief: 'Team resilience away day. Paul to share his story of recovery and reinvention, connecting sport to workplace resilience.', status: 'reviewed', daysAgo: 13 },

  // Maggie Sellers (2)
  { speakerId: 'maggie-sellers', speakerName: 'Maggie Sellers', name: 'Hannah Reed', email: 'hannah@sheleads.org', organization: 'She Leads Network', eventDate: '2026-05-12', eventLocation: 'London, The Ned', audienceSize: '100-200', budgetRange: '£5,000-£10,000', eventType: 'conference', brief: 'Women\'s leadership breakfast. Maggie to speak on redefining success, ambition without apology, and betting on yourself.', status: 'new', daysAgo: 3 },
  { speakerId: 'maggie-sellers', speakerName: 'Maggie Sellers', name: 'Zara Khan', email: 'zara@startupweekend.co', organization: 'Startup Weekend UK', eventDate: '2026-09-20', eventLocation: 'Manchester, HOME', audienceSize: '200-500', budgetRange: '£5,000-£10,000', eventType: 'conference', brief: 'Startup weekend closing keynote. Maggie to inspire early-stage founders about the emotional reality of building something from nothing.', status: 'accepted', daysAgo: 19 },
]

async function seedEnquiries() {
  console.log(`Seeding ${sampleEnquiries.length} enquiries...`)

  for (const enq of sampleEnquiries) {
    const id = `enq_seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createdAt = new Date(Date.now() - enq.daysAgo * 24 * 60 * 60 * 1000).toISOString()

    await pool.query(
      `INSERT INTO enquiries (id, name, email, organization, phone, event_date, event_location,
         audience_size, budget_range, event_type, brief, speaker_id, speaker_name, newsletter, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING`,
      [
        id,
        enq.name,
        enq.email,
        enq.organization,
        enq.phone || null,
        enq.eventDate || null,
        enq.eventLocation || null,
        enq.audienceSize || null,
        enq.budgetRange || null,
        enq.eventType || null,
        enq.brief,
        enq.speakerId,
        enq.speakerName,
        false,
        enq.status,
        createdAt,
      ]
    )

    console.log(`  Seeded: ${enq.name} → ${enq.speakerName} (${enq.status})`)
  }

  const { rows } = await pool.query('SELECT count(*) AS total FROM enquiries')
  console.log(`\nDone. ${rows[0].total} total enquiries in database.`)

  await pool.end()
}

seedEnquiries().catch((err) => {
  console.error('Seed enquiries failed:', err)
  process.exit(1)
})
