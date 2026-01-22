import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './Header.css'

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 24L16 6L24 24L16 18L8 24Z" fill="currentColor" fillOpacity="0.9"/>
                <circle cx="16" cy="12" r="3" fill="#6366f1"/>
              </svg>
            </div>
            <span className="logo-text">Flight Story <span className="logo-accent">Speakers</span></span>
          </Link>

          <div className={`nav-links ${mobileMenuOpen ? 'nav-links--open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Speakers</Link>
            <Link to="/search" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Find a Speaker</Link>
            <Link to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <button
              className="btn btn-primary btn-sm nav-cta"
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/enquiry')
              }}
            >
              Submit Brief
            </button>
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${mobileMenuOpen ? 'hamburger--open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
