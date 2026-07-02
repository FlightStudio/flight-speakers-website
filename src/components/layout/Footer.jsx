import './Footer.css'

import { Link } from 'react-router-dom'

import logo from "../../assets/logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={logo} alt="logo" style={{
                maxHeight: "40px"
              }}
              />
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
                <li><Link to="/news">News</Link></li>
                <li><a href="https://www.linkedin.com/company/flight-story-official" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a href="https://instagram.com/flightstory" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Flight Story. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/privacy-policy">Terms of Service</Link>
            <button
              type="button"
              className="footer-legal__btn"
              onClick={() => window.dispatchEvent(new CustomEvent('open-a11y-menu'))}
            >
              Accessibility
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
