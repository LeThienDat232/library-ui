import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AccountPage.module.css";
import webshelfLogo from "./assets/webshelf-logo.png";
import {
  fetchCart,
  fetchLoanHistory,
  fetchLoans,
} from "../../../api/library.js";
import { useAuthToken } from "../../../contexts/AuthContext.jsx";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=400&q=60";
const RESERVED_STATUSES = new Set([
  "pending",
  "reserved",
  "awaiting_pickup",
  "ready_for_pickup",
]);
const ACTIVE_STATUSES = new Set([
  "borrowed",
  "borrowing",
  "active",
  "checked_out",
]);
const OVERDUE_STATUSES = new Set(["overdue", "late", "past_due"]);
const RETURNED_STATUSES = new Set([
  "returned",
  "completed",
  "closed",
  "history",
]);
const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "void"]);

function formatDate(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return typeof dateValue === "string" ? dateValue : null;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeCartResponse(payload) {
  const base = payload?.cart ?? payload ?? {};
  const itemsSource = Array.isArray(base.items)
    ? base.items
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(base.cart_items)
    ? base.cart_items
    : Array.isArray(payload?.cart_items)
    ? payload.cart_items
    : Array.isArray(base)
    ? base
    : Array.isArray(payload)
    ? payload
    : [];
  const items = itemsSource.map((item, index) => {
    const book = item.book || item.details || item.book_info || item;
    const bookId =
      item.book_id ??
      book?.book_id ??
      book?.id ??
      (typeof item.id === "string" ? item.id : null);
    return {
      id:
        item.cart_item_id ??
        item.id ??
        `${bookId ?? "cart"}-${index.toString(36)}`,
      bookId,
      title: book?.title ?? item.title ?? "Untitled book",
      author: book?.author ?? item.author ?? "Unknown author",
      cover:
        book?.cover ??
        book?.cover_url ??
        item.cover ??
        item.cover_url ??
        FALLBACK_COVER,
      qty: item.quantity ?? item.qty ?? 1,
      description: book?.description ?? item.description ?? "",
    };
  });
  const code =
    base.cart_code ||
    base.cartId ||
    base.cart_id ||
    base.code ||
    base.id ||
    payload?.cart_code ||
    payload?.code ||
    "";
  return { code, items };
}

function normalizeLoan(rawLoan, index = 0) {
  if (!rawLoan) return null;
  const itemsSource = Array.isArray(rawLoan.items)
    ? rawLoan.items
    : Array.isArray(rawLoan.books)
    ? rawLoan.books
    : Array.isArray(rawLoan.loan_items)
    ? rawLoan.loan_items
    : [];
  const items = itemsSource.map((item, itemIndex) => {
    const book = item.book || item.details || item.book_info || item;
    const bookId =
      item.book_id ?? book?.book_id ?? book?.id ?? item.id ?? itemIndex;
    return {
      id:
        item.loan_item_id ??
        item.id ??
        `${rawLoan.loan_id ?? rawLoan.id ?? "loan"}-${itemIndex}`,
      bookId,
      title: book?.title ?? item.title ?? "Untitled book",
      author: book?.author ?? item.author ?? "Unknown author",
      cover:
        book?.cover ??
        book?.cover_url ??
        item.cover ??
        item.cover_url ??
        FALLBACK_COVER,
      qty: item.quantity ?? item.qty ?? 1,
    };
  });
  const status =
    (
      rawLoan.status ||
      rawLoan.loan_status ||
      rawLoan.state ||
      rawLoan.stage ||
      ""
    )
      .toString()
      .toLowerCase() || "pending";
  const code =
    rawLoan.loan_code ||
    rawLoan.code ||
    rawLoan.ticket_code ||
    `#${rawLoan.loan_id ?? rawLoan.id ?? `loan-${index}`}`;
  const pickupBy =
    rawLoan.pickup_by ||
    rawLoan.pickupBy ||
    rawLoan.pickup_at ||
    rawLoan.pickupAt ||
    rawLoan.ready_by ||
    rawLoan.readyBy ||
    null;
  const dueDate =
    rawLoan.due_date ||
    rawLoan.dueDate ||
    rawLoan.return_by ||
    rawLoan.returnBy ||
    rawLoan.due_at ||
    rawLoan.dueAt ||
    null;
  const returnedOn =
    rawLoan.returned_on ||
    rawLoan.returnedOn ||
    rawLoan.closed_at ||
    rawLoan.closedAt ||
    rawLoan.completed_at ||
    rawLoan.completedAt ||
    null;
  const qrRef =
    rawLoan.ticket_token || rawLoan.qr_ref || rawLoan.qrRef || rawLoan.token;
  return {
    id: rawLoan.loan_id ?? rawLoan.id ?? `${index}`,
    code,
    status,
    pickupBy,
    dueDate,
    returnedOn,
    qrRef,
    items,
  };
}

function filterCartItems(items, query) {
  if (!Array.isArray(items)) return [];
  const term = query.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) => {
    const title = item.title?.toLowerCase() ?? "";
    const author = item.author?.toLowerCase() ?? "";
    const code = item.bookId?.toString().toLowerCase() ?? "";
    return (
      title.includes(term) || author.includes(term) || code.includes(term)
    );
  });
}

function filterOrders(orders, query) {
  if (!Array.isArray(orders)) return [];
  const term = query.trim().toLowerCase();
  if (!term) return orders;
  return orders.filter((order) => {
    const code = order.code?.toLowerCase() ?? "";
    if (code.includes(term)) return true;
    return order.items?.some((item) => {
      const title = item.title?.toLowerCase() ?? "";
      const author = item.author?.toLowerCase() ?? "";
      return title.includes(term) || author.includes(term);
    });
  });
}

function getStatusMeta(status) {
  if (RESERVED_STATUSES.has(status)) {
    return { key: "reserved", label: "Reserved", dateLabel: "Pickup By" };
  }
  if (OVERDUE_STATUSES.has(status)) {
    return { key: "overdue", label: "Overdue", dateLabel: "Return By" };
  }
  if (ACTIVE_STATUSES.has(status)) {
    return { key: "borrowing", label: "Borrowing", dateLabel: "Return By" };
  }
  if (RETURNED_STATUSES.has(status)) {
    return { key: "returned", label: "Returned", dateLabel: "Returned On" };
  }
  if (CANCELLED_STATUSES.has(status)) {
    return { key: "cancelled", label: "Cancelled", dateLabel: "Updated" };
  }
  const label = status
    ? status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Unknown";
  return { key: "default", label, dateLabel: "Updated" };
}

function CartPage() {
  const [activeTab, setActiveTab] = useState("cart");
  const [searchValue, setSearchValue] = useState("");
  const [cart, setCart] = useState({ code: "", items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [openReviewOrderId, setOpenReviewOrderId] = useState(null);
  const navigate = useNavigate();
  const accessToken = useAuthToken();

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;
    async function loadCart() {
      try {
        setCartLoading(true);
        setCartError("");
        const payload = await fetchCart(accessToken);
        if (!ignore) {
          setCart(normalizeCartResponse(payload));
        }
      } catch (error) {
        if (!ignore) {
          setCart({ code: "", items: [] });
          setCartError(error.message ?? "Failed to load your cart.");
        }
      } finally {
        if (!ignore) {
          setCartLoading(false);
        }
      }
    }
    loadCart();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;
    async function loadLoans() {
      try {
        setLoansLoading(true);
        setLoansError("");
        const payload = await fetchLoans(accessToken);
        const list = Array.isArray(payload?.items) ? payload.items : payload;
        if (!ignore) {
          const normalized = (Array.isArray(list) ? list : [])
            .map(normalizeLoan)
            .filter(Boolean);
          setLoans(normalized);
        }
      } catch (error) {
        if (!ignore) {
          setLoans([]);
          setLoansError(error.message ?? "Failed to load loans.");
        }
      } finally {
        if (!ignore) {
          setLoansLoading(false);
        }
      }
    }
    loadLoans();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;
    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError("");
        const payload = await fetchLoanHistory(accessToken);
        const list = Array.isArray(payload?.items) ? payload.items : payload;
        if (!ignore) {
          const normalized = (Array.isArray(list) ? list : [])
            .map(normalizeLoan)
            .filter(Boolean);
          setHistory(normalized);
        }
      } catch (error) {
        if (!ignore) {
          setHistory([]);
          setHistoryError(error.message ?? "Failed to load history.");
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false);
        }
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  const filteredCartItems = useMemo(
    () => filterCartItems(cart.items, searchValue),
    [cart.items, searchValue]
  );
  const filteredLoans = useMemo(
    () => filterOrders(loans, searchValue),
    [loans, searchValue]
  );
  const filteredHistory = useMemo(
    () => filterOrders(history, searchValue),
    [history, searchValue]
  );

  const getTabButtonClass = (tab) =>
    `${styles["tabs-btn"]} ${
      activeTab === tab ? styles["tabs-btn-active"] : ""
    }`.trim();

  const handleNavigateToBook = (item) => {
    if (!item?.bookId) return;
    setOpenReviewOrderId(null);
    navigate(`/book/${item.bookId}`);
  };

  const renderCart = () => {
    if (cartLoading) {
      return <p className={styles["state-message"]}>Loading your cart…</p>;
    }
    if (cartError) {
      return (
        <p className={`${styles["state-message"]} ${styles["state-error"]}`}>
          {cartError}
        </p>
      );
    }
    if (filteredCartItems.length === 0) {
      return (
        <p className={styles["state-message"]}>
          Your cart is empty right now.
        </p>
      );
    }
    return (
      <div className={styles["cart-card"]}>
        <div className={styles["cart-header"]}>
          <p>
            Order Draft{" "}
            {cart.code ? <span>{cart.code}</span> : <span>#CART</span>}
          </p>
          <p>{filteredCartItems.length} item(s)</p>
        </div>
        <div className={styles["loan-items"]}>
          {filteredCartItems.map((book) => (
            <div className={styles["loan-item"]} key={book.id}>
              <img
                className={styles["loan-cover"]}
                src={book.cover}
                alt={book.title}
              />
              <div className={styles["loan-info"]}>
                <h3>{book.title}</h3>
                <p className={styles["loan-author"]}>By {book.author}</p>
                {book.description && (
                  <p className={styles["loan-desc"]}>{book.description}</p>
                )}
                <div className={styles["cart-row"]}>
                  <p className={styles["loan-qty"]}>Qty: {book.qty}</p>
                  <div className={styles["cart-actions"]}>
                    <button
                      className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
                      type="button"
                      disabled
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
                      type="button"
                      disabled
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles["cart-footer"]}>
          <button
            className={`${styles["pill-btn"]} ${styles["pill-btn-primary"]}`}
            type="button"
            disabled={filteredCartItems.length === 0}
          >
            Borrow
          </button>
        </div>
      </div>
    );
  };

  const renderLoanCards = () => {
    if (loansLoading) {
      return <p className={styles["state-message"]}>Loading your loans…</p>;
    }
    if (loansError) {
      return (
        <p className={`${styles["state-message"]} ${styles["state-error"]}`}>
          {loansError}
        </p>
      );
    }
    if (filteredLoans.length === 0) {
      return (
        <p className={styles["state-message"]}>
          No active loans to show right now.
        </p>
      );
    }
    return filteredLoans.map((order) => {
      const meta = getStatusMeta(order.status);
      const stateClass = styles[`loan-card-${meta.key}`] || "";
      const pillClass = styles[`status-${meta.key}`] || styles["status-default"];
      const dateValue =
        meta.key === "reserved"
          ? order.pickupBy
          : meta.key === "returned"
          ? order.returnedOn
          : order.dueDate || order.returnedOn || order.pickupBy;
      const formattedDate = formatDate(dateValue);
      return (
        <div
          className={`${styles["loan-card"]} ${stateClass}`.trim()}
          key={order.id}
        >
          <div className={styles["loan-items"]}>
            {order.items.map((item) => (
              <div className={styles["loan-item"]} key={item.id}>
                <img
                  className={styles["loan-cover"]}
                  src={item.cover}
                  alt={item.title}
                />
                <div className={styles["loan-info"]}>
                  <h3>{item.title}</h3>
                  <p className={styles["loan-author"]}>By {item.author}</p>
                  <p className={styles["loan-desc"]}>
                    Keep an eye on your pickup and due dates.
                  </p>
                  <p className={styles["loan-qty"]}>Qty: {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles["loan-card-right"]}>
            <span className={`${styles["status-pill"]} ${pillClass}`}>
              {meta.label}
            </span>
            {formattedDate && (
              <p className={styles["loan-return"]}>
                {meta.dateLabel}: <span>{formattedDate}</span>
              </p>
            )}
            {order.qrRef && (
              <p className={styles["loan-qr"]}>
                QR Ref: <span>{order.qrRef}</span>
              </p>
            )}
            <p className={styles["loan-id"]}>{order.code}</p>
            {meta.key === "reserved" ? (
              <div className={styles["loan-actions"]}>
                <button
                  className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
                  type="button"
                  disabled
                >
                  Show QR Code
                </button>
                <button
                  className={`${styles["pill-btn"]} ${styles["pill-btn-danger"]}`}
                  type="button"
                  disabled
                >
                  Cancel Reservation
                </button>
              </div>
            ) : meta.key === "borrowing" || meta.key === "overdue" ? (
              <button
                className={`${styles["pill-btn"]} ${styles["pill-btn-primary"]}`}
                type="button"
                disabled
              >
                Renew
              </button>
            ) : null}
          </div>
        </div>
      );
    });
  };

  const renderHistory = () => {
    if (historyLoading) {
      return <p className={styles["state-message"]}>Loading history…</p>;
    }
    if (historyError) {
      return (
        <p className={`${styles["state-message"]} ${styles["state-error"]}`}>
          {historyError}
        </p>
      );
    }
    if (filteredHistory.length === 0) {
      return (
        <p className={styles["state-message"]}>
          No completed loans recorded yet.
        </p>
      );
    }
    return filteredHistory.map((order) => {
      const returnedDate = formatDate(order.returnedOn || order.dueDate);
      const isMenuOpen = openReviewOrderId === order.id;
      return (
        <div className={styles["loan-card"]} key={order.id}>
          <div className={styles["loan-items"]}>
            {order.items.map((item) => (
              <div className={styles["loan-item"]} key={item.id}>
                <img
                  className={styles["loan-cover"]}
                  src={item.cover}
                  alt={item.title}
                />
                <div className={styles["loan-info"]}>
                  <h3>{item.title}</h3>
                  <p className={styles["loan-author"]}>By {item.author}</p>
                  <p className={styles["loan-desc"]}>
                    Thank you for reading with Webshelf.
                  </p>
                  <p className={styles["loan-qty"]}>Qty: {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles["loan-card-right"]}>
            {returnedDate && (
              <p className={styles["loan-return"]}>
                Returned On: <span>{returnedDate}</span>
              </p>
            )}
            <p className={styles["loan-id"]}>{order.code}</p>
            <button
              className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
              type="button"
              onClick={() => {
                if (order.items.length <= 1) {
                  handleNavigateToBook(order.items[0]);
                  return;
                }
                setOpenReviewOrderId((prev) =>
                  prev === order.id ? null : order.id
                );
              }}
              disabled={!order.items.length}
            >
              Write Review
            </button>
            {isMenuOpen && order.items.length > 1 && (
              <div className={styles["review-picker"]}>
                <p>Select a book to review</p>
                {order.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigateToBook(item)}
                    disabled={!item.bookId}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderActiveTab = () => {
    if (activeTab === "cart") return renderCart();
    if (activeTab === "history") return renderHistory();
    return renderLoanCards();
  };

  return (
    <div className={styles["account-page"]}>
      <header className={styles["account-header"]}>
        <div className={styles["account-header-inner"]}>
          <div className={styles["brand-block"]}>
            <img src={webshelfLogo} alt="Webshelf logo" />
            <div className={styles["brand-copy"]}>
              <span className={styles["brand-name"]}>WEBSHELF</span>
            </div>
          </div>

          <div className={styles["header-right"]}>
            <nav className={styles["top-nav"]}>
              <button
                type="button"
                onClick={() => setActiveTab("cart")}
                className={styles["link-reset"]}
              >
                Cart
              </button>
            </nav>
            <div className={styles["user-avatar"]}>
              <span />
            </div>
          </div>
        </div>
      </header>

      <main className={styles["account-main"]}>
        <section className={styles["tabs-card"]}>
          <button
            className={getTabButtonClass("cart")}
            onClick={() => setActiveTab("cart")}
          >
            Your Cart
          </button>
          <span className={styles["tabs-divider"]} />
          <button
            className={getTabButtonClass("reading")}
            onClick={() => setActiveTab("reading")}
          >
            Reading Books
          </button>
          <span className={styles["tabs-divider"]} />
          <button
            className={getTabButtonClass("history")}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </section>

        <div className={styles["search-wrapper"]}>
          <span className={styles["search-icon"]}>🔍</span>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="Search Order"
            aria-label="Search order"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <section className={styles["loan-list"]}>{renderActiveTab()}</section>
      </main>

      <footer className={styles["account-footer"]}>
        <div className={styles["account-footer-inner"]}>
          <span>2025 WEBSHELF</span>
          <div className={styles["account-footer-links"]}>
            <a href="#about">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CartPage;
