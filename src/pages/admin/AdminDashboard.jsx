import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";
import { useAuth } from "../../contexts/AuthContext.jsx";

const quickActions = [
  { label: "Circulation desk", description: "Scan tickets & confirm", path: "/admin/circulation" },
  { label: "Invoices", description: "Track overdue fees", path: "/admin/invoices" },
  { label: "Transactions", description: "Audit payments", path: "/admin/transactions" },
  { label: "Reviews", description: "Moderate community", path: "/admin/reviews" },
  { label: "Books", description: "Maintain catalog", path: "/admin/books" },
];

const onboardingChecklist = [
  "Connect a barcode or QR scanner to your circulation laptop.",
  "Walk through the scan flow with a mock loan to rehearse demo day.",
  "Record at least two overdue invoices so the overdue job is visible.",
  "Save borrower emails for quick copy/paste during presentations.",
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = useMemo(() => {
    if (!user) return "there";
    return user.firstName || user.first_name || user.name || "there";
  }, [user]);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Welcome back</p>
          <h2>Hi {firstName}, ready for today&apos;s shift?</h2>
          <p className={styles.subtitle}>
            Use the panels below to jump into the workflows you&apos;ll showcase during the
            defense. Everything is grouped so you can move quickly between demos.
          </p>
        </div>
        <div className={styles.heroCard}>
          <p className={styles.heroCardLabel}>Next steps</p>
          <ul>
            {onboardingChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </header>

      <section className={styles.quickGrid}>
        {quickActions.map((action) => (
          <button
            key={action.path}
            type="button"
            className={styles.quickCard}
            onClick={() => navigate(action.path)}
          >
            <div>
              <p className={styles.quickLabel}>{action.label}</p>
              <p className={styles.quickDescription}>{action.description}</p>
            </div>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </section>

      <section className={styles.statusGrid}>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>Today&apos;s loans</p>
          <h3>Live data via circulation desk</h3>
          <p>
            Head to Circulation to run the scan + confirm flow. This card is just a reminder of
            what to present first.
          </p>
        </article>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>Overdue fees</p>
          <h3>Use invoices panel</h3>
          <p>
            Filter unpaid invoices, mark one as paid, and run the overdue job to showcase the
            automation trigger.
          </p>
        </article>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>Community</p>
          <h3>Moderate reviews</h3>
          <p>
            Keep an eye on flagged content. Approve one review and hide another to prove both
            endpoints are wired.
          </p>
        </article>
      </section>
    </section>
  );
}

export default AdminDashboard;
