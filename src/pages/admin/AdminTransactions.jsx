import { useEffect, useState } from "react";
import styles from "./AdminTransactions.module.css";
import { adminListTransactions } from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const providerOptions = [
  { value: "", label: "Provider" },
  { value: "stripe", label: "Stripe" },
  { value: "manual", label: "Manual" },
  { value: "cash", label: "Cash" },
];

function AdminTransactions() {
  const accessToken = useAuthToken();
  const [filters, setFilters] = useState({
    status: "",
    provider: "",
    userId: "",
    invoiceId: "",
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.provider) params.provider = filters.provider;
        if (filters.userId.trim()) params.user_id = filters.userId.trim();
        if (filters.invoiceId.trim()) params.invoice_id = filters.invoiceId.trim();
        const payload = await adminListTransactions(params, accessToken);
        if (!ignore) {
          const items = Array.isArray(payload) ? payload : payload.items ?? [];
          setTransactions(items);
        }
      } catch (err) {
        if (!ignore) {
          setTransactions([]);
          setError(err.message ?? "Unable to load transactions.");
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
  }, [filters, accessToken]);

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
          <span>Provider</span>
          <select name="provider" value={filters.provider} onChange={handleFilterChange}>
            {providerOptions.map((option) => (
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
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
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
                <tr key={txn.transaction_id}>
                  <td>{txn.provider || "—"}</td>
                  <td>
                    {txn.amount ? `${txn.amount} ${txn.currency ?? ""}`.trim() : "—"}
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
                  <td>{txn.reference || txn.external_id || "—"}</td>
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
                <td colSpan="7" className={styles.emptyCell}>
                  No transactions yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="7" className={styles.emptyCell}>
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
