import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AccountSettings.module.css";

const PROFILE_ENDPOINT = "https://library-api-dicz.onrender.com/auth/profile";
const PASSWORD_ENDPOINT = "https://library-api-dicz.onrender.com/auth/password";

const extractNameParts = (profile) => {
  if (!profile || typeof profile !== "object") {
    return { firstName: "", lastName: "" };
  }
  const firstName =
    profile.firstName ||
    profile.first_name ||
    profile.given_name ||
    profile.givenName ||
    "";
  const lastName =
    profile.lastName ||
    profile.last_name ||
    profile.family_name ||
    profile.familyName ||
    "";
  if (firstName || lastName) {
    return { firstName, lastName };
  }
  const displayName =
    profile.fullName ||
    profile.full_name ||
    profile.name ||
    profile.username ||
    "";
  if (!displayName) {
    return { firstName: "", lastName: "" };
  }
  const [first, ...rest] = displayName.trim().split(/\s+/);
  return { firstName: first ?? "", lastName: rest.join(" ") };
};

function AccountSettings({ authSession, onLogout }) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    currentPassword: "",
    newPassword: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const accessToken = authSession?.accessToken ?? authSession?.token ?? null;

  useEffect(() => {
    if (authSession?.user) {
      const parts = extractNameParts(authSession.user);
      setFormValues((prev) => ({
        ...prev,
        ...(parts.firstName ? { firstName: parts.firstName } : {}),
        ...(parts.lastName ? { lastName: parts.lastName } : {}),
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
    const trimmedFirst = formValues.firstName.trim();
    const trimmedLast = formValues.lastName.trim();
    const wantsPasswordChange = Boolean(formValues.newPassword);
    if (!trimmedFirst && !trimmedLast && !wantsPasswordChange) {
      setStatusType("info");
      setStatusMessage("There is nothing to update yet.");
      return;
    }
    if (wantsPasswordChange && !formValues.currentPassword) {
      setStatusType("error");
      setStatusMessage("Enter your current password to set a new one.");
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage("");
      const pending = [];
      let profileUpdated = false;
      let passwordUpdated = false;

      if (trimmedFirst || trimmedLast) {
        const profilePayload = {
          ...(trimmedFirst ? { first_name: trimmedFirst } : {}),
          ...(trimmedLast ? { last_name: trimmedLast } : {}),
        };
        const request = fetch(PROFILE_ENDPOINT, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(profilePayload),
        }).then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const message =
              payload?.error ||
              payload?.message ||
              "Unable to update your profile.";
            throw new Error(message);
          }
          profileUpdated = true;
        });
        pending.push(request);
      }

      if (wantsPasswordChange) {
        const request = fetch(PASSWORD_ENDPOINT, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            current_password: formValues.currentPassword,
            new_password: formValues.newPassword,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const message =
              payload?.error ||
              payload?.message ||
              "Unable to change your password.";
            throw new Error(message);
          }
          passwordUpdated = true;
        });
        pending.push(request);
      }

      if (pending.length === 0) {
        setStatusType("info");
        setStatusMessage("There is nothing to update yet.");
        return;
      }

      await Promise.all(pending);

      setStatusType("success");
      const segments = [];
      if (profileUpdated) segments.push("profile details");
      if (passwordUpdated) segments.push("password");
      const successText =
        segments.length > 0
          ? `${segments.join(" and ")} updated successfully.`
          : "Account updated successfully.";
      setStatusMessage(successText);
      setFormValues((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
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

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className={styles.row}>
            <label className={styles.field}>
              <span>First name</span>
              <input
                type="text"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                placeholder="First name"
                autoComplete="given-name"
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
                autoComplete="family-name"
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Current password</span>
            <input
              type="password"
              name="currentPassword"
              value={formValues.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              autoComplete="current-password"
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
              autoComplete="new-password"
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
