import { useEffect, useMemo, useState } from "react";
import styles from "./AdminInvoices.module.css";
import {
  adminListInvoices,
  adminMarkInvoicePaid,
  adminVoidInvoice,
  adminRunOverdueJob,
} from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";

const statusOptions = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

function formatCurrency(amount, currency = "USD") {
  if (amount === undefined || amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

function AdminInvoices() {
  const accessToken = useAuthToken();
  const [filters, setFilters] = useState({ status: "unpaid", userId: "", loanId: "" });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [jobRunning, setJobRunning] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadInvoices() {
      try {
        setLoading(true);
        setFeedback({ type: "", message: "" });
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.userId.trim()) params.user_id = filters.userId.trim();
        if (filters.loanId.trim()) params.loan_id = filters.loanId.trim();
        const payload = await adminListInvoices(params, accessToken);
        if (!ignore) {
          const items = Array.isArray(payload) ? payload : payload.items ?? [];
          setInvoices(items);
        }
      } catch (error) {
        if (!ignore) {
          setFeedback({ type: "error", message: error.message });
          setInvoices([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInvoices();
    return () => {
      ignore = true;
    };
  }, [filters, accessToken, refreshKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await adminMarkInvoicePaid(invoiceId, accessToken);
      setFeedback({ type: "success", message: "Invoice marked as paid." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    }
  };

  const handleVoid = async (invoiceId) => {
    try {
      await adminVoidInvoice(invoiceId, accessToken);
      setFeedback({ type: "success", message: "Invoice voided." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    }
  };

  const handleRunJob = async () => {
    try {
      setJobRunning(true);
      await adminRunOverdueJob(accessToken);
      setFeedback({ type: "success", message: "Overdue job triggered. Refreshing data." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setJobRunning(false);
    }
  };

  const columns = useMemo(
    () => [
      "Invoice #",
      "User",
      "Loan",
      "Type",
      "Amount",
      "Status",
      "Issued",
      "Paid",
      "Actions",
    ],
    []
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Invoices & overdue fees</p>
          <h2>Track unpaid balances</h2>
        </div>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={handleRunJob}
          disabled={jobRunning}
        >
          {jobRunning ? "Running job…" : "Run overdue job"}
        </button>
      </header>

      <div className={styles.filters}>
        <label>
          <span>Status</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>User ID</span>
          <input
            type="text"
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
            placeholder="123"
          />
        </label>
        <label>
          <span>Loan ID</span>
          <input
            type="text"
            name="loanId"
            value={filters.loanId}
            onChange={handleFilterChange}
            placeholder="456"
          />
        </label>
      </div>

      {feedback.message && (
        <p
          className={
            feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess
          }
          role={feedback.type === "error" ? "alert" : undefined}
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
            {invoices.map((invoice) => {
              const statusValue = (invoice.status || "").toString();
              const statusKey = statusValue
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");
              return (
                <tr key={invoice.invoice_id}>
                  <td>{invoice.invoice_id}</td>
                  <td>{invoice.user?.email || invoice.user_id}</td>
                  <td>{invoice.loan_id ?? "—"}</td>
                  <td>{invoice.type || invoice.invoice_type || "—"}</td>
                  <td>{formatCurrency(invoice.amount, invoice.currency)}</td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${
                        styles[`status-${statusKey}`] || ""
                      }`}
                    >
                      {statusValue ? statusValue.replace(/_/g, " ") : "—"}
                    </span>
                  </td>
                  <td>
                    {invoice.issued_at
                      ? new Date(invoice.issued_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {invoice.paid_at
                      ? new Date(invoice.paid_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        disabled={invoice.status === "paid" || loading}
                        onClick={() => handleMarkPaid(invoice.invoice_id)}
                      >
                        Mark paid
                      </button>
                      <button
                        type="button"
                        className={styles.linkButton}
                        disabled={invoice.status === "void" || loading}
                        onClick={() => handleVoid(invoice.invoice_id)}
                      >
                        Void
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  No invoices match the filters yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  Loading invoices…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminInvoices;
