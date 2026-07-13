import './SearchBar.css';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion';

import { placeholders } from './examples';

import cursorLight from "../../../../../../assets/cursor-light-purple.png";
import star from "../../../../../../assets/star.png";

const autoResize = (el) => {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

let measureCtx
const longestLineWidth = (text, el) => {
  if (!text) return 0
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  const { fontStyle, fontWeight, fontSize, fontFamily } = getComputedStyle(el)
  measureCtx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
  return Math.max(...text.split('\n').map(line => measureCtx.measureText(line).width))
}

function SearchBar({ searchQuery, setSearchQuery, inputRef }) {
  const navigate = useNavigate()
  const containerRef = useRef(null)

	const [isFocused, setIsFocused] = useState(false);
  const [typingText, setTypingText] = useState('')
  const [breathing, setBreathing] = useState(false);
  const [inlineButton, setInlineButton] = useState(true);

  useEffect(() => {
    autoResize(inputRef.current)
  }, [searchQuery, inputRef, inlineButton])

  // Button shares the input's row while the typed text is under half the
  // container width; past that it drops back to its own row below.
  useEffect(() => {
    const update = () => {
      const container = containerRef.current
      const textarea = inputRef.current
      if (!container || !textarea) return
      setInlineButton(longestLineWidth(searchQuery, textarea) < container.clientWidth * 0.5)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [searchQuery, inputRef])

  const SPARKS = [
    { x: 7,  y: 52, s: 2, d: 3.0, delay: 0 },
    { x: 12, y: 45, s: 3, d: 4.2, delay: 0.6 },
    { x: 17, y: 38, s: 1, d: 5.4, delay: 1.1 },
    { x: 21, y: 42, s: 2, d: 2.8, delay: 0.3 },
    { x: 29, y: 53, s: 4, d: 2.0, delay: 0.9 },
    { x: 34, y: 37, s: 3, d: 3.6, delay: 1.4 },
    { x: 40, y: 58, s: 2, d: 6.0, delay: 0.5 },
    { x: 45, y: 53, s: 3, d: 3.2, delay: 0.8 },
  ];

	useEffect(() => {
    if (searchQuery || isFocused) {
			setTypingText('')
			return
		}

		let currentIndex = 0
		let currentChar = 0
		let isDeleting = false
		let timeout

		const type = () => {
			const currentText = placeholders[currentIndex]

			if (!isDeleting) {
				setTypingText(currentText.slice(0, currentChar + 1))
				currentChar++
				if (currentChar === currentText.length) {
					timeout = setTimeout(() => { isDeleting = true; type() }, 2000)
					return
				}
			} else {
				setTypingText(currentText.slice(0, currentChar))
				currentChar--
				if (currentChar === 0) {
					isDeleting = false
					currentIndex = (currentIndex + 1) % placeholders.length
				}
			}
			timeout = setTimeout(type, isDeleting ? 20 : 40)
		}

		timeout = setTimeout(type, 1000)
		return () => clearTimeout(timeout)
	}, [searchQuery, isFocused])

	const handleSearch = (e) => {
			e.preventDefault()
			if (searchQuery.trim()) {
			navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
			}
	}

	return (
		<motion.form
      className={"hero-search"}
			onSubmit={handleSearch}
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.7 }}
		>
			<div ref={containerRef} className={`hero-search__container ${isFocused ? 'hero-search__container--focused' : ''} ${inlineButton ? 'hero-search__container--inline' : ''}`}>
        <textarea
          data-lenis-prevent
          id="search"
          ref={inputRef}
          rows={1}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onInput={(e) => autoResize(e.target)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); setBreathing(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSearch(e)
            }
          }}
          className="hero-search__input"
          placeholder="Describe your event and ideal speaker..."
        />
        {!searchQuery && (
          <span className="hero-search__placeholder" style={{
            overflow: 'visible'
          }}>
            {/* <span
              className={isFocused ? "hide-mobile" : ""}
              style={{ opacity: '0.8' }}
            >{ isFocused
              ? "Describe your event and ideal speaker..."
              : typingText
            }</span> */}
            {/* <span
              className={isFocused ? "hide-mobile" : ""}
              style={{ opacity: '0.7' }}
            >Describe your event and ideal speaker...</span> */}
            {/* { !isFocused && (
              <span className="hero-search__caret" style={{
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle'
              }}>
                <span className="hero-search__cursor">|</span>
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <img
                    className="cursor-light"
                    src={cursorLight}
                    alt=""
                    style={{ height: '4em', width: 'auto', transform: 'translateX(-2px)' }}
                  />

                  <ul className="sparks" style={{
                    position: 'absolute',
                    inset: '-30px -15px -30px 0px',
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    pointerEvents: 'none',
                  }}>
                    {SPARKS.map((p, i) => (
                      <li key={i} style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}>
                        <span style={{
                          display: 'block',
                          width: p.s,
                          height: p.s,
                          borderRadius: '50%',
                          background: 'rgba(255, 240, 226, 0.95)',
                          boxShadow: `0 0 ${p.s * 1.6}px rgba(255, 220, 196, 0.9)`,
                          mixBlendMode: 'screen',
                          animation: `twinkle ${p.d}s ease-in-out ${p.delay}s infinite alternate backwards`,
                        }} />
                      </li>
                    ))}
                  </ul>
                </span>
              </span>
            )} */}
          </span>
        )}

				<motion.button
					type="submit"
					className="hero-search__button"
					disabled={!searchQuery.trim()}
					whileTap={{ scale: 0.98 }}
          style={{
            margin: "8px"
          }}
				>
          <img src={star} alt="star" />
					<span>Find Speakers</span>
				</motion.button>
			</div>
      {/* <motion.button
        type="submit"
        className="hero-search__button hide-desktop"
        disabled={!searchQuery.trim()}
        whileTap={{ scale: 0.98 }}
        style={{
          marginTop: "12px"
        }}
      >
        <img src={star} alt="star" />
        <span>Find Speakers</span>
      </motion.button> */}
		</motion.form>
	);
}

export default SearchBar;
