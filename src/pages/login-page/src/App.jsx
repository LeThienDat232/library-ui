import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './App.module.css'
import webshelfLogo from './assets/webshelf-logo.png'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'https://library-api-dicz.onrender.com'
).replace(/\/$/, '');
const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;

function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [formValues, setFormValues] = useState({ email: '', password: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formValues.email.trim(),
          username: formValues.email.trim(),
          password: formValues.password,
        }),
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (!response.ok) {
        const message =
          (payload && (payload.error || payload.message)) || 'Invalid credentials'
        throw new Error(message)
      }
      if (typeof onLogin === 'function') {
        onLogin(payload)
      }
      navigate('/')
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to sign in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles['sign-in-shell']}>
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

        <h1 className={styles['welcome-heading']}>Nice to see you again</h1>

        <form className={styles['sign-in-form']} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Login</span>
            <input
              type="text"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="Email or phone number"
              autoComplete="username"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className={`${styles.field} ${styles['password-field']}`}>
            <span>Password</span>
            <div className={styles['password-input']}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formValues.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles['toggle-password']}
                aria-label={`${showPassword ? 'Hide' : 'Show'} password`}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
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

          <div className={styles['form-row']}>
            <div style={{ flex: 1 }} />
            <Link className={styles['link-muted']} to="/reset-password">
              Forgot password?
            </Link>
          </div>

          {errorMessage && (
            <p className={styles['error-message']} role="alert">
              {errorMessage}
            </p>
          )}

          <button type="submit" className={styles['primary-btn']} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className={styles['sign-up-cta']}>
          <span>Don&apos;t have an account?</span>
          <Link to="/register">Sign up now</Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
