import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import styles from "./AdminLayout.module.css";
import { useAuth } from "../../contexts/AuthContext.jsx";

const navItems = [
  { to: "/admin", label: "Overview", description: "Snapshot", end: true },
  { to: "/admin/circulation", label: "Circulation", description: "Loans" },
  { to: "/admin/invoices", label: "Invoices", description: "Fees" },
  { to: "/admin/transactions", label: "Transactions", description: "Payments" },
  { to: "/admin/users", label: "Users", description: "Manage" },
  { to: "/admin/reviews", label: "Reviews", description: "Moderate" },
  { to: "/admin/books", label: "Books", description: "Catalog" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initials = useMemo(() => {
    if (!user) return "AD";
    const first = (user.firstName || user.first_name || user.name || "").trim();
    const last = (user.lastName || user.last_name || "").trim();
    const base = `${first ? first[0] : ""}${last ? last[0] : ""}`.trim();
    return base || (user.email ? user.email[0]?.toUpperCase() : "AD");
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) return "Admin";
    const first = user.firstName || user.first_name || "";
    const last = user.lastName || user.last_name || "";
    const composed = `${first} ${last}`.trim();
    return composed || user.email || user.username || "Admin";
  }, [user]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <div className={styles.badge}>WS</div>
          <div>
            <p className={styles.brandTitle}>Webshelf</p>
            <p className={styles.brandSubtitle}>Admin</p>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin sections">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
              }
            >
              <div>
                <p className={styles.navLabel}>{item.label}</p>
                <p className={styles.navDescription}>{item.description}</p>
              </div>
              <span aria-hidden="true">→</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.profileCard}>
          <div className={styles.profileAvatar}>{initials}</div>
          <div className={styles.profileMeta}>
            <p className={styles.profileName}>{fullName}</p>
            <p className={styles.profileRole}>Administrator</p>
          </div>
          <button
            type="button"
            className={styles.profileLogout}
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <section className={styles.body}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerEyebrow}>Library control center</p>
            <h1 className={styles.headerTitle}>Admin Console</h1>
          </div>
          <button
            type="button"
            className={styles.homeButton}
            onClick={() => navigate("/")}
          >
            ← Back to site
          </button>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </section>
    </div>
  );
}

export default AdminLayout;
