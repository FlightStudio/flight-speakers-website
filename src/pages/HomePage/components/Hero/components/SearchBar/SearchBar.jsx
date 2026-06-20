import './SearchBar.css';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion';

import { placeholders } from './examples';

import ellipsePink from '../../../../../../assets/ellipse-pink.png';
import ellipseBlue from '../../../../../../assets/ellipse-blue.png';
import cursorLight from '../../../../../../assets/cursor-light-purple.png';
import star from '../../../../../../assets/star.png';

function SearchBar() {
  const navigate = useNavigate()

	const [searchQuery, setSearchQuery] = useState('');
	const [isFocused, setIsFocused] = useState(false);
  const [typingText, setTypingText] = useState('')

  const SPARKS = [
    { x: 7,  y: 52, s: 2, d: 5.0, delay: 0 },
    { x: 12, y: 45, s: 3, d: 6.2, delay: 0.6 },
    { x: 17, y: 58, s: 1, d: 7.4, delay: 1.1 },
    { x: 21, y: 42, s: 2, d: 4.8, delay: 0.3 },
    { x: 29, y: 53, s: 4, d: 4.0, delay: 0.9 },
    { x: 34, y: 37, s: 3, d: 5.6, delay: 1.4 },
    { x: 40, y: 58, s: 2, d: 8.0, delay: 0.5 },
    { x: 45, y: 53, s: 3, d: 5.2, delay: 0.8 },
  ];

	useEffect(() => {
		if (searchQuery || isFocused) return

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
			className="hero-search"
			onSubmit={handleSearch}
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.7 }}
		>
      <img src={ellipseBlue} alt="spotlight-blue" className="hero-search__spotlight left hide-mobile" />
			<div className={`hero-search__container ${isFocused ? 'hero-search__container--focused' : ''}`}>
				<div className="hero-search__input-wrapper">
					<input
            id="search"
						// ref={inputRef}
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						className="hero-search__input"
						placeholder=""
					/>
					{!searchQuery && (
            <span className="hero-search__placeholder" style={{
              overflow: 'visible'
            }}>
              <span
                className={isFocused ? "hide-mobile" : ""}
                style={{ opacity: '0.5' }}
              >{ isFocused
                ? "Describe your event and ideal speaker..."
                : typingText
              }</span>
							{ !isFocused && (
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
                          // opacity: '0.1'
                        }}>
                          <span style={{
                            display: 'block',
                            width: p.s,
                            height: p.s,
                            borderRadius: '50%',
                            background: 'rgba(255, 240, 226, 0.95)',
                            boxShadow: `0 0 ${p.s * 1.6}px rgba(255, 220, 196, 0.9)`,
                            mixBlendMode: 'screen',
                            // opacity: '0.1',
                            // animation: `twinkle ${p.d}s ease-in-out ${p.delay}s infinite alternate`,
                            animation: `twinkle ${p.d}s ease-in-out ${p.delay}s infinite alternate backwards`,
                          }} />
                        </li>
                      ))}
                    </ul>
                  </span>
                </span>
              )}
						</span>
					)}
				</div>

				<motion.button
					type="submit"
					className="hero-search__button"
					disabled={!searchQuery.trim()}
					whileTap={{ scale: 0.98 }}
				>
          <img src={star} alt="star" />
					<span>Find Speakers</span>
				</motion.button>
			</div>
      <img src={ellipsePink} alt="spotlight-pink" className="hero-search__spotlight right hide-mobile" />
		</motion.form>
	);
}

export default SearchBar;
