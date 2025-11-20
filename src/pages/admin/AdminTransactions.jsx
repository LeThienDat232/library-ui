import { useCallback, useEffect, useState } from "react";
import styles from "./AdminTransactions.module.css";
import { adminListTransactions } from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";

const typeOptions = [
  { value: "", label: "Any type" },
  { value: "payment", label: "Payment" },
  { value: "refund", label: "Refund" },
];

function AdminTransactions() {
  const accessToken = useAuthToken();
  const [filters, setFilters] = useState({
    type: "",
    userId: "",
    invoiceId: "",
    fromDate: "",
    toDate: "",
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const notifyAuthError = useCallback(
    (message) => setFeedback({ type: "error", message }),
    []
  );
  const handleAuthError = useAdminApiError(notifyAuthError);

  useEffect(() => {
    let ignore = false;
    async function loadTransactions() {
      try {
        setLoading(true);
        setFeedback({ type: "", message: "" });
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.userId.trim()) params.user_id = filters.userId.trim();
        if (filters.invoiceId.trim()) params.invoice_id = filters.invoiceId.trim();
        if (filters.fromDate) params.from = filters.fromDate;
        if (filters.toDate) params.to = filters.toDate;
        const payload = await adminListTransactions(params, accessToken);
        if (!ignore) {
          setTransactions(payload.rows);
        }
      } catch (err) {
        if (!ignore) {
          if (!handleAuthError(err)) {
            setTransactions([]);
            setFeedback({ type: "error", message: err.message ?? "Unable to load transactions." });
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTransactions();
    return () => {
      ignore = true;
    };
  }, [filters, accessToken, handleAuthError]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Transactions log</p>
        <h2>Audit payment activity</h2>
      </header>

      <div className={styles.filters}>
        <label>
          <span>Type</span>
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            {typeOptions.map((option) => (
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
          <span>Invoice ID</span>
          <input
            type="text"
            name="invoiceId"
            value={filters.invoiceId}
            onChange={handleFilterChange}
            placeholder="789"
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

      {feedback.message && (
        <p className={styles.error} role="alert">
          {feedback.message}
        </p>
      )}

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Txn #</th>
              <th>Type</th>
              <th>Provider</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Invoice</th>
              <th>User</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              const statusValue = (txn.status || "").toString();
              const statusKey = statusValue
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");
              return (
                <tr key={txn.txn_id ?? txn.transaction_id ?? txn.id}>
                  <td>{txn.txn_id ?? txn.transaction_id ?? txn.id ?? "—"}</td>
                  <td>{txn.type || "—"}</td>
                  <td>{txn.provider || "—"}</td>
                  <td>
                    {txn.amount_vnd
                      ? `${txn.amount_vnd} ${txn.currency ?? "VND"}`
                      : txn.amount
                      ? `${txn.amount} ${txn.currency ?? ""}`.trim()
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${
                        styles[`status-${statusKey}`] || ""
                      }`}
                    >
                      {statusValue ? statusValue.replace(/_/g, " ") : "—"}
                    </span>
                  </td>
                  <td>{txn.ref || txn.reference || txn.external_id || "—"}</td>
                  <td>{txn.invoice_id ?? "—"}</td>
                  <td>{txn.user?.email || txn.user_id || "—"}</td>
                  <td>
                    {txn.created_at
                      ? new Date(txn.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan="9" className={styles.emptyCell}>
                  No transactions yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="9" className={styles.emptyCell}>
                  Loading transactions…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminTransactions;
