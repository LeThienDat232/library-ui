import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./AdminUsers.module.css";
import {
  adminDeleteUser,
  adminListUsers,
  adminUpdateUser,
} from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";

const initialFilters = { search: "" };

function formatDate(value) {
  if (!value) return "—";
  try {
    const formatted = new Date(value);
    if (Number.isNaN(formatted.getTime())) {
      return typeof value === "string" ? value : "—";
    }
    return formatted.toLocaleDateString();
  } catch {
    return typeof value === "string" ? value : "—";
  }
}

function normalizeUserRow(raw) {
  if (!raw) return null;
  const id =
    raw.user_id ??
    raw.userId ??
    raw.id ??
    raw.account_id ??
    raw.accountId ??
    raw.email ??
    raw.username ??
    null;
  if (!id) return null;
  const firstName = raw.first_name ?? raw.firstName ?? "";
  const lastName = raw.last_name ?? raw.lastName ?? "";
  const fallbackName =
    raw.full_name ?? raw.name ?? raw.username ?? raw.email ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || fallbackName || "Member";
  const email = raw.email || raw.contact || raw.username || "—";
  const phone =
    raw.phone ||
    raw.phone_number ||
    raw.phoneNumber ||
    raw.contact_number ||
    raw.contactNumber ||
    "";
  const roleValue =
    raw.role ||
    raw.role_name ||
    raw.roleName ||
    raw.type ||
    raw.user_role ||
    raw.userRole ||
    "user";
  const roleKey = roleValue.toString().toLowerCase();
  const role =
    roleKey === "member" || roleKey === "reader" || roleKey === "borrower"
      ? "user"
      : roleKey;
  const statusValue =
    raw.status ||
    raw.account_status ||
    raw.accountStatus ||
    (raw.disabled || raw.is_disabled
      ? "disabled"
      : raw.active === false
        ? "disabled"
        : "active");
  const statusKey = statusValue.toString().toLowerCase();
  const statusLabel = statusKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const isActive = !/inactive|disabled|blocked|suspended/.test(statusKey);
  const loans =
    raw.active_loans ??
    raw.activeLoans ??
    raw.loan_count ??
    raw.loanCount ??
    raw.loans_count ??
    raw.loansCount ??
    raw.borrowed_books ??
    raw.open_loans ??
    raw.openLoans ??
    0;
  const joinedAt =
    raw.created_at ||
    raw.createdAt ||
    raw.joined_at ||
    raw.joinedAt ||
    raw.registration_date ||
    raw.registered_at ||
    raw.registeredAt ||
    null;
  const lastActive =
    raw.last_login ||
    raw.lastLogin ||
    raw.last_active ||
    raw.lastActive ||
    raw.lastActivity ||
    raw.last_seen ||
    raw.lastSeen ||
    raw.activity_at ||
    raw.activityAt ||
    raw.updated_at ||
    raw.updatedAt ||
    null;
  return {
    id: id.toString(),
    fullName,
    email,
    phone,
    role,
    statusKey,
    statusLabel,
    isActive,
    loansCount: Number.isFinite(Number(loans)) ? Number(loans) : 0,
    joinedAt,
    lastActive,
  };
}

function AdminUsers() {
  const accessToken = useAuthToken();
  const [filters, setFilters] = useState(initialFilters);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const notifyAuth = useCallback(
    (message) => setFeedback({ type: "error", message }),
    []
  );
  const handleAuthError = useAdminApiError(notifyAuth);

  useEffect(() => {
    let ignore = false;
    async function loadUsers() {
      try {
        setLoading(true);
        setFeedback({ type: "", message: "" });
        const params = { limit: 50 };
        if (filters.search.trim()) {
          params.search = filters.search.trim();
        }
        const payload = await adminListUsers(params, accessToken);
        if (!ignore) {
          setUsers(payload.rows || []);
        }
      } catch (error) {
        if (!ignore && !handleAuthError(error)) {
          setUsers([]);
          setFeedback({ type: "error", message: error.message });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadUsers();
    return () => {
      ignore = true;
    };
  }, [filters, accessToken, refreshKey, handleAuthError]);

  const normalizedUsers = useMemo(
    () => users.map(normalizeUserRow).filter(Boolean),
    [users]
  );

  const stats = useMemo(() => {
    const total = normalizedUsers.length;
    const active = normalizedUsers.filter((user) => user.isActive).length;
    const admins = normalizedUsers.filter((user) => user.role === "admin").length;
    return { total, active, inactive: total - active, admins };
  }, [normalizedUsers]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPassword = async (user) => {
    if (!user) return;
    if (typeof window === "undefined") {
      setFeedback({
        type: "error",
        message: "Reset password is not available in this environment.",
      });
      return;
    }
    const rawPassword = window.prompt(
      `Enter a new password for ${user.fullName} (at least 6 characters):`,
      ""
    );
    if (rawPassword === null) {
      return;
    }
    const trimmedPassword = rawPassword.trim();
    if (trimmedPassword.length < 6) {
      setFeedback({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }
    try {
      setUpdatingUserId(user.id);
      await adminUpdateUser(
        user.id,
        { password: trimmedPassword },
        accessToken
      );
      setFeedback({
        type: "success",
        message: "Password reset successfully.",
      });
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete ${user.fullName || user.email}? This cannot be undone.`
      );
      if (!confirmed) {
        return;
      }
    }
    try {
      setUpdatingUserId(user.id);
      await adminDeleteUser(user.id, accessToken);
      setFeedback({ type: "success", message: "User deleted." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const columns = useMemo(
    () => [
      "User",
      "Role",
      "Loans",
      "Status",
      "Joined",
      "Last active",
      "Actions",
    ],
    []
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Accounts & permissions</p>
          <h2>Manage users</h2>
          <p className={styles.subtitle}>
            Review active borrowers, update permissions, and monitor who still has
            outstanding loans.
          </p>
        </div>
      </header>

      <div className={styles.filters}>
        <label>
          <span>Search</span>
          <input
            type="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Name, email, or phone"
          />
        </label>
      </div>

      <div className={styles.metricsRow}>
        <div>
          <p className={styles.metricLabel}>Active users</p>
          <p className={styles.metricValue}>{stats.active}</p>
        </div>
        <div>
          <p className={styles.metricLabel}>Admins & librarians</p>
          <p className={styles.metricValue}>{stats.admins}</p>
        </div>
        <div>
          <p className={styles.metricLabel}>Accounts loaded</p>
          <p className={styles.metricValue}>{stats.total}</p>
        </div>
      </div>

      {feedback.message && (
        <p
          className={
            feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess
          }
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <p className={styles.primaryText}>{user.fullName}</p>
                  <p className={styles.subText}>{user.email}</p>
                  {user.phone && <p className={styles.subText}>{user.phone}</p>}
                </td>
                <td>
                  <span className={styles.roleTag}>
                    {user.role === "admin" ? "Admin" : "Member"}
                  </span>
                </td>
                <td>{user.loansCount}</td>
                <td>
                  <span
                    className={`${styles.statusPill} ${
                      styles[`status-${user.statusKey}`] || ""
                    }`}
                  >
                    {user.statusLabel}
                  </span>
                </td>
                <td>{formatDate(user.joinedAt)}</td>
                <td>{formatDate(user.lastActive)}</td>
                <td>
                  <div className={styles.actionsColumn}>
                    <button
                      type="button"
                      className={`${styles.secondaryBtn} ${styles.wideBtn}`}
                      onClick={() => handleResetPassword(user)}
                      disabled={updatingUserId === user.id}
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => handleDeleteUser(user)}
                      disabled={updatingUserId === user.id}
                    >
                      Delete user
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && normalizedUsers.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  No users match the filters yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  Loading users…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminUsers;
