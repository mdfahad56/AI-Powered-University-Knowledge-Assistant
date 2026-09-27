import { useState } from 'react'
import './Support.css'

const INQUIRY_TYPES = [
  'General',
  'Technical Support',
  'Account',
  'Feedback',
  'Other',
]

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  country: 'India',
  phone: '',
  email: '',
  inquiry_type: 'General',
  message: '',
  newsletter: false,
}

export default function SupportSection() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else {
      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const digitsOnly = formData.phone.replace(/[\s\-\(\)\+]/g, '')
      if (!/^\d{7,15}$/.test(digitsOnly)) {
        newErrors.phone = 'Please enter a valid phone number (at least 7 digits)'
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please provide details about your inquiry'
    } else if (formData.message.trim().length < 5) {
      newErrors.message = 'Message must be at least 5 characters long'
    }

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleInquiryTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, inquiry_type: type }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setServerError('')
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setServerError('')

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          country: formData.country.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          inquiry_type: formData.inquiry_type,
          message: formData.message.trim(),
          newsletter: Boolean(formData.newsletter),
        }),
      })

      if (!response.ok) {
        let errMessage = 'Failed to submit your request. Please try again.'
        try {
          const errorData = await response.json()
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errMessage = errorData.detail.map((d) => d.msg || d.message).join(', ')
            } else {
              errMessage = errorData.detail
            }
          }
        } catch {
          // fallback
        }
        throw new Error(errMessage)
      }

      const result = await response.json()
      setSuccessMessage(
        result.message ||
          'Thank you! Your request has been submitted successfully. Our support team will get back to you soon.'
      )
      setFormData(INITIAL_FORM)
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="support-container">
      {/* Left Column: Contact info & Branding */}
      <div className="support-left">
        <div className="support-badge">
          <span>●</span> 24/7 Dedicated Support
        </div>

        <h1>
          You Have Questions,
          <br />
          <span>We Have Answers</span>
        </h1>

        <p className="support-left-desc">
          Our team is ready to assist you with every detail, big or small. Whether you are having trouble
          finding resources, downloading question papers, or have academic queries, we are here to help.
        </p>

        <div className="support-info-cards">
          {/* Location */}
          <div className="support-info-item">
            <div className="support-info-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="support-info-text">
              <span className="support-info-label">Location</span>
              <span className="support-info-value">
                AKTU Campus, Sector 62, Noida, Uttar Pradesh 201309
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="support-info-item">
            <div className="support-info-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div className="support-info-text">
              <span className="support-info-label">Email Support</span>
              <a href="mailto:support@aktu-assistant.edu" className="support-info-value">
                support@aktu-assistant.edu
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="support-info-item">
            <div className="support-info-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div className="support-info-text">
              <span className="support-info-label">Phone & Helpline</span>
              <a href="tel:+919876543210" className="support-info-value">
                +91 98765 43210 / +91 120 240 0000
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="support-info-item">
            <div className="support-info-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </div>
            <div className="support-info-text">
              <span className="support-info-label">Connect With Us</span>
              <div className="support-social-row">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="support-social-btn"
                  title="LinkedIn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="support-social-btn"
                  title="Twitter / X"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="support-social-btn"
                  title="GitHub"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="support-social-btn"
                  title="Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Tell Us What You Need Form Card */}
      <div className="support-right">
        <div className="support-card">
          <div className="support-card-header">
            <h2 className="support-card-title">Tell Us What You Need</h2>
            <p className="support-card-subtitle">
              Fill out the form below and an academic support specialist will respond within 24 hours.
            </p>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="support-alert support-alert-success" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>{successMessage}</div>
            </div>
          )}

          {serverError && (
            <div className="support-alert support-alert-error" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="support-form" noValidate>
            {/* First Name & Last Name */}
            <div className="support-row-2">
              <div className="support-field">
                <label htmlFor="first_name" className="support-label">
                  First Name <span className="support-required">*</span>
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="e.g. Rahul"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`support-input ${errors.first_name ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.first_name && <span className="support-error-hint">{errors.first_name}</span>}
              </div>

              <div className="support-field">
                <label htmlFor="last_name" className="support-label">
                  Last Name <span className="support-required">*</span>
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="e.g. Sharma"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`support-input ${errors.last_name ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.last_name && <span className="support-error-hint">{errors.last_name}</span>}
              </div>
            </div>

            {/* Country & Phone Number */}
            <div className="support-row-2">
              <div className="support-field">
                <label htmlFor="country" className="support-label">
                  Country <span className="support-required">*</span>
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={handleChange}
                  className={`support-input ${errors.country ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.country && <span className="support-error-hint">{errors.country}</span>}
              </div>

              <div className="support-field">
                <label htmlFor="phone" className="support-label">
                  Phone Number <span className="support-required">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`support-input ${errors.phone ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.phone && <span className="support-error-hint">{errors.phone}</span>}
              </div>
            </div>

            {/* Email Address */}
            <div className="support-field">
              <label htmlFor="email" className="support-label">
                Email Address <span className="support-required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@aktu.ac.in"
                value={formData.email}
                onChange={handleChange}
                className={`support-input ${errors.email ? 'has-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.email && <span className="support-error-hint">{errors.email}</span>}
            </div>

            {/* Type of Inquiry */}
            <div className="support-field">
              <label className="support-label">Type of Inquiry</label>
              <div className="support-inquiry-group">
                {INQUIRY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInquiryTypeSelect(type)}
                    className={`support-inquiry-pill ${formData.inquiry_type === type ? 'active' : ''}`}
                    disabled={isSubmitting}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div className="support-field">
              <label htmlFor="message" className="support-label">
                Message <span className="support-required">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Please describe how we can assist you..."
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className={`support-textarea ${errors.message ? 'has-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.message && <span className="support-error-hint">{errors.message}</span>}
            </div>

            {/* Newsletter Checkbox */}
            <label className="support-checkbox-row">
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span className="support-checkbox-text">
                I'd like to receive exclusive offers and academic updates.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className="support-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="support-spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
