// Server-side speaker data (mirrors frontend data for API use)
// In production, this would come from a database or CMS

export const speakers = [
  {
    id: 'steven-bartlett',
    name: 'Steven Bartlett',
    headline: 'Founder & CEO, FlightStory | Host of The Diary of a CEO',
    photo: '/images/speakers/steven-bartlett.jpg',
    bio: `Steven Bartlett is one of the most compelling keynote speakers of his generation, known for his rare ability to combine commercial insight with emotional honesty. He first rose to prominence as the co-founder of Social Chain, scaling it from a student startup into a global business, before founding FlightStory and The Diary of a CEO, now one of the world's most listened-to podcasts.

Steven speaks openly about leadership, pressure, mental health, trust, and ambition, drawing on real experience rather than theory. On stage, he is disarmingly candid and deeply human, creating moments of recognition that stay with audiences long after the event ends. He is a regular speaker at the World Economic Forum and global leadership forums, where his sessions are consistently cited as the standout.`,
    topics: ['Leadership', 'Entrepreneurship', 'Mental Health', 'Ambition', 'Trust'],
    audiences: ['Corporate Leadership', 'Entrepreneurs', 'Executive Teams', 'Young Professionals'],
    keynotes: [],
    speakingFormat: '45 minute fireside moderated conversation + 15 minutes Q&A',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 50000,

    gender: 'Male',
    nationality: 'British',
    location: 'London, UK',

    socialProfiles: {
      instagram: 'stevenbartlett',
      x: 'SteveBartlettSC',
      linkedin: 'stevenbartlett',
      youtube: 'TheDiaryOfACEO',
      tiktok: 'stevenbartlett',
    },
  },
  {
    id: 'jordan-schwarzenberger',
    name: 'Jordan Schwarzenberger',
    headline: 'Co-Founder, Arcade Media | Business Architect Behind The Sidemen',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    bio: `Jordan Schwarzenberger is one of the most credible voices in the creator economy because he has built what others only analyse. As the long-time manager and business lead for The Sidemen, he helped transform a YouTube group into a global brand spanning content, commerce, live events, and partnerships.

Jordan understands how attention becomes loyalty and how loyalty becomes enterprise. His perspective sits at the intersection of culture, community, and commercial strategy, giving him rare insight into how modern brands are actually built. On stage, he is sharp, candid, and highly practical, cutting through hype to explain how audiences really behave and why traditional marketing models are quietly failing.`,
    topics: ['Creator Economy', 'Brand Strategy', 'Community Building', 'Marketing Innovation', 'Digital Strategy'],
    audiences: ['Marketing Teams', 'Brand Leaders', 'Entrepreneurs', 'Media Industry'],
    keynotes: ['How the Internet Actually Builds Brands', 'From Audience to Asset', 'The Quiet Power of Community'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 15000,

    gender: 'Male',
    nationality: 'British',
    location: 'London, UK',
    socialProfiles: {
      instagram: 'jordanschwarzen',
      x: 'JordanSchwarz',
      linkedin: 'jordanschwarzenberger',
      youtube: 'ArcadeMedia',
    },
  },
  {
    id: 'harry-stebbings',
    name: 'Harry Stebbings',
    headline: 'Founder, 20VC | General Partner, 20VC Fund',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    bio: `Harry Stebbings is one of the most trusted interpreters of how great companies are really built. As the founder of The Twenty Minute VC and a general partner at 20VC, he has spent years in close conversation with the world's leading founders, operators, and investors.

Harry has seen hundreds of companies at their earliest stages and followed them through growth, failure, and reinvention. This gives him a rare ability to identify the decisions that matter most over the long term. On stage, he is calm, precise, and intellectually rigorous, offering clarity rather than hype. His talks resonate strongly with founders, boards, and leadership teams navigating high-stakes growth.`,
    topics: ['Venture Capital', 'Startup Scaling', 'Decision Making', 'Leadership', 'Entrepreneurship'],
    audiences: ['Entrepreneurs', 'Investors', 'Executive Leadership', 'Startups'],
    keynotes: ['How the Best Founders Actually Make Decisions', 'Why Most Scaling Advice Is Wrong', 'Building for the Long Game'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 25000,

    gender: 'Male',
    nationality: 'British',
    location: 'London, UK',
    socialProfiles: {
      instagram: 'harrystebbings',
      x: 'HarryStebbings',
      linkedin: 'harrystebbings',
      youtube: '20VC',
      tiktok: 'harrystebbings',
    },
  },
  {
    id: 'vanessa-van-edwards',
    name: 'Vanessa Van Edwards',
    headline: 'Founder, Science of People | Behavioural Researcher & Author',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    bio: `Vanessa Van Edwards is a leading expert on human behaviour, communication, and trust. Through Science of People, she has spent years translating behavioural research into practical insight for leaders and teams around the world.

Vanessa focuses on the subtle signals that shape credibility, confidence, and connection—often within the first few seconds of interaction. Her work helps leaders communicate more clearly, build trust faster, and improve outcomes across meetings, sales, and collaboration. On stage, Vanessa is engaging, precise, and highly actionable, making complex science feel immediately useful and memorable for audiences.`,
    topics: ['Communication', 'Human Behaviour', 'Trust', 'Leadership', 'Body Language'],
    audiences: ['Corporate Teams', 'Sales Organizations', 'HR Leaders', 'Executive Leadership'],
    keynotes: ['Why People Decide in the First Five Seconds', 'The Hidden Signals You\'re Sending at Work', 'Communication That Actually Changes Outcomes'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 20000,

    gender: 'Female',
    nationality: 'American',
    location: 'Portland, OR, USA',
    socialProfiles: {
      instagram: 'vanessavanedwards',
      x: 'vaborators',
      linkedin: 'vanessavanedwards',
      youtube: 'ScienceofPeople',
      tiktok: 'vanessavanedwards',
    },
  },
  {
    id: 'nischa-shah',
    name: 'Nischa Shah',
    headline: 'Former Investment Banker | Financial Educator',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face',
    bio: `Nischa Shah is a powerful voice for a generation rethinking money, ambition, and success. After leaving a career in investment banking, she built a global audience by speaking candidly about burnout, financial literacy, and the emotional cost of modern work.

Nischa brings clarity and calm authority to topics many organisations struggle to address, including money anxiety, career pressure, and comparison culture. Her talks resonate particularly strongly with emerging leaders and high performers seeking sustainable success. Audiences value her relatability and practical guidance, leaving her sessions feeling more confident and grounded about the choices they are making.`,
    topics: ['Financial Literacy', 'Career Development', 'Mental Health', 'Success', 'Wellbeing'],
    audiences: ['Emerging Leaders', 'Corporate Wellness', 'Financial Services', 'Young Professionals'],
    keynotes: ['What We Get Wrong About Success', 'Money, Pressure, and the Modern Career', 'Rethinking Ambition'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 10000,

    gender: 'Female',
    nationality: 'British',
    location: 'London, UK',
    socialProfiles: {
      instagram: 'nischashah',
      x: 'naborators',
      linkedin: 'nischashah',
      youtube: 'NischaShah',
      tiktok: 'nischashah',
    },
  },
  {
    id: 'kristen-holmes',
    name: 'Dr Kristen Holmes',
    headline: 'Performance Scientist | Global Head of Human Performance, WHOOP',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face',
    bio: `Dr Kristen Holmes is a world-leading expert in sustainable performance and resilience. With a background spanning elite sport, academia, and applied science, she works at the forefront of how people perform under pressure without burning out.

As Global Head of Human Performance at WHOOP, Kristen translates physiological data into real-world insight on recovery, stress, sleep, and consistency. On stage, she is calm, authoritative, and deeply credible, challenging the belief that high performance requires constant intensity. Her talks are particularly valued by leaders and organisations focused on long-term results rather than short-term output.`,
    topics: ['Peak Performance', 'Recovery', 'Resilience', 'Wellness', 'Stress Management'],
    audiences: ['Corporate Wellness', 'High-Performance Teams', 'Executives', 'Healthcare'],
    keynotes: ['Why Pushing Harder Isn\'t the Answer', 'Recovery Is a Skill', 'Performing Well Without Breaking Yourself'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 20000,

    gender: 'Female',
    nationality: 'American',
    location: 'Boston, MA, USA',
    socialProfiles: {
      instagram: 'kristenholmes',
      x: 'KristenHolmes',
      linkedin: 'kristenholmes',
    },
  },
  {
    id: 'davina-mccall',
    name: 'Davina McCall',
    headline: 'Broadcaster | Author | Women\'s Health Advocate',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    bio: `Davina McCall is one of the UK's most trusted voices and an exceptional live speaker. With decades of broadcasting experience, she brings warmth, authority, and authenticity to every stage she steps onto.

In recent years, Davina has become a leading advocate for women's health, menopause, ageing, and wellbeing, helping to shift public conversation and remove stigma. Her talks are honest, moving, and often unexpectedly practical, blending personal experience with insight audiences deeply relate to. Davina creates immediate trust in the room and leaves people feeling informed, empowered, and heard.`,
    topics: ['Women\'s Health', 'Wellbeing', 'Confidence', 'Menopause', 'Women in Business'],
    audiences: ['Corporate Events', 'Women in Business', 'Healthcare', 'HR Leaders'],
    keynotes: ['The Conversation We\'ve Been Avoiding', 'Health Isn\'t a Side Project', 'Confidence After Change'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 30000,

    gender: 'Female',
    nationality: 'British',
    location: 'London, UK',
    socialProfiles: {
      instagram: 'davinamccall',
      x: 'ThisisDavina',
      linkedin: 'davinamccall',
      tiktok: 'davinamccall',
    },
  },
  {
    id: 'paul-c-brunson',
    name: 'Paul C Brunson',
    headline: 'Relationship Expert | Entrepreneur | Host, Married at First Sight UK',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    bio: `Paul C Brunson brings emotional intelligence into leadership and performance conversations with rare warmth and credibility. Known globally for his work on Married at First Sight UK, Paul explores how trust, communication, and self-awareness shape success at work and in life.

With a background as an entrepreneur and former athlete, Paul speaks naturally to high-performance environments. His talks help leaders understand how personal patterns and emotional habits show up in teams and culture. Audiences consistently describe his sessions as insightful, human, and among the most memorable of an event.`,
    topics: ['Emotional Intelligence', 'Leadership', 'Communication', 'Trust', 'Organizational Culture'],
    audiences: ['Corporate Teams', 'Executive Leadership', 'HR Leaders', 'Corporate Events'],
    keynotes: ['How You Love Is How You Lead', 'The Cost of Emotional Avoidance', 'Success Without Connection Isn\'t Success'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 15000,

    gender: 'Male',
    nationality: 'American',
    location: 'London, UK',
    socialProfiles: {
      instagram: 'paulcbrunson',
      x: 'PaulCBrunson',
      linkedin: 'paulcbrunson',
      youtube: 'PaulCBrunson',
      tiktok: 'paulcbrunson',
    },
  },
  {
    id: 'nir-eyal',
    name: 'Nir Eyal',
    headline: 'Author of Hooked and Indistractable',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    bio: `Nir Eyal is one of the world's leading thinkers on behaviour, attention, and habit formation. His work has shaped how companies design products—and how individuals reclaim focus in an increasingly distracting world.

Nir's talks are thoughtful, balanced, and quietly confronting. He challenges the idea that distraction is a personal failure, offering practical frameworks to help people redesign their environment and choices. On stage, he is precise and persuasive, leaving audiences with tools they genuinely use long after the event.`,
    topics: ['Behaviour Design', 'Focus & Attention', 'Habit Formation', 'Innovation', 'Consumer Psychology'],
    audiences: ['Product Leaders', 'Marketing Teams', 'Corporate Teams', 'Tech Industry'],
    keynotes: ['Why We Keep Doing Things We Don\'t Want to Do', 'Attention Is a Choice', 'Designing a Life You Can Focus On'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 30000,

    gender: 'Male',
    nationality: 'American',
    location: 'New York, NY, USA',
    socialProfiles: {
      instagram: 'naborators',
      x: 'naborators',
      linkedin: 'nireyal',
      youtube: 'NirEyal',
    },
  },
  {
    id: 'vonda-wright',
    name: 'Dr Vonda Wright',
    headline: 'Orthopedic Surgeon | Longevity & Performance Expert',
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face',
    bio: `Dr Vonda Wright is redefining how leaders think about ageing, health, and long-term performance. She works with executives and elite performers to extend healthspan, resilience, and physical capability across demanding careers.

Her talks are science-led, energetic, and highly practical, reframing ageing as an advantage rather than a limitation. Audiences value her ability to connect physical health directly to leadership stamina, focus, and decision-making over time.`,
    topics: ['Longevity', 'Leadership', 'Healthcare Innovation', 'Resilience', 'Wellness'],
    audiences: ['Executives', 'Corporate Wellness', 'Healthcare Leaders', 'Corporate Events'],
    keynotes: ['Your Body Is Not the Bottleneck', 'The Myth of Inevitable Decline', 'Building a Career That Lasts'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 20000,

    gender: 'Female',
    nationality: 'American',
    location: 'Pittsburgh, PA, USA',
    socialProfiles: {
      instagram: 'drvondawright',
      x: 'DrVondaWright',
      linkedin: 'vondawright',
      youtube: 'DrVondaWright',
    },
  },
  {
    id: 'evy-poumpouras',
    name: 'Evy Poumpouras',
    headline: 'Former U.S. Secret Service Agent | Leadership & Decision-Making Speaker',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face',
    bio: `Evy Poumpouras spent her career protecting U.S. presidents and making decisions where hesitation could cost lives. She brings those lessons to leaders navigating uncertainty, pressure, and conflict.

Her talks are gripping, grounded, and deeply practical, translating extreme experience into insight leaders can actually use. On stage, Evy commands attention and leaves audiences thinking differently about courage, responsibility, and judgement.`,
    topics: ['Leadership', 'Decision Making', 'Crisis Leadership', 'Pressure Management', 'Resilience'],
    audiences: ['C-Suite', 'Executive Leadership', 'Corporate Events', 'Sales Teams'],
    keynotes: ['What Pressure Reveals About Leadership', 'Making Decisions When There\'s No Perfect Answer', 'Leading When Things Go Wrong'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 25000,

    gender: 'Female',
    nationality: 'American',
    location: 'New York, NY, USA',
    socialProfiles: {
      instagram: 'evypoumpouras',
      x: 'EvyPoumpouras',
      linkedin: 'evypoumpouras',
      youtube: 'EvyPoumpouras',
      tiktok: 'evypoumpouras',
    },
  },
  {
    id: 'paul-scanlon',
    name: 'Paul Scanlon',
    headline: 'Former Professional Athlete | Leadership & Culture Speaker',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
    bio: `Paul Scanlon brings the lived experience of elite sport into conversations about resilience, identity, and reinvention. His career was shaped by injury, recovery, and starting again—experiences that resonate deeply with teams navigating change.

Paul's talks are honest, reflective, and quietly powerful. He avoids clichés, focusing instead on what happens when plans fall apart and how individuals and teams rebuild confidence and momentum.`,
    topics: ['Resilience', 'Identity', 'Team Performance', 'Leadership', 'Organizational Culture'],
    audiences: ['Corporate Teams', 'Sports', 'Executive Leadership', 'Corporate Events'],
    keynotes: ['Who Are You When the Plan Falls Apart?', 'Resilience Without the Clichés', 'Pressure, Identity, and Starting Again'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 8000,

    gender: 'Male',
    nationality: 'British',
    location: 'Manchester, UK',
    socialProfiles: {
      instagram: 'paulscanlon',
      x: 'PaulScanlon',
      linkedin: 'paulscanlon',
    },
  },
  {
    id: 'maggie-sellers',
    name: 'Maggie Sellers',
    headline: 'Founder & CEO, Hot Smart Rich | Entrepreneur & Podcaster',
    photo: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=400&fit=crop&crop=face',
    bio: `Maggie Sellers is a modern entrepreneur who speaks candidly about ambition, identity, and building success on your own terms. As the founder of Hot Smart Rich, she has built a fast-growing brand and podcast that resonates with a generation navigating career pressure, financial independence, and the reality behind "having it all."

Maggie's strength as a speaker lies in her honesty. She speaks openly about risk, self-belief, money, and the emotional complexity of building something from scratch—without glamour or false certainty. Her perspective bridges personal growth and commercial reality, making her particularly compelling for audiences of emerging leaders, founders, and high performers.

On stage, Maggie is warm, direct, and highly relatable. Her talks feel like permission to question inherited definitions of success and to build careers that are both ambitious and sustainable. Audiences consistently describe her sessions as grounding, empowering, and refreshingly real.`,
    topics: ['Entrepreneurship', 'Ambition', 'Career Development', 'Women in Business', 'Self-Belief'],
    audiences: ['Emerging Leaders', 'Women in Business', 'Entrepreneurs', 'Young Professionals'],
    keynotes: ['Redefining Success on Your Own Terms', 'Ambition Without Apology', 'What No One Tells You About Betting on Yourself'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',

    feeMin: 8000,

    gender: 'Female',
    nationality: 'American',
    location: 'Los Angeles, CA, USA',
    socialProfiles: {
      instagram: 'maggiesellers',
      x: 'MaggieSellers',
      linkedin: 'maggiesellers',
      tiktok: 'maggiesellers',
    },
  }
]

// All unique topics across speakers
export const allTopics = [...new Set(speakers.flatMap(s => s.topics))].sort()

// All unique audiences across speakers
export const allAudiences = [...new Set(speakers.flatMap(s => s.audiences))].sort()

export default speakers
