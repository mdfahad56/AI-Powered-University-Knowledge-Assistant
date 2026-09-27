import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [activeModal, setActiveModal] = useState(null)

  const handleSubscribe = async (e) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setStatus({ state: 'error', message: 'Please enter your email address' })
      return
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setStatus({ state: 'error', message: 'Please enter a valid email address' })
      return
    }

    setStatus({ state: 'loading', message: 'Subscribing...' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Subscription failed. Please try again.')
      }

      setStatus({
        state: 'success',
        message: data.message || 'Thank you for subscribing to our newsletter!',
      })
      setEmail('')
    } catch (err) {
      setStatus({
        state: 'error',
        message: err.message || 'Unable to subscribe right now. Please try again later.',
      })
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer-wrapper" aria-label="Site Footer">
      <div className="site-footer-container">
        <div className="footer-main-grid">
          {/* Left Column: Navigation Links */}
          <div className="footer-col-nav">
            <nav className="footer-nav-list" aria-label="Footer main navigation">
              <Link to="/" className="footer-nav-link">
                Home
              </Link>
              <a href="#overview" className="footer-nav-link">
                Our Product
              </a>
              <a href="#explore" className="footer-nav-link">
                Service
              </a>
              <a href="#resources" className="footer-nav-link">
                Technologies
              </a>
              <Link to="/support" className="footer-nav-link">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Middle Column: Policies */}
          <div className="footer-col-nav">
            <div className="footer-nav-list">
              <button
                type="button"
                className="footer-modal-trigger"
                onClick={() => setActiveModal('privacy')}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className="footer-modal-trigger"
                onClick={() => setActiveModal('terms')}
              >
                Terms and Conditions
              </button>
            </div>
          </div>

          {/* Right Column: Newsletter & Social */}
          <div className="footer-col-newsletter">
            <h3 className="footer-newsletter-title">Join Our Newsletter</h3>
            <p className="footer-newsletter-subtitle">
              Keep up to date with everything Reflects
            </p>

            <form className="footer-newsletter-form" onSubmit={handleSubscribe} noValidate>
              <div className="footer-input-row">
                <input
                  type="email"
                  className="footer-email-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status.state !== 'idle') {
                      setStatus({ state: 'idle', message: '' })
                    }
                  }}
                  disabled={status.state === 'loading'}
                  aria-label="Enter your email for newsletter"
                />
                <button
                  type="submit"
                  className="footer-subscribe-btn"
                  disabled={status.state === 'loading'}
                  aria-label="Subscribe to newsletter"
                >
                  {status.state === 'loading' ? (
                    <span className="footer-btn-spinner" aria-hidden="true" />
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>

              {status.state === 'error' && (
                <p className="footer-newsletter-feedback footer-feedback-error" role="alert">
                  {status.message}
                </p>
              )}
              {status.state === 'success' && (
                <p className="footer-newsletter-feedback footer-feedback-success" role="status">
                  ✓ {status.message}
                </p>
              )}
            </form>

            {/* Social Media Icons */}
            <div className="footer-social-group" aria-label="Social media links">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="footer-social-tile"
                aria-label="Visit our LinkedIn"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="footer-social-svg"
                  aria-hidden="true"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                className="footer-social-tile"
                aria-label="Visit our Instagram"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="footer-social-svg"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer noopener"
                className="footer-social-tile"
                aria-label="Visit our Facebook"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="footer-social-svg"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Thin Low-Contrast Divider Line */}
        <hr className="footer-divider" />

        {/* Bottom Copyright */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            ALIVIO, {currentYear} ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      {/* Accessible Policy Modals */}
      {activeModal && (
        <div
          className="footer-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="footer-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="footer-modal-header">
              <h3>
                {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
              </h3>
              <button
                type="button"
                className="footer-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="footer-modal-body">
              {activeModal === 'privacy' ? (
                <>
                  <p>
                    We value your privacy. This university portal collects minimal information
                    necessary to provide academic advising, question paper retrieval, and
                    student support services.
                  </p>
                  <p>
                    Data submitted through forms or AI queries is stored securely and never sold
                    or distributed to unauthorized third parties.
                  </p>
                  <p>
                    You may request deletion or export of your submitted information at any time
                    by contacting the campus technology department.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Welcome to the University Knowledge Assistant. By accessing or using this
                    platform, you agree to comply with campus academic integrity policies.
                  </p>
                  <p>
                    All course documents, past question papers, and AI-generated insights are
                    provided for educational and research reference only.
                  </p>
                  <p>
                    Misuse of automated queries or attempts to compromise the server infrastructure
                    is strictly prohibited under institutional regulations.
                  </p>
                </>
              )}
            </div>
            <div className="footer-modal-footer">
              <button
                type="button"
                className="footer-modal-btn"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
