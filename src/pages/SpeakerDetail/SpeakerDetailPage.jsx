import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { prefetchSpeaker, prefetchParseBrief } from '../../utils/prefetch'
import { EASE } from '../../constants/animation'
import './SpeakerDetailPage.css'
import SimilarSpeakers from './components/SimilarSpeakers/SimilarSpeakers'
import VideoHero from './components/VideoHero/VideoHero'
import useSmoothScroll from '../../hooks/useSmoothScroll'
import Cursor from '../../components/Cursor/Cursor'

import temp from "../../assets/temp.png";
import spotlight from "../../assets/white-spotlight.png";
import keyIcon from "../../assets/key-icon.png";
import targetIcon from "../../assets/target-icon.png";
import audienceIcon from "../../assets/audience-icon.png";

const YOUTUBE_EMBED_RE = /\/embed\/([^?&#]+)/
const DIRECT_VIDEO_RE = /\.(mp4|webm|mov)(\?|$)/i

function getVideoType(url) {
  if (!url) return { type: 'none' }
  const ytMatch = url.match(YOUTUBE_EMBED_RE)
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] }
  if (DIRECT_VIDEO_RE.test(url)) return { type: 'direct', src: url }
  return { type: 'none' }
}

function animateScrollTo(targetY, duration = 1100) {
  const startY = window.scrollY
  const diff = targetY - startY
  let start

  return new Promise((resolve) => {
    function step(timestamp) {
      if (!start) start = timestamp
      const t = Math.min((timestamp - start) / duration, 1)
      // easeOutExpo — instant response, long glide
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      window.scrollTo({ top: startY + diff * eased, behavior: 'instant' })
      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

function useSectionSnap(enabled = true) {
  const s = useRef({
    raf: 0,
    target: null,
    cooldownUntil: 0,
    brakeUntil: 0,
    acc: 0,
    accAt: 0,
    lastDeepAt: 0,
  })

  useEffect(() => {
    if (!enabled) return
    const state = s.current
    const THRESHOLD = 24
    const COOLDOWN = 400
    const BRAKE = 450
    const DURATION = 1100

    const cancelAnim = () => {
      if (state.raf) cancelAnimationFrame(state.raf)
      state.raf = 0
      state.target = null
    }

    const snap = (to, duration = DURATION) => {
      cancelAnim()
      state.target = to
      state.acc = 0
      const startY = window.scrollY
      const diff = to - startY
      let start

      const step = (timestamp) => {
        if (!start) start = timestamp
        const t = Math.min((timestamp - start) / duration, 1)
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        window.scrollTo({ top: startY + diff * eased, behavior: 'instant' })
        if (t < 1) {
          state.raf = requestAnimationFrame(step)
        } else {
          state.raf = 0
          state.target = null
          state.cooldownUntil = performance.now() + COOLDOWN
        }
      }
      state.raf = requestAnimationFrame(step)
    }

    const onWheel = (e) => {
      const now = performance.now()
      const y = window.scrollY
      const h = window.innerHeight
      const goingDown = e.deltaY > 0

      if (state.raf) {
        const snappingDown = state.target === h

        if (snappingDown && goingDown) {
          cancelAnim()
          window.scrollTo({ top: h, behavior: 'instant' })
          state.cooldownUntil = 0
          return
        }
        if (!snappingDown && !goingDown) {
          e.preventDefault()
          return
        }
        e.preventDefault()
        cancelAnim()
        snap(goingDown ? h : 0, 800)
        return
      }

      const atContentTop = y <= h + 2
      const insideHero = y < h - 2

      // Deep in content: free scroll, but remember we were here so a fast
      // upward fling brakes at the boundary instead of entering the hero.
      if (!atContentTop && !insideHero) {
        state.lastDeepAt = now
        // Fling about to cross the boundary this event: pin to boundary.
        if (!goingDown && y + e.deltaY < h) {
          e.preventDefault()
          window.scrollTo({ top: h, behavior: 'instant' })
          state.brakeUntil = now + BRAKE
          state.acc = 0
        }
        return
      }

      // Just arrived at the boundary carried by momentum from below: brake.
      if (!goingDown && now - state.lastDeepAt < 120 && state.brakeUntil < now) {
        e.preventDefault()
        window.scrollTo({ top: h, behavior: 'instant' })
        state.brakeUntil = now + BRAKE
        state.acc = 0
        return
      }

      // While braking, swallow trailing upward inertia and hold position.
      if (now < state.brakeUntil) {
        if (!goingDown || insideHero) {
          e.preventDefault()
          if (insideHero) window.scrollTo({ top: h, behavior: 'instant' })
        }
        return
      }

      if (now < state.cooldownUntil) {
        if (insideHero || (atContentTop && !goingDown)) e.preventDefault()
        return
      }

      if (insideHero && goingDown) {
        e.preventDefault()
        if (now - state.accAt > 200) state.acc = 0
        state.acc += e.deltaY
        state.accAt = now
        if (state.acc > THRESHOLD) snap(h)
        return
      }

      if (!goingDown && (insideHero || atContentTop)) {
        e.preventDefault()
        if (now - state.accAt > 200) state.acc = 0
        state.acc += e.deltaY
        state.accAt = now
        if (state.acc < -THRESHOLD) snap(0)
        return
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      cancelAnim()
      window.removeEventListener('wheel', onWheel)
    }
  }, [enabled])
}

function formatFollowers(n) {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return `${(Math.floor(n / 100_000) / 10).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '')}K`
  return n.toString()
}

const PLATFORM_URLS = {
  instagram: (handle) => `https://instagram.com/${handle}`,
  x: (handle) => `https://x.com/${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
  tiktok: (handle) => `https://tiktok.com/@${handle}`,
}

const platformIcons = {
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/>
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  youtube: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
}

function SpeakerDetailPage() {
  useSmoothScroll();

  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const brief = searchParams.get('brief') || ''

  const enquiryPath = `/enquiry/${id}${brief ? `?brief=${encodeURIComponent(brief)}` : ''}`

  const [speaker, setSpeaker] = useState(null)
  const [relatedSpeakers, setRelatedSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [briefReasoning, setBriefReasoning] = useState('')
  const [briefScore, setBriefScore] = useState(null)
  const [hoveredTopic, setHoveredTopic] = useState(null)
  const [hoveredAudience, setHoveredAudience] = useState(null)

  // Check if this speaker is already selected (from search results)
  const [isSelected, setIsSelected] = useState(() => {
    try {
      const stored = sessionStorage.getItem('selectedSpeakerIds')
      return stored ? JSON.parse(stored).includes(id) : false
    } catch { return false }
  })

  const handleSelectAndBack = useCallback(() => {
    try {
      const stored = sessionStorage.getItem('selectedSpeakerIds')
      const ids = stored ? JSON.parse(stored) : []
      if (!ids.includes(id)) ids.push(id)
      sessionStorage.setItem('selectedSpeakerIds', JSON.stringify(ids))
    } catch {}
    navigate(`/search?q=${encodeURIComponent(brief)}`)
  }, [id, brief, navigate])

  const bodyRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: bodyRef, offset: ['start start', 'end start'] })
  const bioScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.82])
  const bioOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.35])

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setSpeaker(null)
    setRelatedSpeakers([])

    fetch(`/api/speakers/${encodeURIComponent(id)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSpeaker(data.speaker)
          setRelatedSpeakers(data.relatedSpeakers || [])
          fetch(`/api/speakers/${encodeURIComponent(id)}/view`, { method: 'POST' })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load speaker:', err)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!brief || !id) return
    const controller = new AbortController()
    fetch(`/api/search?q=${encodeURIComponent(brief)}&limit=8`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.reasonings?.[id]) setBriefReasoning(data.reasonings[id])
          if (data.scores?.[id] != null) setBriefScore(data.scores[id])
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [brief, id])

  const handleEnquireHover = useCallback(() => {
    prefetchSpeaker(id)
    if (brief) prefetchParseBrief(brief)
  }, [id, brief])

  const handleEnquireClick = useCallback(() => {
    navigate(enquiryPath, { state: { speaker } })
  }, [navigate, enquiryPath, speaker])

  // Hero detection + section snap — MUST run before any early return so the
  // hook order stays stable across loading / loaded renders. speaker is null
  // during loading, so optional-chain it; snap is simply disabled until video exists.
  const video = speaker?.heroMediaType === 'video'
    ? getVideoType(speaker.videoUrl)
    : { type: 'none' }
  const hasVideo = video.type !== 'none'

  // useSectionSnap(hasVideo)

  if (loading) {
    return (
      <div className="speaker-detail-page">
        <div className="container">
          <motion.div className="speaker-not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p>Loading speaker...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!speaker) {
    return (
      <div className="speaker-detail-page">
        <div className="container">
          <motion.div className="speaker-not-found" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1>Speaker Not Found</h1>
            <p>The speaker you're looking for doesn't exist or may have moved.</p>
            <Link to="/speakers" className="btn btn-primary">Browse All Speakers</Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // Build social entries
  const socialEntries = (() => {
    if (!speaker.socialStats || Object.keys(speaker.socialStats).length === 0) return []
    const profiles = speaker.socialProfiles || {}
    const platformOrder = ['youtube', 'instagram', 'tiktok', 'x']
    return platformOrder
      .filter(platform => speaker.socialStats[platform])
      .map(platform => {
        const data = speaker.socialStats[platform]
        const count = data.followers ?? data.subscribers ?? 0
        return {
          platform,
          count,
          url: profiles[platform] && PLATFORM_URLS[platform] ? PLATFORM_URLS[platform](profiles[platform]) : null,
        }
      })
      .filter(e => e.count > 0)
  })()

  const totalFollowing = socialEntries.reduce((sum, e) => sum + e.count, 0)

  return (
    <div className="speaker-detail-page">
      <Cursor />

      {hasVideo && (
        <VideoHero
          speaker={speaker}
          video={video}
          socialEntries={socialEntries}
          totalFollowing={totalFollowing}
          brief={brief}
          onEnquire={handleEnquireClick}
          onEnquireHover={handleEnquireHover}
          id={id}
          isSelected={isSelected}
          setIsSelected={setIsSelected}
          handleSelectAndBack={handleSelectAndBack}
        />
      )}

      <section className="speaker-hero"
        style={{
          paddingTop: !hasVideo && "var(--header-height)"
        }}
      >
        <div className="container" style={{
          height: "100%"
        }}>
          <div className="speaker-hero__grid">
            <motion.div
              className="speaker-hero__image-col"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="speaker-hero__image-wrapper">
                <motion.img
                  src={null}
                  alt="spotlight"
                  className="speaker-detail-page__spotlight"
                  style={{
                    WebkitMaskImage: `url(${spotlight})`,
                    maskImage: `url(${spotlight})`,
                  }}
                />

                {/* <img src={speaker.photo} alt={speaker.name} className="speaker-hero__image" /> */}
                <img src={temp} alt={speaker.name} className="speaker-hero__image" />

                <div className="speaker-hero__bottom">
                  <div className="left">
                    <h1 className="speaker-hero__title">{speaker.name}</h1>
                    <span className="speaker-hero__description">{speaker.headline}</span>
                  </div>
                  <div className="right">
                    <motion.button
                      onClick={handleEnquireClick}
                      onMouseEnter={handleEnquireHover}
                      className="btn btn-primary btn-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Enquire Now
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="speaker-hero__content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            >
              <motion.div style={{
                marginBottom: "16px"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px"
                }}>
                  <img src={keyIcon} alt="key-icon" style={{
                    width: "30px",
                    height: "30px",
                  }}/>
                  <h2 className="speaker-body__bio-title">About {speaker.name}</h2>
                </div>
                <div className="speaker-body__bio">
                  {speaker.bio.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </motion.div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{
                  display: "flex",
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignContent: "flex-start"
                  }}>
                    <span style={{
                      fontWeight: "500",
                      fontSize: "1.2rem"
                    }}>Location</span>
                    <span>{speaker.location}</span>
                  </div>
                </div>
                {/* <LocationLine location={speaker.location} className="speaker-hero__location" /> */}

                <div style={{
                  flex: "1",
                  borderBottom: "1px solid #ffffff"
                }}></div>

                {socialEntries.length > 0 && (
                  <div className="speaker-hero__social">
                    {totalFollowing > 0 && (
                      <span className="speaker-hero__social-total">
                        {formatFollowers(totalFollowing)} total following
                      </span>
                    )}
                    <div className="speaker-hero__social-pills">
                      {socialEntries.map(({ platform, count, url }, i) => (
                        <motion.a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`speaker-hero__social-pill speaker-hero__social-pill--${platform}`}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.35, delay: 0.4 + i * 0.08, ease: EASE }}
                        >
                          {platformIcons[platform]}
                          {formatFollowers(count)}
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="speaker-body__right">
                  {/* AI Reasoning — animated gradient border */}
                  {briefReasoning && (
                    <motion.div
                      className="speaker-block speaker-block--reasoning speaker-block--glow"
                      initial={{ opacity: 0, y: 24, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="speaker-block__header">
                        <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" style={{ color: '#22c55e' }}>
                          <path d="M6 0L7.76 3.58L11.71 4.15L8.85 6.95L9.53 10.88L6 9.02L2.47 10.88L3.15 6.95L0.29 4.15L4.24 3.58L6 0Z"/>
                        </svg>
                        <span>Why {speaker.name} matches your brief</span>
                        {briefScore != null && (
                          <span className="speaker-block__score">{briefScore}% match</span>
                        )}
                      </div>
                      <p className="speaker-block__text">{briefReasoning}</p>
                    </motion.div>
                  )}

                  {/* Key Topics — expandable on hover */}
                  <motion.div
                    className="speaker-block speaker-block--glow"
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
                    whileHover={{ y: -2 }}
                  >
                    <div style={{
                      marginBottom: "14px",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignContent: "center",
                      gap: "16px"
                    }}>
                      <img src={targetIcon} alt="target-icon" style={{
                        width: "30px",
                        height: "30px"
                      }} />
                      <h3 className="speaker-block__title">Key Topics</h3>
                    </div>
                    <div className="speaker-topics-list">
                      {speaker.topics.map((topic, index) => {
                        const isHovered = hoveredTopic === index
                        return (
                          <motion.div
                            key={index}
                            className={`speaker-topic-row${isHovered ? ' speaker-topic-row--active' : ''}`}
                            onHoverStart={() => setHoveredTopic(index)}
                            onHoverEnd={() => setHoveredTopic(null)}
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + index * 0.06, duration: 0.35, ease: EASE }}
                            layout
                          >
                            <div className="speaker-topic-row__header">
                              <span className="speaker-topic-row__label">{topic}</span>
                            </div>
                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  className="speaker-topic-row__detail"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: EASE }}
                                >
                                  <p>
                                    {briefReasoning && briefReasoning.toLowerCase().includes(topic.toLowerCase().split(' ')[0])
                                      ? `Directly relevant to your brief. ${speaker.name}'s work in ${topic.toLowerCase()} addresses the themes and outcomes you're looking for.`
                                      : `A core area of ${speaker.name}'s expertise, delivering practical frameworks and proven strategies in ${topic.toLowerCase()}.`
                                    }
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Ideal Audiences — interactive hover rows */}
                  {speaker.audiences && speaker.audiences.length > 0 && (
                    <motion.div
                      className="speaker-block speaker-block--glow"
                      initial={{ opacity: 0, y: 24, scale: 0.97 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: EASE }}
                      whileHover={{ y: -2 }}
                    >
                      <div style={{
                        marginBottom: "14px",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignContent: "center",
                        gap: "16px"
                      }}>
                        <img src={audienceIcon} alt="audience-icon" style={{
                          width: "30px",
                          height: "30px"
                        }} />
                        <h3 className="speaker-block__title">Ideal Audiences</h3>
                      </div>

                      <div className="speaker-audiences-list">
                        {speaker.audiences.map((audience, index) => {
                          const isActive = hoveredAudience === index
                          return (
                            <motion.div
                              key={index}
                              className={`speaker-audience-row${isActive ? ' speaker-audience-row--active' : ''}`}
                              onHoverStart={() => setHoveredAudience(index)}
                              onHoverEnd={() => setHoveredAudience(null)}
                              initial={{ opacity: 0, x: -8 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.1 + index * 0.06, duration: 0.35, ease: EASE }}
                              layout
                            >
                              <div className="speaker-audience-row__header">
                                <span className="speaker-audience-row__label">{audience}</span>
                              </div>
                              <AnimatePresence>
                                {isActive && (
                                  <motion.div
                                    className="speaker-audience-row__detail"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: EASE }}
                                  >
                                    <p>
                                      {briefReasoning
                                        ? `Recommended for your event. ${speaker.name} has a proven track record engaging ${audience.toLowerCase()} with content tailored to their needs.`
                                        : `${speaker.name} adapts their delivery and content to resonate deeply with ${audience.toLowerCase()}, ensuring maximum engagement and lasting impact.`
                                      }
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ========== ROW 3: Related Speakers — full width ========== */}
      {relatedSpeakers.length > 0 && (
        <SimilarSpeakers speakers={relatedSpeakers} />
      )}
    </div>
  )
}

export default SpeakerDetailPage