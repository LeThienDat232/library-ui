import { useState } from 'react'
import webshelfLogo from './assets/webshelf-logo.png'
import './App.css'

function App() {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <main className="sign-up-shell">
      <section className="hero-pane" aria-describedby="hero-caption">
        <div
          className="hero-image"
          role="img"
          aria-label="Sailboat and lighthouse on a calm sea at sunset"
        />
        <p className="photo-credit" id="hero-caption">
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

      <section className="form-pane">
        <header className="brand" aria-label="Webshelf brand">
          <img src={webshelfLogo} alt="Webshelf logo" className="brand-logo" />
          <p className="brand-title">WEBSHELF</p>
        </header>

        <h1 className="form-heading">Ready to turn the first page?</h1>

        <form className="sign-up-form">
          <label className="field">
            <span>Email or phone number</span>
            <input
              type="text"
              name="contact"
              placeholder="Email or phone number"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              name="username"
              placeholder="Username"
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Choose a secure password"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field password-field">
            <span>Confirm password</span>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="toggle-password"
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

          <button type="submit" className="primary-btn">
            Sign up
          </button>
        </form>

        <div className="signin-cta">
          <span>Already have an account?</span>
          <a href="#" className="link-muted">
            Sign in now
          </a>
        </div>
      </section>
    </main>
  )
}

export default App
