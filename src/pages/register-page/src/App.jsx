import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import webshelfLogo from './assets/webshelf-logo.png'
import styles from './App.module.css'
import { API_BASE_URL } from '../../../api/config.js'

const REGISTER_ENDPOINT = `${API_BASE_URL}/auth/register`

function RegisterPage() {
  const navigate = useNavigate()
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formValues, setFormValues] = useState({
    contact: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const email = formValues.contact.trim()
    const firstName = formValues.firstName.trim()
    const lastName = formValues.lastName.trim()
    const password = formValues.password

    if (!email) {
      setErrorMessage('Please enter an email address.')
      return
    }
    if (!firstName || !lastName) {
      setErrorMessage('Please enter both your first and last name.')
      return
    }
    if (!password) {
      setErrorMessage('Please choose a password.')
      return
    }
    if (password !== formValues.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          (payload && (payload.error || payload.message)) ||
          'Unable to create your account right now.'
        throw new Error(message)
      }

      setSuccessMessage(
        payload?.message ?? 'Account created! Check your email for the activation link.'
      )
      setFormValues({
        contact: email,
        firstName,
        lastName,
        password: '',
        confirmPassword: '',
      })
      setTimeout(() => navigate('/login'), 1400)
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to create your account right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles['sign-up-shell']}>
      <section className={styles['hero-pane']} aria-describedby="hero-caption">
        <div
          className={styles['hero-image']}
          role="img"
          aria-label="Sailboat and lighthouse on a calm sea at sunset"
        />
        <p className={styles['photo-credit']} id="hero-caption">
          Photo by{' '}
          <a
            href="https://unsplash.com/photos/boat-on-sea-water-near-mountain-during-sunrise-LBoZ--DnO8w"
            target="_blank"
            rel="noreferrer"
          >
            Alexandr Popadin
          </a>
        </p>
      </section>

      <section className={styles['form-pane']}>
        <header aria-label="Webshelf brand">
          <Link
            to="/"
            className={styles.brand}
            aria-label="Go to the Webshelf homepage"
          >
            <img src={webshelfLogo} alt="Webshelf logo" className={styles['brand-logo']} />
            <span className={styles['brand-title']}>WEBSHELF</span>
          </Link>
        </header>

        <h1 className={styles['form-heading']}>Ready to turn the first page?</h1>
        <p className={styles.helper}>
          Create your Webshelf account to browse, borrow, and review books. We&apos;ll email an
          activation link to confirm your account.
        </p>

        <form className={styles['sign-up-form']} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              name="contact"
              value={formValues.contact}
              onChange={handleChange}
              placeholder="name@email.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </label>

          <div className={styles['name-row']}>
            <label className={styles.field}>
              <span>First name</span>
              <input
                type="text"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                placeholder="Jane"
                autoComplete="given-name"
                required
                disabled={isSubmitting}
              />
            </label>
            <label className={styles.field}>
              <span>Last name</span>
              <input
                type="text"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                placeholder="Doe"
                autoComplete="family-name"
                required
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="Choose a secure password"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </label>

          <label className={`${styles.field} ${styles['password-field']}`}>
            <span>Confirm password</span>
            <div className={styles['password-input']}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formValues.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />

              <button
                type="button"
                className={styles['toggle-password']}
                aria-label={`${showConfirmPassword ? 'Hide' : 'Show'} password`}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <path
                    d="M1.5 12.25C3.2 7.92 7.26 5 12 5s8.8 2.92 10.5 7.25C20.8 16.58 16.74 19.5 12 19.5s-8.8-2.92-10.5-7.25Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12.25"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </svg>
                <span className="sr-only">Toggle password visibility</span>
              </button>
            </div>
          </label>

          {errorMessage && (
            <p className={styles['error-message']} role="alert" aria-live="polite">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className={styles['success-message']} role="status" aria-live="polite">
              {successMessage}
            </p>
          )}

          <button type="submit" className={styles['primary-btn']} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <div className={styles['signin-cta']}>
          <span>Already have an account?</span>
          <Link to="/login" className={styles['link-muted']}>
            Sign in now
          </Link>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
