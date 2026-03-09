import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="footer-logo-icon">
                <path d="M8 24L16 6L24 24L16 18L8 24Z" fill="currentColor" fillOpacity="0.9"/>
                <circle cx="16" cy="12" r="3" fill="#6366f1"/>
              </svg>
              <span>Flight Story Speakers</span>
            </Link>
            <p className="footer-tagline">
              Curated talent meets AI-powered matching. Find the perfect speaker for your next event.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4 className="footer-heading">Platform</h4>
              <ul>
                <li><Link to="/speakers">Browse Speakers</Link></li>
                <li><Link to="/enquiry">Submit Brief</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><a href="https://flightstory.com" target="_blank" rel="noopener noreferrer">Flight Story</a></li>
                <li><a href="mailto:speakers@flightstory.com">Contact</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Connect</h4>
              <ul>
                <li><a href="https://www.linkedin.com/company/flight-story-official" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a href="https://instagram.com/flightstory" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Flight Story. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
