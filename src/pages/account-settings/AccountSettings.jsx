import { useEffect, useState } from "react";
import styles from "./AccountSettings.module.css";

const PROFILE_ENDPOINT = "https://library-api-dicz.onrender.com/users/me";

function AccountSettings({ authSession }) {
  const [formValues, setFormValues] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    newPassword: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authSession?.user) {
      setFormValues((prev) => ({
        ...prev,
        displayName: authSession.user.displayName || prev.displayName,
        username: authSession.user.username || prev.username,
        email: authSession.user.email || prev.email,
      }));
    }
  }, [authSession]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!authSession?.token) {
      setStatusType("error");
      setStatusMessage("Bạn cần đăng nhập và mượn sách trước khi cập nhật hồ sơ.");
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage("");
      const response = await fetch(PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.token}`,
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || payload?.message || "Không thể cập nhật hồ sơ.";
        throw new Error(message);
      }

      setStatusType("success");
      setStatusMessage("Cập nhật tài khoản thành công.");
    } catch (error) {
      setStatusType("error");
      setStatusMessage(error.message ?? "Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div>
            <p className={styles.label}>Account</p>
            <h1>Manage your profile</h1>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Display name</span>
            <input
              type="text"
              name="displayName"
              value={formValues.displayName}
              onChange={handleChange}
              placeholder="Your display name"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Username</span>
            <input
              type="text"
              name="username"
              value={formValues.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </label>

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
