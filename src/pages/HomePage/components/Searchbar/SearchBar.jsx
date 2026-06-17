import './SearchBar.css';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { placeholders } from './examples';

import ellipsePink from '../../../../assets/ellipse-pink.png';
import ellipseBlue from '../../../../assets/ellipse-blue.png';
import searchIcon from '../../../../assets/search.png';

function SearchBar() {
	const [searchQuery, setSearchQuery] = useState('');
	const [isFocused, setIsFocused] = useState(false);
  const [typingText, setTypingText] = useState('')

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
      <img src={ellipseBlue} alt="spotlight-blue" className="hearo-search__spotlight left" />
			<div className={`hero-search__container ${isFocused ? 'hero-search__container--focused' : ''}`}>
				<div className="hero-search__icon">
          <img src={searchIcon} alt="search-icon" />
				</div>

				<div className="hero-search__input-wrapper">
					<input
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
						<span className="hero-search__placeholder">
							{isFocused ? 'Describe your event and ideal speaker...' : typingText}
							{!isFocused && <span className="hero-search__cursor">|</span>}
						</span>
					)}
				</div>

				<motion.button
					type="submit"
					className="hero-search__button"
					disabled={!searchQuery.trim()}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<span>Find Speakers</span>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</motion.button>
			</div>
      <img src={ellipsePink} alt="spotlight-pink" className="hearo-search__spotlight right" />
		</motion.form>
	);
}

export default SearchBar;
