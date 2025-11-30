import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import webshelfLogo from "../../assets/webshelf-logo.png";
import { API_BASE_URL } from "../../api/config.js";

const REQUEST_ENDPOINT = `${API_BASE_URL}/auth/request-reset`;
const RESET_ENDPOINT = `${API_BASE_URL}/auth/reset`;

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get("token") ?? "";
  const [mode, setMode] = useState(tokenFromLink ? "reset" : "request");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestStatus, setRequestStatus] = useState({ type: "", message: "" });
  const [resetForm, setResetForm] = useState({
    token: tokenFromLink,
    password: "",
    confirmPassword: "",
  });
  const [resetStatus, setResetStatus] = useState({ type: "", message: "" });
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const isResetMode = mode === "reset";
  const descriptionText = useMemo(() => {
    if (isResetMode) {
      return "Create a new password for your Webshelf account using the secure link we emailed to you.";
    }
    return "Enter the email associated with your account and we’ll send you a reset link right away.";
  }, [isResetMode]);

  useEffect(() => {
    if (tokenFromLink) {
      setMode("reset");
      setResetForm((prev) => ({ ...prev, token: tokenFromLink }));
      setRequestStatus({ type: "", message: "" });
    }
  }, [tokenFromLink]);

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setRequestStatus({ type: "", message: "" });
    const email = requestEmail.trim();
    if (!email) {
      setRequestStatus({ type: "error", message: "Please enter the email tied to your account." });
      return;
    }
    try {
      setRequesting(true);
      const response = await fetch(REQUEST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error || payload?.message || "Unable to send reset instructions.";
        throw new Error(message);
      }
      setRequestStatus({
        type: "success",
        message: "If an account exists, we just sent a reset link to your email. Please check your inbox.",
      });
    } catch (error) {
      setRequestStatus({
        type: "error",
        message: error.message ?? "Unable to send reset instructions right now.",
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setResetStatus({ type: "", message: "" });
    const trimmedToken = resetForm.token.trim();
    if (!trimmedToken) {
      setResetStatus({ type: "error", message: "Your reset link is missing or expired. Please request a new one." });
      return;
    }
    if (!resetForm.password) {
      setResetStatus({ type: "error", message: "Please choose a new password." });
      return;
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      setResetStatus({ type: "error", message: "The password confirmation does not match." });
      return;
    }
    try {
      setResetting(true);
      const response = await fetch(RESET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: trimmedToken,
          password: resetForm.password,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error || payload?.message || "Unable to reset password.";
        throw new Error(message);
      }
      setResetStatus({
        type: "success",
        message: "Password updated! Hang tight, redirecting you to the sign-in page…",
      });
      setTimeout(() => navigate("/login"), 1400);
    } catch (error) {
      setResetStatus({
        type: "error",
        message: error.message ?? "Failed to reset password.",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    setResetStatus({ type: "", message: "" });
    setRequestStatus({ type: "", message: "" });
  };

  return (
    <main className={styles.shell}>
      <section className={styles.heroPane} aria-describedby="reset-hero-caption">
        <div className={styles.heroImage} aria-hidden="true" />
        <p className={styles.photoCredit} id="reset-hero-caption">
          Photo by{" "}
          <a
            href="https://unsplash.com/photos/boat-on-sea-water-near-mountain-during-sunrise-LBoZ--DnO8w"
            target="_blank"
            rel="noreferrer"
          >
            Alexandr Popadin
          </a>
        </p>
      </section>

      <section className={styles.formPane}>
        <header aria-label="Webshelf brand">
          <Link
            to="/"
            className={styles.brand}
            aria-label="Go to the Webshelf homepage"
          >
            <img src={webshelfLogo} alt="Webshelf logo" className={styles.brandLogo} />
            <span className={styles.brandTitle}>WEBSHELF</span>
          </Link>
        </header>
        <h1 className={styles.heading}>{isResetMode ? "Set a new password" : "Forgot your password?"}</h1>
        <p className={styles.subheading}>{descriptionText}</p>

        {isResetMode ? (
          <form className={styles.form} onSubmit={handleResetSubmit}>
            <label className={styles.field}>
              <span>Reset token</span>
              <input
                type="text"
                name="token"
                value={resetForm.token}
                onChange={handleResetChange}
                placeholder="Token from your email link"
                required
                disabled={resetting}
              />
            </label>

            <label className={styles.field}>
              <span>New password</span>
              <input
                type="password"
                name="password"
                value={resetForm.password}
                onChange={handleResetChange}
                placeholder="Enter a new password"
                autoComplete="new-password"
                required
                disabled={resetting}
              />
            </label>

            <label className={styles.field}>
              <span>Confirm new password</span>
              <input
                type="password"
                name="confirmPassword"
                value={resetForm.confirmPassword}
                onChange={handleResetChange}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                required
                disabled={resetting}
              />
            </label>

            {resetStatus.message && (
              <p
                className={
                  resetStatus.type === "error" ? styles.errorMessage : styles.successMessage
                }
                role="alert"
              >
                {resetStatus.message}
              </p>
            )}

            <button type="submit" className={styles.primaryBtn} disabled={resetting}>
              {resetting ? "Updating…" : "Reset password"}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRequestSubmit}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={requestEmail}
                onChange={(event) => setRequestEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                disabled={requesting}
              />
            </label>

            {requestStatus.message && (
              <p
                className={
                  requestStatus.type === "error" ? styles.errorMessage : styles.successMessage
                }
                role="alert"
              >
                {requestStatus.message}
              </p>
            )}

            <button type="submit" className={styles.primaryBtn} disabled={requesting}>
              {requesting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className={styles.modeSwitcher}>
          {isResetMode ? (
            <p>
              Need a fresh link?{" "}
              <button type="button" onClick={() => handleModeSwitch("request")} disabled={resetting}>
                Request another one
              </button>
            </p>
          ) : (
            <p>
              Already have a link?{" "}
              <button type="button" onClick={() => handleModeSwitch("reset")}>Enter reset token</button>
            </p>
          )}
        </div>

        <p className={styles.backLink}>
          Remembered your password? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;
