import { useCallback, useMemo, useState } from "react";
import styles from "./AdminCirculation.module.css";
import {
  adminScan,
  adminConfirmLoan,
  adminReturnLoan,
  adminRenewLoan,
  adminCancelLoan,
} from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";
import { fetchLoanById, fetchBookById } from "../../api/library.js";

function AdminCirculation() {
  const [tokenInput, setTokenInput] = useState("");
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionState, setActionState] = useState({ type: "info", message: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [lastToken, setLastToken] = useState("");
  const accessToken = useAuthToken();
  const handleAuthError = useAdminApiError(
    useCallback(
      (message) => setActionState({ type: "error", message }),
      []
    )
  );

  const enrichLoanItems = useCallback(async (rawLoan) => {
    if (!rawLoan) return rawLoan;
    const list = rawLoan.books || rawLoan.items || rawLoan.loan_items;
    if (!Array.isArray(list) || list.length === 0) {
      return rawLoan;
    }
    const needsLookup = list.some(
      (item) => item?.book_id && !item.title && !item.book?.title
    );
    if (!needsLookup) {
      return rawLoan;
    }
    const hydratedItems = await Promise.all(
      list.map(async (item) => {
        if (!item?.book_id || item.title || item.book?.title) {
          return item;
        }
        try {
          const bookDetails = await fetchBookById(item.book_id);
          return {
            ...item,
            book: bookDetails,
            title: item.title ?? bookDetails.title,
            author: item.author ?? bookDetails.author,
          };
        } catch {
          return item;
        }
      })
    );
    const nextLoan = { ...rawLoan };
    if (rawLoan.books) nextLoan.books = hydratedItems;
    if (rawLoan.items) nextLoan.items = hydratedItems;
    if (rawLoan.loan_items) nextLoan.loan_items = hydratedItems;
    return nextLoan;
  }, []);

  const performScan = useCallback(
    async (tokenValue) => {
      const trimmed = (tokenValue ?? tokenInput).trim();
      if (!trimmed) {
        setActionState({
          type: "error",
          message: "Enter a QR token, code, or loan ID first.",
        });
        setLoan(null);
        return;
      }
      const numericLoanId = /^\d+$/.test(trimmed)
        ? Number.parseInt(trimmed, 10)
        : null;
      try {
        setLoading(true);
        setActionState({ type: "info", message: "" });
        const payload = numericLoanId
          ? await fetchLoanById(numericLoanId, accessToken)
          : await adminScan(trimmed, accessToken);
        const normalizedLoan = payload.loan ?? payload;
        const hydratedLoan = await enrichLoanItems(normalizedLoan);
        setLoan(hydratedLoan);
        setLastToken(trimmed);
      } catch (error) {
        setLoan(null);
        if (!handleAuthError(error)) {
          setActionState({ type: "error", message: error.message });
        }
      } finally {
        setLoading(false);
      }
    },
    [accessToken, tokenInput, handleAuthError, enrichLoanItems]
  );

  const handleScanSubmit = async (event) => {
    event.preventDefault();
    await performScan(tokenInput);
  };

  const handleLoanAction = useCallback(
    async (action) => {
      if (!loan?.loan_id) return;
      try {
        setActionLoading(true);
        setActionState({ type: "info", message: "Working on it…" });
        if (action === "confirm") {
          await adminConfirmLoan(loan.loan_id, accessToken);
          setActionState({ type: "success", message: "Loan confirmed." });
        } else if (action === "return") {
          await adminReturnLoan(loan.loan_id, accessToken);
          setActionState({ type: "success", message: "Items returned." });
        } else if (action === "renew") {
          await adminRenewLoan(loan.loan_id, accessToken);
          setActionState({ type: "success", message: "Loan renewed." });
        } else if (action === "cancel") {
          await adminCancelLoan(loan.loan_id, accessToken);
          setActionState({ type: "success", message: "Loan cancelled." });
        }
        const refetchToken = loan.ticket_token || loan.loan_code || loan.token || lastToken;
        if (refetchToken) {
          await performScan(refetchToken);
        }
      } catch (error) {
        if (!handleAuthError(error)) {
          setActionState({ type: "error", message: error.message });
        }
      } finally {
        setActionLoading(false);
      }
    },
    [loan, accessToken, performScan, lastToken, handleAuthError]
  );

  const status = useMemo(() => {
    if (!loan) return null;
    const raw = (
      loan.status || loan.loan_status || loan.state || loan.stage || ""
    )
      .toString()
      .toLowerCase();
    const label = raw ? raw.replace(/_/g, " ") : "Unknown";
    const pending = raw === "pending";
    const borrowed = raw === "borrowed" || raw === "checked_out";
    const overdue = raw.includes("overdue");
    const classKey = raw.replace(/[^a-z0-9]+/g, "-");
    return { raw, label, pending, borrowed, overdue, classKey };
  }, [loan]);

  const loanBooks = useMemo(() => {
    if (!loan) return [];
    const data = loan.books || loan.items || loan.loan_items || [];
    return Array.isArray(data) ? data : [];
  }, [loan]);

  const dueDate = useMemo(() => {
    if (!loan) return null;
    const dateValue = loan.due_date || loan.dueDate || loan.due_at || loan.dueAt;
    if (!dateValue) return null;
    try {
      return new Date(dateValue).toLocaleString();
    } catch {
      return dateValue;
    }
  }, [loan]);

  const borrower =
    loan?.user ||
    loan?.member ||
    loan?.borrower ||
    (loan?.user_id
      ? { name: `User #${loan.user_id}`, email: loan?.user_email || "" }
      : null);
  const renewCount = loan?.renew_count ?? loan?.renewals ?? loan?.renewal_count ?? 0;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Circulation desk</p>
          <h2>Scan tickets and manage loans</h2>
          <p>Paste or scan a QR token from the borrower&apos;s ticket.</p>
        </div>
      </header>

      <form className={styles.scanForm} onSubmit={handleScanSubmit}>
        <label className={styles.field}>
          <span>QR token or loan ID</span>
          <input
            type="text"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="EX: 13 or loan_9fd8c..."
            disabled={loading || actionLoading}
          />
        </label>
        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {actionState.message && (
        <p
          className={
            actionState.type === "error"
              ? styles.statusMessageError
              : styles.statusMessage
          }
          role={actionState.type === "error" ? "alert" : undefined}
        >
          {actionState.message}
        </p>
      )}

      {loan ? (
        <article className={styles.loanCard}>
          <header className={styles.loanHeader}>
            <div>
              <p className={styles.loanLabel}>Borrower</p>
              <h3>{borrower?.name || borrower?.full_name || borrower?.email || "Unknown"}</h3>
              <p className={styles.borrowerMeta}>{borrower?.email || borrower?.phone}</p>
            </div>
            {status && (
              <span
                className={`${styles.statusPill} ${
                  styles[`status-${status.classKey}`] || ""
                }`}
              >
                {status.label}
              </span>
            )}
          </header>

          <div className={styles.loanMetaGrid}>
            <div>
              <p className={styles.metaLabel}>Loan ID</p>
              <p className={styles.metaValue}>{loan.loan_id}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Due date</p>
              <p className={styles.metaValue}>{dueDate || "Not set"}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Renewals</p>
              <p className={styles.metaValue}>{renewCount}</p>
            </div>
          </div>

          <section>
            <p className={styles.metaLabel}>Items</p>
            <ul className={styles.bookList}>
              {loanBooks.map((item) => (
                <li key={item.book_id || item.loan_item_id || item.id}>
                  <p className={styles.bookTitle}>{item.title || item.book?.title}</p>
                  <p className={styles.bookSubtitle}>{item.author || item.book?.author}</p>
                </li>
              ))}
              {loanBooks.length === 0 && <li>No items linked to this loan yet.</li>}
            </ul>
          </section>

          <div className={styles.actions}>
            {status?.pending && (
              <>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => handleLoanAction("confirm")}
                  disabled={actionLoading}
                >
                  Confirm borrow
                </button>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={() => handleLoanAction("cancel")}
                  disabled={actionLoading}
                >
                  Cancel loan
                </button>
              </>
            )}

            {(status?.borrowed || status?.overdue) && (
              <>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => handleLoanAction("return")}
                  disabled={actionLoading}
                >
                  Mark returned
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => handleLoanAction("renew")}
                  disabled={actionLoading}
                >
                  Renew loan
                </button>
              </>
            )}
          </div>
        </article>
      ) : (
        <div className={styles.placeholder}>
          <p>Scan a ticket to see borrower details and actions.</p>
        </div>
      )}
    </section>
  );
}

export default AdminCirculation;
