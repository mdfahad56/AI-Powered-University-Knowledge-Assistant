import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Footer from './Footer'
import './Auth.css'

export default function AuthPage({ initialMode = 'login', isDark, setIsDark, Navbar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, loginWithGoogle, isAuthenticated } = useAuth()

  // Tab mode: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/signup' ? 'signup' : initialMode
  )

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Signup form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)

  // Feedback states
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
    setForgotMessage('')
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setForgotMessage('')

    const trimmedEmail = loginEmail.trim()
    if (!trimmedEmail) {
      setError('Email address is required.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!loginPassword) {
      setError('Password is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(trimmedEmail, loginPassword, rememberMe)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to log in. Please check your credentials and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setForgotMessage('')

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = signupEmail.trim()

    if (!trimmedFirst) {
      setError('First name is required.')
      return
    }
    if (!trimmedLast) {
      setError('Last name is required.')
      return
    }
    if (!trimmedEmail) {
      setError('Email address is required.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!signupPassword) {
      setError('Password is required.')
      return
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.')
      return
    }

    setIsSubmitting(true)
    try {
      await register(trimmedFirst, trimmedLast, trimmedEmail, signupPassword, confirmPassword)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setForgotMessage('')
    setIsGoogleSubmitting(true)

    try {
      await loginWithGoogle({
        email: 'student.aktu@gmail.com',
        first_name: 'AKTU',
        last_name: 'Student',
        avatar_url: '',
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.')
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    setForgotMessage(
      'Password reset instructions have been forwarded to your registered university email if an account exists.'
    )
  }

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'} auth-page-wrapper`}>
      {Navbar ? (
        <Navbar
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onAskAI={() => navigate('/ai')}
        />
      ) : null}

      <main className="auth-main-content">
        <div className="auth-card" role="region" aria-label="Authentication form">
          {/* Back Button */}
          <button
            type="button"
            className="auth-back-btn"
            onClick={handleBack}
            aria-label="Go back to previous page"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          {/* Header Title & Subtitle */}
          <div className="auth-header">
            <h1 className="auth-title">
              {activeTab === 'login' ? 'Welcome Back' : 'Create your account'}
            </h1>
            <p className="auth-subtitle">
              {activeTab === 'login'
                ? 'Sign in to continue to your University AI Knowledge Assistant.'
                : 'Join the University AI Knowledge Assistant.'}
            </p>
          </div>

          {/* Segmented Control / Tab Switcher */}
          <div className="auth-tabs" role="tablist" aria-label="Sign in or Sign up">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabChange('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Inline Error Message */}
          {error && (
            <div className="auth-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Info notice for forgot password */}
          {forgotMessage && (
            <div className="footer-newsletter-feedback footer-feedback-success" style={{ marginBottom: '1.25rem' }}>
              ✓ {forgotMessage}
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <div className="auth-input-wrapper">
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isSubmitting || isGoogleSubmitting}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <div className="auth-input-wrapper has-toggle">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="auth-options-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting || isGoogleSubmitting}
                  />
                  <span>Remember me</span>
                </label>

                <a href="#forgot" className="auth-forgot-link" onClick={handleForgotPassword}>
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>

              {/* Divider */}
              <div className="auth-divider">
                <span>Or continue with</span>
              </div>

              {/* Google Button */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleAuth}
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isGoogleSubmitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="auth-google-svg" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form className="auth-form" onSubmit={handleSignupSubmit} noValidate>
              <div className="auth-names-row">
                <div className="auth-field">
                  <label htmlFor="signup-firstname">First Name</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="signup-firstname"
                      type="text"
                      className="auth-input"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isSubmitting || isGoogleSubmitting}
                      autoComplete="given-name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-lastname">Last Name</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="signup-lastname"
                      type="text"
                      className="auth-input"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isSubmitting || isGoogleSubmitting}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email</label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup-email"
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isSubmitting || isGoogleSubmitting}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <div className="auth-input-wrapper has-toggle">
                  <input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <div className="auth-input-wrapper has-toggle">
                  <input
                    id="signup-confirm-password"
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                    aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Divider */}
              <div className="auth-divider">
                <span>Or continue with</span>
              </div>

              {/* Google Button */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleAuth}
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isGoogleSubmitting ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="auth-google-svg" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
