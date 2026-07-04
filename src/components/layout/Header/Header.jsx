import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../../../constants/animation'
import './Header.css'
import ellipse from '../../../assets/header-ellipse.png';
import logo from '../../../assets/logo.png';

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      return stored ? stored === 'dark' : true
    }
    return true
  })
  const [scrolledMinimal, setScrolledMinimal] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const isSearchPage = location.pathname === '/search'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  // On /search, collapse header to logo-only after scrolling
  useEffect(() => {
    if (!isSearchPage) {
      setScrolledMinimal(false)
      return
    }
    const onScroll = () => setScrolledMinimal(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isSearchPage])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/speakers', label: 'SPEAKERS' },
    { path: '/about', label: 'ABOUT' },
  ]

  return (
    <>
      <motion.header
        className={`header${isSearchPage ? ' header--search' : ''}${scrolledMinimal ? ' header--minimal' : ''}${scrolled ? ' header--scrolled' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="container" style={{
          maxWidth: "unset",
        }}>
          <nav className="nav">
            <Link to="/" className="logo">
              <img style={{ width: "150px" }} src={logo} alt="logo" />
            </Link>

            <div className="nav-center hide-mobile">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'nav-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="nav-right">
              <motion.button
                type="submit"
                className="hero-search__button book-a-speaker__btn hide-mobile"
                whileTap={{ scale: 0.97 }}
              >
                <svg width="18" height="18" viewBox="0 0 20.022 20.022" fill="none" aria-hidden="true">
                  <path d="M 9.451 1.29 C 9.664 0.8 10.358 0.8 10.571 1.29 L 12.945 6.76 C 13.006 6.902 13.119 7.015 13.261 7.077 L 18.732 9.451 C 19.221 9.664 19.221 10.358 18.732 10.571 L 13.261 12.945 C 13.119 13.006 13.006 13.119 12.945 13.261 L 10.571 18.732 C 10.358 19.221 9.664 19.221 9.451 18.732 L 7.077 13.261 C 7.015 13.119 6.902 13.006 6.76 12.945 L 1.29 10.571 C 0.8 10.358 0.8 9.664 1.29 9.451 L 6.76 7.077 C 6.902 7.015 7.015 6.902 7.077 6.76 L 9.451 1.29 Z" fill="currentColor" />
                </svg>
                <span className="comet-search__btn-label">Book a speaker</span>
              </motion.button>

              {/* <motion.button
                className="theme-toggle"
                onClick={() => setDarkMode(d => !d)}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle dark mode"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                <AnimatePresence mode="wait">
                  {darkMode ? (
                    <motion.svg
                      key="sun"
                      width="18" height="18" viewBox="0 0 24 24" fill="none"
                      initial={{ rotate: -45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 45, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="moon"
                      width="18" height="18" viewBox="0 0 24 24" fill="none"
                      initial={{ rotate: 45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -45, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button> */}

              <button
                className="mobile-menu-toggle hide-desktop"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <div className={`hamburger ${mobileMenuOpen ? 'hamburger--open' : ''}`}>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="mobile-menu-content"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="mobile-menu-header">
              </div>

              <div className="mobile-menu-nav">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                  >
                    <Link
                      to={item.path}
                      className={`mobile-nav-link ${location.pathname === item.path ? 'mobile-nav-link--active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mobile-menu-footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/book')
                  }}
                >
                  Book a Speaker
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="mobile-menu-contact">
                  <a href="mailto:speakers@flightstory.com">speakers@flightstory.com</a>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
