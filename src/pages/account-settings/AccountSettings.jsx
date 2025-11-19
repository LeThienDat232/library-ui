import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AccountSettings.module.css";

const PROFILE_ENDPOINT = "https://library-api-dicz.onrender.com/users/me";

function AccountSettings({ authSession, onLogout }) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    password: "",
    newPassword: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const accessToken = authSession?.accessToken ?? authSession?.token ?? null;

  useEffect(() => {
    if (authSession?.user) {
      setFormValues((prev) => ({
        ...prev,
        firstName: authSession.user.firstName || prev.firstName,
        lastName: authSession.user.lastName || prev.lastName,
      }));
    }
  }, [authSession]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!accessToken) {
      setStatusType("error");
      setStatusMessage("You must sign in before updating your profile.");
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage("");
      const response = await fetch(PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          password: formValues.password,
          newPassword: formValues.newPassword,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || payload?.message || "Unable to update profile.";
        throw new Error(message);
      }

      setStatusType("success");
      setStatusMessage("Account updated successfully.");
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error.message ?? "Something went wrong. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
    navigate("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div>
            <p className={styles.label}>Account</p>
            <h1>Update your profile</h1>
          </div>
          <div className={styles.headerButtons}>
            <button type="button" className={styles.secondaryBtn} onClick={() => navigate("/")}>
              ← Back home
            </button>
            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>First name</span>
              <input
                type="text"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Last name</span>
              <input
                type="text"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Current password</span>
            <input
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="Enter current password"
            />
          </label>

          <label className={styles.field}>
            <span>New password</span>
            <input
              type="password"
              name="newPassword"
              value={formValues.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
            />
          </label>

          {statusMessage && (
            <p
              className={
                statusType === "error" ? styles.errorMessage : styles.successMessage
              }
            >
              {statusMessage}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AccountSettings;
