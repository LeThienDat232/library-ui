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
    phone: "",
    currentPassword: "",
    newPassword: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const accessToken = authSession?.accessToken ?? authSession?.token ?? null;

  useEffect(() => {
    if (authSession?.user) {
      const parts = extractNameParts(authSession.user);
      const phone =
        authSession.user.phone ||
        authSession.user.phone_number ||
        authSession.user.phoneNumber ||
        authSession.user.contact ||
        "";
      const email =
        authSession.user.email ||
        authSession.user.username ||
        authSession.user.contact ||
        "";
      setProfileData((prev) => ({
        ...prev,
        firstName: parts.firstName || prev.firstName,
        lastName: parts.lastName || prev.lastName,
        phone: phone || prev.phone,
        email: email || prev.email,
      }));
      setFormValues((prev) => ({
        ...prev,
        ...(parts.firstName ? { firstName: parts.firstName } : {}),
        ...(parts.lastName ? { lastName: parts.lastName } : {}),
        ...(phone ? { phone } : {}),
      }));
    }
  }, [authSession]);

  useEffect(() => {
    setFormValues((prev) => ({
      ...prev,
      firstName: profileData.firstName || prev.firstName,
      lastName: profileData.lastName || prev.lastName,
      phone: profileData.phone || prev.phone,
    }));
  }, [profileData.firstName, profileData.lastName, profileData.phone]);

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
    const trimmedPhone = formValues.phone.trim();
    const wantsPasswordChange = Boolean(formValues.newPassword);
    if (wantsPasswordChange && !formValues.currentPassword) {
      setStatusType("error");
      setStatusMessage("Enter your current password to set a new one.");
      return;
    }
    const profilePayload = {};
    const normalizedFirst = (profileData.firstName || "").trim();
    const normalizedLast = (profileData.lastName || "").trim();
    const normalizedPhone = profileData.phone ?? "";
    if (trimmedFirst && trimmedFirst !== normalizedFirst) {
      profilePayload.first_name = trimmedFirst;
    }
    if (trimmedLast && trimmedLast !== normalizedLast) {
      profilePayload.last_name = trimmedLast;
    }
    if (trimmedPhone !== normalizedPhone) {
      profilePayload.phone = trimmedPhone;
    }
    const wantsProfileUpdate = Object.keys(profilePayload).length > 0;
    if (!wantsProfileUpdate && !wantsPasswordChange) {
      setStatusType("info");
      setStatusMessage("There is nothing to update yet.");
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage("");
      const pending = [];
      let profileUpdated = false;
      let passwordUpdated = false;

      if (wantsProfileUpdate) {
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
      if (profileUpdated) {
        setProfileData((prev) => ({
          ...prev,
          ...(profilePayload.first_name !== undefined
            ? { firstName: profilePayload.first_name }
            : {}),
          ...(profilePayload.last_name !== undefined
            ? { lastName: profilePayload.last_name }
            : {}),
          ...(profilePayload.phone !== undefined
            ? { phone: profilePayload.phone }
            : {}),
        }));
      }
      setFormValues((prev) => ({
        ...prev,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: trimmedPhone,
        currentPassword: "",
        newPassword: "",
      }));
      setIsEditing(false);
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
        {statusMessage && (
          <p
            className={
              statusType === "error" ? styles.errorMessage : styles.successMessage
            }
          >
            {statusMessage}
          </p>
        )}

        {isEditing ? (
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                placeholder="Phone number"
                autoComplete="tel"
                disabled={submitting}
              />
            </label>

            <label className={styles.field}>
              <span>Current password</span>
              <input
                type="password"
                name="currentPassword"
                value={formValues.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={submitting}
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
                disabled={submitting}
              />
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setIsEditing(false);
                  setStatusMessage("");
                  setFormValues((prev) => ({
                    ...prev,
                    firstName: profileData.firstName || "",
                    lastName: profileData.lastName || "",
                    phone: profileData.phone || "",
                    currentPassword: "",
                    newPassword: "",
                  }));
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <section className={styles.summary}>
            <div>
              <h2>Profile overview</h2>
              <p className={styles.summaryIntro}>
                Review your current information before making updates.
              </p>
            </div>
            <ul className={styles.summaryList}>
              <li className={styles.summaryItem}>
                <p className={styles.summaryLabel}>First name</p>
                <p className={styles.summaryValue}>
                  {profileData.firstName || "—"}
                </p>
              </li>
              <li className={styles.summaryItem}>
                <p className={styles.summaryLabel}>Last name</p>
                <p className={styles.summaryValue}>
                  {profileData.lastName || "—"}
                </p>
              </li>
              <li className={styles.summaryItem}>
                <p className={styles.summaryLabel}>Phone</p>
                <p className={styles.summaryValue}>
                  {profileData.phone || "Not provided"}
                </p>
              </li>
              <li className={styles.summaryItem}>
                <p className={styles.summaryLabel}>Email</p>
                <p className={styles.summaryValue}>
                  {profileData.email || "—"}
                </p>
              </li>
            </ul>
            <div className={styles.summaryActions}>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={() => {
                  setIsEditing(true);
                  setStatusMessage("");
                }}
              >
                Update profile
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default AccountSettings;
