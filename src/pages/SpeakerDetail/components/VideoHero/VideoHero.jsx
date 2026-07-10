import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { EASE } from '../../../../constants/animation'


function LocationLine({ location, className }) {
  if (!location) return null
  return (
    <p className={className}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M6 1.5C4.07 1.5 2.5 3.07 2.5 5C2.5 7.5 6 10.5 6 10.5S9.5 7.5 9.5 5C9.5 3.07 7.93 1.5 6 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <circle cx="6" cy="5" r="1.3" fill="currentColor"/>
      </svg>
      {location}
    </p>
  )
}

function VideoHero({
  speaker,
  video,
  socialEntries,
  totalFollowing,
  brief,
  onEnquire,
  onEnquireHover,
  id,
  isSelected,
  setIsSelected,
  handleSelectAndBack
}) {
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef(null)

  const iframeSrc = video.type === 'youtube'
    ? `https://www.youtube.com/embed/${video.id}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${video.id}&controls=0&modestbranding=1&rel=0`
    : null

  // Parallax scrolling
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const springY = useSpring(heroY, { stiffness: 100, damping: 30 })

  return (
    <motion.section className="speaker-video-hero-section"
      style={{ y: springY }}
    >
      <motion.div
        className="speaker-video-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="speaker-video-hero__scrim_top" />

        {video.type === 'direct' ? (
          <video ref={videoRef} className="speaker-video-hero__iframe" src={video.src} autoPlay loop muted={isMuted} playsInline preload="metadata"  />
        ) : (
          <iframe className="speaker-video-hero__iframe" src={iframeSrc} title={`${speaker.name} Speaker Reel`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        )}
        <div className="speaker-video-hero__scrim" />
        <div className="speaker-video-hero__overlay">
          <div className="speaker-video-hero__info">
            <div className="speaker-video-hero__identity">
              <img
                src={speaker.photo}
                alt={speaker.name}
                className="speaker-video-hero__photo"
              />
              <div>
                <h1 className="speaker-video-hero__name">{speaker.name}</h1>
                <p className="speaker-video-hero__headline">
                  {speaker.headline}
                  {totalFollowing > 0 && (
                    <span className="speaker-video-hero__following"> · {formatFollowers(totalFollowing)} following</span>
                  )}
                </p>
                <LocationLine location={speaker.location} className="speaker-video-hero__location" />
              </div>
            </div>
            {socialEntries.length > 0 && (
              <div className="speaker-video-hero__social-pills">
                {socialEntries.map(({ platform, count, url }, i) => (
                  <motion.a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`speaker-video-hero__social-pill speaker-video-hero__social-pill--${platform}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.5 + i * 0.08, ease: EASE }}
                  >
                    {platformIcons[platform]}
                    {formatFollowers(count)}
                  </motion.a>
                ))}
              </div>
            )}
          </div>
          <div className="speaker-video-hero__actions">
            <motion.button
              onClick={onEnquire}
              onMouseEnter={onEnquireHover}
              className="speaker-video-hero__enquire-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Enquire Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
            <button
              className="speaker-video-hero__sound-btn"
              onClick={() => {
                setIsMuted(m => {
                  const next = !m
                  if (videoRef.current) videoRef.current.muted = next
                  return next
                })
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}

export default VideoHero;
