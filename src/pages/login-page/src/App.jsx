import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './App.module.css'
import webshelfLogo from './assets/webshelf-logo.png'

function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (typeof onLogin === 'function') {
      onLogin()
    }
    navigate('/')
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
        <header className={styles.brand}>
          <img src={webshelfLogo} alt="Webshelf logo" className={styles['brand-logo']} />
          <p className={styles['brand-title']}>WEBSHELF</p>
        </header>

        <h1 className={styles['welcome-heading']}>Nice to see you again</h1>

        <form className={styles['sign-in-form']} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Login</span>
            <input
              type="text"
              name="email"
              placeholder="Email or phone number"
              autoComplete="username"
              required
            />
          </label>

          <label className={`${styles.field} ${styles['password-field']}`}>
            <span>Password</span>
            <div className={styles['password-input']}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter password"
                autoComplete="current-password"
                required
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
            <label className={styles.checkbox}>
              <input type="checkbox" name="remember" />
              <span>Keep me signed in</span>
            </label>
            <a className={styles['link-muted']} href="#">
              Forgot password?
            </a>
          </div>

          <button type="submit" className={styles['primary-btn']}>
            Sign in
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
