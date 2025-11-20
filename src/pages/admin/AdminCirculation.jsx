import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { fetchLoanById, fetchBookById } from "../../api/library.js";

function AdminCirculation() {
  const [tokenInput, setTokenInput] = useState("");
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionState, setActionState] = useState({ type: "info", message: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [lastToken, setLastToken] = useState("");
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const trackRef = useRef(null);
  const [isMirrored, setMirrored] = useState(false);
  const accessToken = useAuthToken();
  const handleAuthError = useAdminApiError(
    useCallback(
      (message) => setActionState({ type: "error", message }),
      []
    )
  );
  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.stopContinuousDecode?.();
      } catch {
        // ignore
      }
      try {
        readerRef.current.reset?.();
      } catch {
        // ignore
      }
      readerRef.current = null;
    }
    const stream = videoRef.current?.srcObject;
    if (stream && typeof stream.getTracks === "function") {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }
    trackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

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

  const parseScanInput = useCallback((rawValue) => {
    const trimmed = (rawValue ?? "").trim();
    if (!trimmed) {
      return {
        tokenValue: "",
        numericLoanId: null,
        shouldUseLoanId: false,
        displayValue: "",
      };
    }
    const initialIsNumeric = /^\d+$/.test(trimmed);
    let numericLoanId = initialIsNumeric
      ? Number.parseInt(trimmed, 10)
      : null;
    let tokenValue = initialIsNumeric ? "" : trimmed;
    let displayValue = trimmed;
    let inputWasUrl = false;
    let tokenFromUrl = false;
    let pathToken = "";

    try {
      const parsed = new URL(trimmed);
      inputWasUrl = true;
      const tokenParam =
        parsed.searchParams.get("token") ||
        parsed.searchParams.get("code") ||
        parsed.searchParams.get("ticket_token") ||
        parsed.searchParams.get("ticket") ||
        parsed.searchParams.get("qr_token");
      const loanParam =
        parsed.searchParams.get("loan_id") ||
        parsed.searchParams.get("loanId") ||
        parsed.searchParams.get("loan");

      if (loanParam && /^\d+$/.test(loanParam)) {
        numericLoanId = Number.parseInt(loanParam, 10);
        displayValue = loanParam.trim();
      }

      if (tokenParam) {
        tokenValue = tokenParam.trim();
        displayValue = tokenValue;
        tokenFromUrl = true;
      } else {
        const segments = parsed.pathname
          .split("/")
          .map((segment) => segment.trim())
          .filter(Boolean);
        for (let index = segments.length - 1; index >= 0; index -= 1) {
          const segment = decodeURIComponent(segments[index]);
          if (!segment || /pickup|loans?|qr/i.test(segment)) continue;
          if (segment.length < 6) continue;
          pathToken = segment;
          break;
        }
        if (pathToken) {
          tokenValue = pathToken;
          displayValue = pathToken;
          tokenFromUrl = true;
        } else if (inputWasUrl) {
          tokenValue = "";
        }
      }
    } catch {
      // not a URL; ignore
    }

    const shouldUseLoanId =
      numericLoanId !== null &&
      (initialIsNumeric || (inputWasUrl && !tokenFromUrl));

    return {
      tokenValue,
      numericLoanId,
      shouldUseLoanId,
      displayValue,
    };
  }, []);

  const performScan = useCallback(
    async (inputValue) => {
      const {
        tokenValue,
        numericLoanId,
        shouldUseLoanId,
        displayValue,
      } =
        parseScanInput(inputValue ?? tokenInput);
      if (!tokenValue && numericLoanId === null) {
        setActionState({
          type: "error",
          message: "Enter a QR token, code, or loan ID first.",
        });
        setLoan(null);
        return;
      }
      setTokenInput(displayValue);
      const repeatValue = shouldUseLoanId
        ? String(numericLoanId)
        : tokenValue || displayValue;
      try {
        setLoading(true);
        setActionState({ type: "info", message: "" });
        const payload = shouldUseLoanId
          ? await fetchLoanById(numericLoanId, accessToken)
          : await adminScan(tokenValue || displayValue, accessToken);
        const normalizedLoan = payload.loan ?? payload;
        const hydratedLoan = await enrichLoanItems(normalizedLoan);
        setLoan(hydratedLoan);
        setLastToken(repeatValue);
      } catch (error) {
        setLoan(null);
        if (!handleAuthError(error)) {
          const contextMessage = displayValue
            ? `${error.message} (value: ${displayValue})`
            : error.message;
          setActionState({ type: "error", message: contextMessage });
        }
      } finally {
        setLoading(false);
      }
    },
    [accessToken, tokenInput, handleAuthError, enrichLoanItems, parseScanInput]
  );

  useEffect(() => {
    if (!isScannerOpen) {
      return undefined;
    }
    if (!("mediaDevices" in navigator)) {
      setScannerError("Camera not supported in this browser.");
      return undefined;
    }
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setScannerError("");
    let stopped = false;
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment",
      },
    };
    reader
      .decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error, controls) => {
          if (controls?.stream) {
            const [track] = controls.stream.getVideoTracks();
            if (track) {
              trackRef.current = track;
              const facing = track.getSettings?.().facingMode;
              setMirrored(facing === "user");
            }
          }
          if (result && !stopped) {
            const text = result.getText?.() ?? "";
            if (import.meta.env?.DEV && text) {
              console.info("[circulation] decoded QR:", text);
            }
          if (text) {
            stopped = true;
            stopScanner();
            setTokenInput(text);
            setScannerOpen(false);
            performScan(text);
          }
        } else if (error && !(error instanceof NotFoundException)) {
          setScannerError(error.message ?? "Unable to read code.");
        }
      },
        constraints
      )
      .catch((error) => {
        setScannerError(error.message ?? "Unable to access camera.");
      });

    return () => {
      stopped = true;
      stopScanner();
    };
  }, [isScannerOpen, performScan, stopScanner]);

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
        <div className={styles.scanActions}>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "Scanning…" : "Scan"}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={loading || actionLoading}
            onClick={() => {
              if (!navigator.mediaDevices?.getUserMedia) {
                setScannerError("Camera not supported in this browser.");
                setScannerOpen(true);
                return;
              }
              setScannerError("");
              setScannerOpen(true);
            }}
          >
            Scan with camera
          </button>
        </div>
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
      {isScannerOpen && (
        <div className={styles.scannerOverlay} role="dialog" aria-modal="true">
          <div className={styles.scannerPanel}>
            <header className={styles.scannerHeader}>
              <div>
                <p className={styles.scannerLabel}>Camera scanner</p>
                <h3>Point at the QR token</h3>
              </div>
          <button
            type="button"
            className={styles.scannerClose}
            onClick={() => {
              stopScanner();
              setScannerOpen(false);
            }}
          >
            ×
          </button>
            </header>
            <div className={styles.scannerVideoWrapper}>
              <video
                ref={videoRef}
                className={`${styles.scannerVideo} ${
                  isMirrored ? styles.scannerVideoMirrored : ""
                }`}
                playsInline
                muted
                autoPlay
              />
              <div className={styles.scannerReticle} />
            </div>
            {scannerError && (
              <p className={styles.scannerError} role="alert">
                {scannerError}
              </p>
            )}
            <div className={styles.scannerControls}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  const track = trackRef.current;
                  if (
                    track &&
                    track.getCapabilities &&
                    track.getCapabilities().torch
                  ) {
                    const settings = track.getSettings?.() ?? {};
                    const current = Boolean(settings.torch);
                    track
                      .applyConstraints({ advanced: [{ torch: !current }] })
                      .catch(() => {
                        setScannerError("Unable to toggle flashlight on this device.");
                      });
                  } else {
                    setScannerError("Flashlight not supported on this camera.");
                  }
                }}
              >
                Toggle flashlight
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => {
                  stopScanner();
                  setScannerOpen(false);
                }}
              >
                Close scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminCirculation;
