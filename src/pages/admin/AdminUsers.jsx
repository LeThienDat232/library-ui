import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./AdminUsers.module.css";
import { adminListUsers, adminUpdateUser } from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";

const roleOptions = [
  { value: "member", label: "Member" },
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

const statusFilterOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "disabled", label: "Disabled" },
  { value: "suspended", label: "Suspended" },
];

const roleFilterOptions = [{ value: "", label: "All roles" }, ...roleOptions];

const initialFilters = { search: "", status: "", role: "" };

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
    raw.id ??
    raw.account_id ??
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
    "";
  const roleValue =
    raw.role ||
    raw.role_name ||
    raw.roleName ||
    raw.type ||
    raw.user_role ||
    "member";
  const role = roleValue.toString().toLowerCase();
  const statusValue =
    raw.status ||
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
    raw.loan_count ??
    raw.loans_count ??
    raw.borrowed_books ??
    0;
  const joinedAt =
    raw.created_at ||
    raw.createdAt ||
    raw.joined_at ||
    raw.joinedAt ||
    null;
  const lastActive =
    raw.last_login ||
    raw.last_active ||
    raw.lastActivity ||
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
        if (filters.role) {
          params.role = filters.role;
        }
        if (filters.status) {
          params.status = filters.status;
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
    const admins = normalizedUsers.filter(
      (user) => user.role === "admin" || user.role === "librarian"
    ).length;
    return { total, active, inactive: total - active, admins };
  }, [normalizedUsers]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = async (user, nextRole) => {
    if (!user || !nextRole || user.role === nextRole) return;
    try {
      setUpdatingUserId(user.id);
      await adminUpdateUser(
        user.id,
        {
          role: nextRole,
          role_name: nextRole,
          roleName: nextRole,
          user_role: nextRole,
        },
        accessToken
      );
      setFeedback({ type: "success", message: "Role updated." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user) return;
    const enabling = !user.isActive;
    const payload = enabling
      ? { status: "active", disabled: false, active: true, is_active: true }
      : { status: "disabled", disabled: true, active: false, is_active: false };
    try {
      setUpdatingUserId(user.id);
      await adminUpdateUser(user.id, payload, accessToken);
      setFeedback({
        type: "success",
        message: enabling ? "User activated." : "User disabled.",
      });
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
        <label>
          <span>Status</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Role</span>
          <select name="role" value={filters.role} onChange={handleFilterChange}>
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
                  <select
                    className={styles.roleSelect}
                    value={user.role}
                    disabled={updatingUserId === user.id}
                    onChange={(event) => handleRoleChange(user, event.target.value)}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                  <button
                    type="button"
                    className={
                      user.isActive
                        ? styles.dangerBtn
                        : `${styles.secondaryBtn} ${styles.wideBtn}`
                    }
                    onClick={() => handleToggleStatus(user)}
                    disabled={updatingUserId === user.id}
                  >
                    {user.isActive ? "Disable" : "Activate"}
                  </button>
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
