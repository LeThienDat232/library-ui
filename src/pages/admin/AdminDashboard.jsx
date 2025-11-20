import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";
import { useAuth, useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";
import {
  adminListInvoices,
  adminListReviews,
  adminListTransactions,
  adminListBooks,
} from "../../api/admin";

const quickActions = [
  { label: "Circulation desk", description: "Scan tickets & confirm", path: "/admin/circulation" },
  { label: "Invoices", description: "Track overdue fees", path: "/admin/invoices" },
  { label: "Transactions", description: "Audit payments", path: "/admin/transactions" },
  { label: "Reviews", description: "Moderate community", path: "/admin/reviews" },
  { label: "Books", description: "Maintain catalog", path: "/admin/books" },
];

function formatCurrency(value, currency = "VND") {
  if (value === undefined || value === null || value === "") return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${value} ${currency ?? "VND"}`.trim();
  }
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const accessToken = useAuthToken();
  const [stats, setStats] = useState({
    invoices: null,
    reviews: null,
    books: null,
    transactions: [],
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const handleAuthError = useAdminApiError(
    useCallback((message) => setFeedback(message), [])
  );
  const firstName = useMemo(() => {
    if (!user) return "there";
    return user.firstName || user.first_name || user.name || "there";
  }, [user]);

  const statCards = useMemo(
    () => [
      {
        label: "Unpaid invoices",
        value: stats.invoices ?? "—",
        tone: (stats.invoices ?? 0) > 0 ? "warning" : "positive",
        detail:
          stats.invoices === null
            ? "Syncing data…"
            : stats.invoices === 0
            ? "All caught up"
            : "Needs attention",
      },
      {
        label: "Pending reviews",
        value: stats.reviews ?? "—",
        tone: (stats.reviews ?? 0) > 0 ? "warning" : "positive",
        detail:
          stats.reviews === null
            ? "Syncing data…"
            : stats.reviews === 0
            ? "Nothing queued"
            : "Moderation queue",
      },
      {
        label: "Recent transactions",
        value: stats.transactions.length,
        tone: "neutral",
        detail: stats.transactions.length ? "Last refresh" : "No activity",
      },
      {
        label: "Catalog titles",
        value: stats.books ?? "—",
        tone: "neutral",
        detail: stats.books === null ? "Syncing data…" : "Admin results",
      },
    ],
    [stats]
  );

  const timelineEvents = useMemo(() => {
    return (stats.transactions || []).slice(0, 4).map((txn) => {
      const timestamp = txn.created_at
        ? new Date(txn.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
      const amountText =
        txn.amount_vnd ?? txn.amount
          ? formatCurrency(txn.amount_vnd ?? txn.amount, txn.currency ?? "VND")
          : "";
      const invoiceLabel = txn.invoice_id ? `Invoice #${txn.invoice_id}` : "No invoice linked";
      return {
        time: timestamp,
        title: txn.provider || txn.type || "Transaction",
        note: [txn.type ? txn.type.toUpperCase() : null, amountText, invoiceLabel]
          .filter(Boolean)
          .join(" • "),
      };
    });
  }, [stats.transactions]);

  const pendingInvoicesLabel =
    stats.invoices === null
      ? "Invoices snapshot"
      : `${stats.invoices} unpaid invoice${stats.invoices === 1 ? "" : "s"}`;
  const pendingInvoicesDescription =
    stats.invoices === null
      ? "Loading the latest balances from the API."
      : stats.invoices === 0
      ? "Everything is up to date."
      : "Focus on the newest overdue notices before running the job.";

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;
    async function loadDashboard() {
      try {
        setLoading(true);
        setFeedback("");
        const [invoicePayload, reviewPayload, transactionPayload, bookPayload] = await Promise.all(
          [
            adminListInvoices({ status: "unpaid", limit: 5 }, accessToken),
            adminListReviews({ status: "pending", limit: 5 }, accessToken),
            adminListTransactions({ limit: 5 }, accessToken),
            adminListBooks({ limit: 1 }, accessToken),
          ]
        );
        if (!ignore) {
          setStats({
            invoices: invoicePayload.count ?? invoicePayload.rows.length,
            reviews: reviewPayload.count ?? reviewPayload.rows.length,
            books: bookPayload.count ?? bookPayload.rows.length,
            transactions: transactionPayload.rows ?? [],
          });
        }
      } catch (error) {
        if (!ignore && !handleAuthError(error)) {
          setFeedback(error.message ?? "Unable to load dashboard data.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [accessToken, handleAuthError]);

  return (
    <section className={styles.page}>
      <div className={styles.heroShell}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Welcome back</p>
            <h2>Hi {firstName}, ready for today&apos;s shift?</h2>
            <p className={styles.subtitle}>
              Keep tabs on every desk from one place. Shortcuts, live stats, and timelines help you
              react to patrons faster.
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.heroBadge}>Live</span>
              <span>Syncs every 60 seconds</span>
            </div>
          </div>
          <div className={styles.heroHighlight}>
            <p className={styles.heroHighlightLabel}>Invoices</p>
            <h3>{pendingInvoicesLabel}</h3>
            <p>{pendingInvoicesDescription}</p>
            <button
              type="button"
              className={styles.heroHighlightBtn}
              onClick={() => navigate("/admin/invoices")}
            >
              Review invoices
            </button>
          </div>
        </header>
      </div>

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

      {feedback && (
        <p className={styles.feedback} role="alert">
          {feedback}
        </p>
      )}

      <section className={styles.statsGrid}>
        {statCards.map((card) => (
          <article key={card.label} className={styles.statsCard}>
            <p className={styles.statsLabel}>{card.label}</p>
            <div className={styles.statsValueRow}>
              <span className={styles.statsValue}>{card.value}</span>
              <span
                className={`${styles.statsDelta} ${
                  styles[`statsDelta${card.tone}`] || ""
                }`}
              >
                {card.detail}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.timelineRow}>
        <div className={styles.timelineSection}>
          <header className={styles.timelineHeader}>
            <div>
              <p className={styles.timelineEyebrow}>Today&apos;s activity</p>
              <h3>Recent transactions</h3>
            </div>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => navigate("/admin/transactions")}
            >
              View logs
            </button>
          </header>
          {loading && stats.transactions.length === 0 ? (
            <p className={styles.muted}>Syncing activity…</p>
          ) : timelineEvents.length > 0 ? (
            <ul className={styles.timelineList}>
              {timelineEvents.map((event, index) => (
                <li key={`${event.time}-${event.title}-${index}`}>
                  <div className={styles.timelineTime}>{event.time}</div>
                  <div className={styles.timelineDot} aria-hidden="true" />
                  <div>
                    <p className={styles.timelineTitle}>{event.title}</p>
                    <p className={styles.timelineNote}>{event.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>No recent transactions yet.</p>
          )}
        </div>

        <aside className={styles.spotlightCard}>
          <p className={styles.spotlightLabel}>Need a quick win?</p>
          <h3>Run overdue job</h3>
          <p>
            Trigger the automation and refresh the invoices list to show how fees move from unbilled
            to active status.
          </p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate("/admin/invoices")}
          >
            Open invoices
          </button>
        </aside>
      </section>
    </section>
  );
}

export default AdminDashboard;

