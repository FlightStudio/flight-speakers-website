// Mock speaker data - In production, this would come from a CMS or database
export const speakers = [
  {
    id: 'sarah-chen',
    name: 'Dr. Sarah Chen',
    headline: 'AI Research Director, Stanford HAI',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    bio: `Dr. Sarah Chen is a pioneering voice in artificial intelligence ethics and the future of human-AI collaboration. As Research Director at Stanford's Human-Centered AI Institute, she leads groundbreaking work on responsible AI development.

Her research has shaped policy discussions at the White House, European Commission, and United Nations. Sarah's ability to translate complex technical concepts into actionable business strategies has made her a sought-after advisor for Fortune 500 companies navigating AI transformation.`,
    topics: ['AI & Future of Work', 'Ethics in Technology', 'Digital Transformation', 'Leadership in Tech', 'Women in STEM'],
    audiences: ['Technology', 'Corporate Leadership', 'Policy Makers', 'Academia'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
    embeddings: [0.9, 0.8, 0.2, 0.7, 0.9, 0.3, 0.8, 0.6] // Simplified vector for matching
  },
  {
    id: 'marcus-johnson',
    name: 'Marcus Johnson',
    headline: 'Former NBA Champion & Leadership Coach',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    bio: `Marcus Johnson's journey from undrafted rookie to NBA champion exemplifies the power of resilience and team leadership. After a decorated 12-year career, Marcus transitioned into executive coaching, working with C-suite leaders at companies like Nike, Salesforce, and Goldman Sachs.

His framework for "Championship Mindset" has transformed how organizations think about performance, culture, and winning together. Marcus brings high energy, practical wisdom, and unforgettable storytelling to every stage.`,
    topics: ['Leadership', 'Team Performance', 'Resilience', 'Peak Performance', 'Organizational Culture'],
    audiences: ['Corporate Teams', 'Sales Organizations', 'Sports', 'Executive Leadership'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
    embeddings: [0.3, 0.4, 0.9, 0.8, 0.2, 0.7, 0.5, 0.9]
  },
  {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    headline: 'Founder & CEO, GreenScale Ventures',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    bio: `Elena Rodriguez is reshaping the conversation around sustainable business. As founder of GreenScale Ventures, she has backed 40+ climate-tech startups that have collectively reduced carbon emissions by 2 million tons annually.

Named to Fortune's "40 Under 40" and recognized as a World Economic Forum Young Global Leader, Elena speaks with authority on building profitable businesses that don't cost the earth. Her talks blend hard data with inspiring action plans.`,
    topics: ['Sustainability', 'Climate Innovation', 'Impact Investing', 'Entrepreneurship', 'Women in Business'],
    audiences: ['Investors', 'Entrepreneurs', 'Corporate Sustainability', 'Women in Business'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
    embeddings: [0.5, 0.7, 0.4, 0.6, 0.8, 0.9, 0.4, 0.5]
  },
  {
    id: 'david-park',
    name: 'David Park',
    headline: 'Neuroscientist & Wellness Researcher',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    bio: `Dr. David Park bridges the gap between cutting-edge neuroscience and practical workplace wellness. His research at MIT's McGovern Institute has unlocked new understanding of how stress, sleep, and cognitive load affect executive performance.

David's science-backed protocols for mental clarity and sustained energy have been adopted by elite athletes, hedge fund managers, and tech founders. He makes brain science accessible, actionable, and surprisingly entertaining.`,
    topics: ['Wellness', 'Mental Performance', 'Neuroscience', 'Stress Management', 'Sleep Optimization'],
    audiences: ['Healthcare', 'Corporate Wellness', 'High-Performance Teams', 'Executives'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.4, 0.3, 0.5, 0.9, 0.3, 0.4, 0.8, 0.7]
  },
  {
    id: 'amanda-okonkwo',
    name: 'Amanda Okonkwo',
    headline: 'Chief People Officer, Stripe',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face',
    bio: `Amanda Okonkwo has built and scaled some of the world's most admired company cultures. At Stripe, she's pioneered remote-first practices that have become industry standards, while maintaining the human connection that drives innovation.

Previously leading People teams at Airbnb and LinkedIn, Amanda brings deep expertise in building diverse, high-performing teams. Her candid insights on the future of work have made her essential listening for any leader navigating hybrid realities.`,
    topics: ['Future of Work', 'Company Culture', 'Diversity & Inclusion', 'Remote Leadership', 'Talent Strategy'],
    audiences: ['HR Leaders', 'Tech Companies', 'Executive Teams', 'Startups'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
    embeddings: [0.7, 0.6, 0.7, 0.5, 0.4, 0.6, 0.9, 0.8]
  },
  {
    id: 'james-mitchell',
    name: 'James Mitchell',
    headline: 'Former CIA Officer & Geopolitical Analyst',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    bio: `James Mitchell spent 20 years in the CIA's Directorate of Operations before becoming one of the world's most respected geopolitical risk analysts. His firm advises multinational corporations and government agencies on navigating global uncertainty.

James brings classified-level insight into how global events—from elections to conflicts to supply chain disruptions—will impact business. His briefings are legendary for cutting through noise and delivering actionable intelligence.`,
    topics: ['Geopolitics', 'Risk Management', 'Global Strategy', 'Crisis Leadership', 'National Security'],
    audiences: ['C-Suite', 'Board Directors', 'Investors', 'Government'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.2, 0.5, 0.3, 0.4, 0.9, 0.2, 0.3, 0.4]
  },
  {
    id: 'lisa-nakamura',
    name: 'Lisa Nakamura',
    headline: 'Serial Entrepreneur & Venture Partner',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face',
    bio: `Lisa Nakamura has founded three companies, taken two public, and now helps the next generation of founders as a Venture Partner at Andreessen Horowitz. Her specialty: turning early-stage chaos into scalable success.

From bootstrapping her first startup in a garage to ringing the NYSE bell, Lisa's journey is a masterclass in entrepreneurial grit. She speaks with raw honesty about failure, pivots, and what it really takes to build something that lasts.`,
    topics: ['Entrepreneurship', 'Startup Scaling', 'Venture Capital', 'Women Founders', 'Innovation'],
    audiences: ['Entrepreneurs', 'Investors', 'Tech Industry', 'Women in Business'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
    embeddings: [0.6, 0.8, 0.6, 0.5, 0.7, 0.8, 0.6, 0.7]
  },
  {
    id: 'robert-williams',
    name: 'Robert Williams',
    headline: 'Former Fortune 100 CEO & Board Director',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    bio: `Robert Williams led a Fortune 100 industrial company through its most transformative decade, tripling market cap while cutting carbon footprint by 60%. Now serving on four public boards, he's a trusted voice on governance, succession, and stakeholder capitalism.

Robert doesn't deal in theory—he shares battle-tested frameworks from leading 80,000 employees through economic cycles, activist campaigns, and digital transformation. His talks are intensive, practical, and packed with lessons from the corner office.`,
    topics: ['CEO Leadership', 'Corporate Governance', 'Stakeholder Capitalism', 'Transformation', 'Board Excellence'],
    audiences: ['Board Directors', 'C-Suite', 'MBA Programs', 'Corporate Leadership'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.3, 0.6, 0.8, 0.6, 0.4, 0.3, 0.7, 0.9]
  },
  {
    id: 'priya-sharma',
    name: 'Dr. Priya Sharma',
    headline: 'Behavioral Economist & Decision Scientist',
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face',
    bio: `Dr. Priya Sharma has spent two decades decoding why smart people make poor decisions—and how to fix it. Her work at the intersection of economics, psychology, and data science has influenced policy at the World Bank and product design at Google.

Priya's insights on cognitive bias, nudge theory, and decision architecture have helped organizations save billions and improve lives. She turns behavioral science into practical tools any leader can use immediately.`,
    topics: ['Behavioral Economics', 'Decision Making', 'Consumer Psychology', 'Nudge Theory', 'Data-Driven Strategy'],
    audiences: ['Marketing Teams', 'Product Leaders', 'Policy Makers', 'Financial Services'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.8, 0.5, 0.4, 0.7, 0.5, 0.6, 0.5, 0.6]
  },
  {
    id: 'michael-torres',
    name: 'Michael Torres',
    headline: 'Astronaut & STEM Education Advocate',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    bio: `Michael Torres has logged 340 days in space across four NASA missions, including commanding the International Space Station. But his greatest mission is back on Earth: inspiring the next generation of scientists, engineers, and explorers.

Michael's talks transport audiences to orbit—sharing breathtaking visuals and profound insights from viewing Earth from space. He connects the astronaut experience to leadership, teamwork, and humanity's boundless potential.`,
    topics: ['Innovation', 'STEM Education', 'Leadership', 'Exploration', 'Teamwork Under Pressure'],
    audiences: ['Education', 'Corporate Events', 'Youth Programs', 'Tech Industry'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: true,
    embeddings: [0.5, 0.4, 0.7, 0.8, 0.6, 0.5, 0.4, 0.6]
  },
  {
    id: 'rachel-kim',
    name: 'Rachel Kim',
    headline: 'CMO, Spotify & Brand Strategist',
    photo: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=400&fit=crop&crop=face',
    bio: `Rachel Kim has built some of the most beloved brands of the digital age. As CMO of Spotify, she's led campaigns that have defined cultural moments and driven unprecedented growth in the creator economy.

Previously a brand leader at Nike and Glossier, Rachel brings a unique perspective on building authentic connections in an age of skepticism. Her frameworks for "culture-first marketing" are redefining how brands earn attention and loyalty.`,
    topics: ['Brand Strategy', 'Marketing Innovation', 'Creator Economy', 'Gen Z & Millennials', 'Cultural Marketing'],
    audiences: ['Marketing Teams', 'Brand Leaders', 'Media Industry', 'Retail & CPG'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.6, 0.7, 0.5, 0.4, 0.6, 0.7, 0.8, 0.5]
  },
  {
    id: 'thomas-andersson',
    name: 'Thomas Andersson',
    headline: 'Olympic Coach & Performance Psychologist',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
    bio: `Thomas Andersson has coached 14 Olympic medalists and advised elite performers from Navy SEALs to hedge fund traders. His methodology for peak performance under pressure has been refined over 30 years at the highest levels of competition.

Thomas combines sports psychology with practical techniques anyone can use to perform when it matters most. His sessions are intense, interactive, and leave audiences with tools they'll use for life.`,
    topics: ['Peak Performance', 'Mental Toughness', 'Coaching Excellence', 'Pressure Management', 'Goal Achievement'],
    audiences: ['Sales Teams', 'Athletes', 'High-Performance Teams', 'Executive Leadership'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.4, 0.5, 0.9, 0.7, 0.3, 0.4, 0.6, 0.8]
  },
  {
    id: 'jennifer-wright',
    name: 'Jennifer Wright',
    headline: 'Fintech Pioneer & Financial Inclusion Advocate',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face',
    bio: `Jennifer Wright built one of Africa's largest mobile payment platforms, bringing financial services to 50 million previously unbanked people. Her work at the intersection of technology and social impact has earned recognition from the Gates Foundation and World Economic Forum.

Now advising central banks and fintechs globally, Jennifer speaks on how financial innovation can drive inclusive growth. She brings both technical depth and inspiring vision to every engagement.`,
    topics: ['Fintech', 'Financial Inclusion', 'Emerging Markets', 'Social Impact', 'Women in Finance'],
    audiences: ['Financial Services', 'Impact Investors', 'Development Organizations', 'Tech Industry'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.7, 0.8, 0.4, 0.5, 0.7, 0.9, 0.5, 0.4]
  },
  {
    id: 'alex-patel',
    name: 'Alex Patel',
    headline: 'Cybersecurity Expert & Former NSA Advisor',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop&crop=face',
    bio: `Alex Patel has defended critical infrastructure against nation-state hackers and advised three administrations on cybersecurity policy. Now leading a top security firm, Alex helps organizations understand and prepare for the threats of tomorrow.

Alex translates complex security concepts into board-level insights without the jargon. Audiences leave understanding not just the risks, but practical steps to protect their organizations, families, and careers in an increasingly hostile digital world.`,
    topics: ['Cybersecurity', 'Data Privacy', 'AI Security', 'Risk Management', 'Digital Trust'],
    audiences: ['Board Directors', 'IT Leaders', 'Legal & Compliance', 'C-Suite'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.8, 0.6, 0.3, 0.5, 0.8, 0.4, 0.4, 0.5]
  },
  {
    id: 'maria-gonzalez',
    name: 'Maria Gonzalez',
    headline: 'Healthcare Futurist & Longevity Researcher',
    photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&crop=face',
    bio: `Dr. Maria Gonzalez is mapping the future of human health. As a leading longevity researcher and advisor to major health systems, she's at the forefront of breakthroughs that could add decades of healthy life.

Maria's talks explore how advances in genomics, AI diagnostics, and personalized medicine will transform healthcare—and what leaders need to know now. She balances scientific rigor with accessible storytelling that captivates any audience.`,
    topics: ['Healthcare Innovation', 'Longevity', 'AI in Medicine', 'Future of Health', 'Biotech'],
    audiences: ['Healthcare Leaders', 'Pharma & Biotech', 'Investors', 'Corporate Wellness'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.7, 0.5, 0.4, 0.9, 0.5, 0.6, 0.7, 0.4]
  },
  {
    id: 'daniel-okafor',
    name: 'Daniel Okafor',
    headline: 'Supply Chain Innovator & Operations Expert',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
    bio: `Daniel Okafor redesigned Amazon's last-mile delivery network and now helps companies build supply chains that are resilient, sustainable, and cost-effective. His work has influenced how goods move across six continents.

In a world of disruption, Daniel brings clarity. His frameworks for supply chain risk, automation, and sustainability have helped organizations navigate everything from chip shortages to pandemic lockdowns. Practical, data-driven, and surprisingly engaging.`,
    topics: ['Supply Chain', 'Operations Excellence', 'Automation', 'Sustainability in Logistics', 'Crisis Resilience'],
    audiences: ['Operations Leaders', 'Manufacturing', 'Retail', 'Logistics'],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    featured: false,
    embeddings: [0.4, 0.6, 0.5, 0.5, 0.7, 0.5, 0.6, 0.7]
  }
];

// All unique topics across speakers
export const allTopics = [...new Set(speakers.flatMap(s => s.topics))].sort();

// All unique audiences across speakers
export const allAudiences = [...new Set(speakers.flatMap(s => s.audiences))].sort();

export default speakers;
