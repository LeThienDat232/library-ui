import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./AdminInvoices.module.css";
import {
  adminListInvoices,
  adminMarkInvoicePaid,
  adminVoidInvoice,
  adminRunOverdueJob,
} from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";

const statusOptions = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

const invoiceTypeOptions = [
  { value: "", label: "Any type" },
  { value: "overdue", label: "Overdue" },
  { value: "damage", label: "Damage" },
  { value: "lost", label: "Lost" },
];

const paymentProviderOptions = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "online", label: "Online portal" },
];

function formatCurrency(amount, currency = "VND") {
  if (amount === undefined || amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

function AdminInvoices() {
  const accessToken = useAuthToken();
  const [filters, setFilters] = useState({
    status: "unpaid",
    type: "",
    userId: "",
    loanId: "",
    fromDate: "",
    toDate: "",
  });
  const [invoices, setInvoices] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [jobRunning, setJobRunning] = useState(false);
  const [markPaidDialog, setMarkPaidDialog] = useState(null);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);
  const notifyAuthError = useCallback(
    (message) => setFeedback({ type: "error", message }),
    []
  );
  const handleAuthError = useAdminApiError(notifyAuthError);

  useEffect(() => {
    let ignore = false;
    async function loadInvoices() {
      try {
        setLoading(true);
        setFeedback({ type: "", message: "" });
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.type) params.type = filters.type;
        if (filters.userId.trim()) params.user_id = filters.userId.trim();
        if (filters.loanId.trim()) params.loan_id = filters.loanId.trim();
        if (filters.fromDate) params.from = filters.fromDate;
        if (filters.toDate) params.to = filters.toDate;
        const payload = await adminListInvoices(params, accessToken);
        if (!ignore) {
          setInvoices(payload.rows);
          setTotalCount(payload.count);
        }
      } catch (error) {
        if (!ignore) {
          if (!handleAuthError(error)) {
            setFeedback({ type: "error", message: error.message });
            setInvoices([]);
          }
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
  }, [filters, accessToken, refreshKey, handleAuthError]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkPaidClick = (invoice) => {
    setMarkPaidDialog({
      invoice,
      provider: invoice?.payment_provider || "cash",
      reference: invoice?.payment_reference || "",
    });
  };

  const closeMarkPaidDialog = () => {
    setMarkPaidDialog(null);
    setDialogSubmitting(false);
  };

  const updateDialogField = (field, value) => {
    setMarkPaidDialog((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleMarkPaidSubmit = async () => {
    if (!markPaidDialog?.invoice) return;
    try {
      setDialogSubmitting(true);
      const payload = {
        provider: (markPaidDialog.provider || "cash").trim(),
      };
      const refValue = markPaidDialog.reference?.trim();
      if (refValue) {
        payload.ref = refValue;
        payload.reference = refValue;
      }
      await adminMarkInvoicePaid(
        markPaidDialog.invoice.invoice_id,
        payload,
        accessToken
      );
      setFeedback({ type: "success", message: "Invoice marked as paid." });
      closeMarkPaidDialog();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    } finally {
      setDialogSubmitting(false);
    }
  };

  const handleVoid = async (invoiceId) => {
    try {
      await adminVoidInvoice(invoiceId, accessToken);
      setFeedback({ type: "success", message: "Invoice voided." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    }
  };

  const handleRunJob = async () => {
    try {
      setJobRunning(true);
      await adminRunOverdueJob(accessToken);
      setFeedback({ type: "success", message: "Overdue job triggered. Refreshing data." });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
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
          <span>Type</span>
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            {invoiceTypeOptions.map((option) => (
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
        <label>
          <span>From date</span>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          <span>To date</span>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
          />
        </label>
      </div>

      {totalCount > 0 && (
        <p className={styles.totalCount}>Total invoices: {totalCount}</p>
      )}

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
                  <td>{invoice.user?.email || `User #${invoice.user_id}`}</td>
                  <td>{invoice.loan_id ?? "—"}</td>
                  <td>{invoice.type || invoice.invoice_type || "—"}</td>
                  <td>
                    {formatCurrency(
                      invoice.amount_vnd ?? invoice.amount,
                      invoice.currency ?? "VND"
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${styles[`status-${statusKey}`] || ""
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
                        onClick={() => handleMarkPaidClick(invoice)}
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

      {markPaidDialog && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalPanel}>
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalLabel}>
                  Invoice #{markPaidDialog.invoice.invoice_id}
                </p>
                <h3>Record payment</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                aria-label="Close"
                onClick={closeMarkPaidDialog}
                disabled={dialogSubmitting}
              >
                ×
              </button>
            </header>
            <p className={styles.modalSubtitle}>
              {markPaidDialog.invoice.user?.email ||
                `User #${markPaidDialog.invoice.user_id}`} owes
              {" "}
              {formatCurrency(
                markPaidDialog.invoice.amount_vnd ?? markPaidDialog.invoice.amount,
                markPaidDialog.invoice.currency ?? "VND"
              )}
              {markPaidDialog.invoice.loan_id
                ? ` for loan #${markPaidDialog.invoice.loan_id}.`
                : "."}
            </p>
            <div className={styles.modalGrid}>
              <label>
                <span>Payment method</span>
                <select
                  value={markPaidDialog.provider}
                  onChange={(event) => updateDialogField("provider", event.target.value)}
                  disabled={dialogSubmitting}
                >
                  {paymentProviderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Reference (optional)</span>
                <input
                  type="text"
                  placeholder="Receipt # / transaction id"
                  value={markPaidDialog.reference}
                  onChange={(event) => updateDialogField("reference", event.target.value)}
                  disabled={dialogSubmitting}
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondaryBtn}
                onClick={closeMarkPaidDialog}
                disabled={dialogSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={handleMarkPaidSubmit}
                disabled={dialogSubmitting || !markPaidDialog.provider}
              >
                {dialogSubmitting ? "Saving…" : "Confirm payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminInvoices;
