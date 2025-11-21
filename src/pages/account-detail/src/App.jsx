import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AccountPage.module.css";
import SiteHeader from "../../../components/SiteHeader.jsx";
import SiteFooter from "../../../components/SiteFooter.jsx";
import {
  checkoutCart,
  fetchCart,
  fetchLoanHistory,
  fetchLoans,
  cancelLoan,
  fetchLoanQr,
  fetchBookById,
  removeCartItem,
  updateCartItem,
  renewLoan,
} from "../../../api/library.js";
import { useAuthToken, useIsAdmin } from "../../../contexts/AuthContext.jsx";

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

// Overdue fee configuration
const OVERDUE_FEE_PER_DAY = 5000; // VND per day overdue
const MAX_OVERDUE_FEE = 100000; // Maximum fee cap in VND
const GRACE_PERIOD_DAYS = 0; // No grace period

function calculateOverdueFee(dueDate) {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));

  if (daysOverdue <= GRACE_PERIOD_DAYS) return 0;

  const effectiveDays = daysOverdue - GRACE_PERIOD_DAYS;
  const calculatedFee = effectiveDays * OVERDUE_FEE_PER_DAY;
  return Math.min(calculatedFee, MAX_OVERDUE_FEE);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

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
    rawLoan.return_at ||
    rawLoan.returnAt ||
    rawLoan.returned_at ||
    rawLoan.returnedAt ||
    rawLoan.return_date ||
    rawLoan.returnDate ||
    rawLoan.returned_date ||
    rawLoan.returnedDate ||
    rawLoan.returned_on ||
    rawLoan.returnedOn ||
    rawLoan.closed_at ||
    rawLoan.closedAt ||
    rawLoan.completed_at ||
    rawLoan.completedAt ||
    rawLoan.approved_at ||
    rawLoan.approvedAt ||
    rawLoan.updated_at ||
    rawLoan.updatedAt ||
    null;
  const qrRef =
    rawLoan.ticket_token || rawLoan.qr_ref || rawLoan.qrRef || rawLoan.token;

  const renewalsUsed =
    rawLoan.renew_count ?? rawLoan.renewals ?? rawLoan.renewal_count ?? 0;
  const maxRenewals =
    rawLoan.max_renewals ??
    rawLoan.allowed_renewals ??
    rawLoan.renewal_limit ??
    rawLoan.maxRenewals ??
    null;
  let renewalsRemaining =
    rawLoan.renewals_remaining ??
    rawLoan.renewals_left ??
    rawLoan.remaining_renewals ??
    null;
  if (renewalsRemaining === null && Number.isFinite(maxRenewals)) {
    renewalsRemaining = Math.max(Number(maxRenewals) - Number(renewalsUsed || 0), 0);
  }
  const isOverdueStatus = OVERDUE_STATUSES.has(status);

  // Calculate overdue fee if loan is overdue
  const overdueFee = isOverdueStatus
    ? rawLoan.overdue_fee ??
    rawLoan.overdueFee ??
    rawLoan.fee ??
    rawLoan.fine_amount ??
    calculateOverdueFee(dueDate)
    : 0;
  const canRenew =
    (!isOverdueStatus || overdueFee <= 0) &&
    (renewalsRemaining === null || renewalsRemaining > 0);

  return {
    id: rawLoan.loan_id ?? rawLoan.id ?? `${index}`,
    code,
    status,
    pickupBy,
    dueDate,
    returnedOn,
    qrRef,
    items,
    overdueFee,
    renewalsUsed,
    maxRenewals,
    renewalsRemaining,
    canRenew,
  };
}

function needsEnrichment(item) {
  const title = item.title || "";
  const author = item.author || "";
  return (
    !item.cover ||
    item.cover === FALLBACK_COVER ||
    title.toLowerCase().startsWith("untitled") ||
    author.toLowerCase().startsWith("unknown")
  );
}

async function enrichLoansWithBooks(loans) {
  const enriched = [...loans];
  const lookupIds = new Set();
  enriched.forEach((loan) => {
    loan.items?.forEach((item) => {
      if (needsEnrichment(item) && item.bookId !== undefined && item.bookId !== null) {
        lookupIds.add(item.bookId);
      }
    });
  });
  if (lookupIds.size === 0) return enriched;

  const bookMap = new Map();
  await Promise.all(
    Array.from(lookupIds).map(async (bookId) => {
      try {
        const book = await fetchBookById(bookId);
        if (book) {
          bookMap.set(bookId, book);
          const asString = bookId?.toString?.();
          if (asString) {
            bookMap.set(asString, book);
          }
        }
      } catch (error) {
        console.warn("Unable to enrich book", bookId, error);
      }
    })
  );

  return enriched.map((loan) => ({
    ...loan,
    items: loan.items.map((item) => {
      const book = bookMap.get(item.bookId);
      if (!book) return item;
      return {
        ...item,
        title: book.title ?? item.title,
        author: book.author ?? item.author,
        cover:
          book.cover ??
          book.cover_url ??
          item.cover ??
          item.cover_url ??
          FALLBACK_COVER,
      };
    }),
  }));
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

function deriveHistoryFromLoans(rawLoans) {
  if (!Array.isArray(rawLoans)) return [];
  return rawLoans.filter((loan) => {
    const key = getStatusMeta(loan.status).key;
    return key === "returned" || key === "cancelled";
  });
}

function mergeLoanLists(primary = [], secondary = []) {
  const map = new Map();
  [...primary, ...secondary].forEach((loan) => {
    if (!loan) return;
    map.set(loan.id, loan);
  });
  return Array.from(map.values());
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

function CartPage({ onBooksReload }) {
  const [activeTab, setActiveTab] = useState("cart");
  const [searchValue, setSearchValue] = useState("");
  const [cart, setCart] = useState({ code: "", items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [cartActionStatus, setCartActionStatus] = useState({
    type: "info",
    message: "",
  });
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loanActionState, setLoanActionState] = useState({});
  const [loanActionMessage, setLoanActionMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [borrowing, setBorrowing] = useState(false);
  const [renewDialog, setRenewDialog] = useState(null);
  const [renewError, setRenewError] = useState("");
  const [qtyDrafts, setQtyDrafts] = useState({});
  const [selectedCartItemId, setSelectedCartItemId] = useState(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const navigate = useNavigate();
  const accessToken = useAuthToken();
  const isAdmin = useIsAdmin();
  const isMountedRef = useRef(true);
  const cartRequestIdRef = useRef(0);
  const loansRequestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);
  const footerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const node = footerRef.current;
    if (!node) {
      return undefined;
    }

    const updateHeight = () => {
      setFooterHeight(node.offsetHeight || 0);
    };

    updateHeight();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(node);
    }

    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const loadCart = useCallback(async () => {
    if (!accessToken) return;
    const requestId = ++cartRequestIdRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      setCartLoading(true);
      setCartError("");
      const payload = await fetchCart(accessToken, { signal: controller.signal });
      if (!isMountedRef.current || requestId !== cartRequestIdRef.current) return;
      setCart(normalizeCartResponse(payload));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Cart load failed", error);
      }
      if (!isMountedRef.current || requestId !== cartRequestIdRef.current) return;
      setCart({ code: "", items: [] });
      setCartError(
        error.name === "AbortError"
          ? "Loading cart timed out. Please retry."
          : error.message ?? "Failed to load your cart."
      );
    } finally {
      clearTimeout(timer);
      if (!isMountedRef.current || requestId !== cartRequestIdRef.current) return;
      setCartLoading(false);
    }
  }, [accessToken]);

  const loadLoans = useCallback(async () => {
    if (!accessToken) return;
    const requestId = ++loansRequestIdRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      setLoansLoading(true);
      setLoansError("");
      const payload = await fetchLoans(accessToken, {}, { signal: controller.signal });
      const list = Array.isArray(payload?.items) ? payload.items : payload;
      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeLoan)
        .filter(Boolean);
      const enriched = await enrichLoansWithBooks(normalized);
      if (!isMountedRef.current || requestId !== loansRequestIdRef.current) return;
      setLoans(enriched);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Loans load failed", error);
      }
      if (!isMountedRef.current || requestId !== loansRequestIdRef.current) return;
      setLoans([]);
      setLoansError(
        error.name === "AbortError"
          ? "Loading loans timed out. Please retry."
          : error.message ?? "Failed to load loans."
      );
    } finally {
      clearTimeout(timer);
      if (!isMountedRef.current || requestId !== loansRequestIdRef.current) return;
      setLoansLoading(false);
    }
  }, [accessToken]);

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;
    const requestId = ++historyRequestIdRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      setHistoryLoading(true);
      const payload = await fetchLoanHistory(accessToken, {}, { signal: controller.signal });
      const list = Array.isArray(payload?.items) ? payload.items : payload;
      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeLoan)
        .filter(Boolean);
      const enriched = await enrichLoansWithBooks(normalized);
      if (!isMountedRef.current || requestId !== historyRequestIdRef.current) return;
      setHistory(enriched);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("History load failed", error);
      }
      if (!isMountedRef.current || requestId !== historyRequestIdRef.current) return;
      const fallback = deriveHistoryFromLoans(loans);
      setHistory(fallback);
    } finally {
      clearTimeout(timer);
      if (!isMountedRef.current || requestId !== historyRequestIdRef.current) return;
      setHistoryLoading(false);
    }
  }, [accessToken, loans]);

  useEffect(() => {
    loadCart();
  }, [loadCart, activeTab]);

  useEffect(() => {
    if (activeTab === "reading" || activeTab === "history") {
      loadLoans();
    }
  }, [activeTab, loadLoans]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  useEffect(() => {
    const nextDrafts = {};
    (cart.items ?? []).forEach((item) => {
      const fallbackQty = Number.isFinite(Number(item.qty))
        ? Number(item.qty)
        : 1;
      nextDrafts[item.id] = String(fallbackQty);
    });
    setQtyDrafts(nextDrafts);
  }, [cart.items]);

  const filteredCartItems = useMemo(
    () => filterCartItems(cart.items, searchValue),
    [cart.items, searchValue]
  );
  const readingLoans = useMemo(
    () =>
      loans.filter((loan) => {
        const key = getStatusMeta(loan.status).key;
        return key === "reserved" || key === "borrowing" || key === "overdue";
      }),
    [loans]
  );
  const historyLoans = useMemo(
    () => {
      const derived = deriveHistoryFromLoans(loans);
      const merged = mergeLoanLists(history, derived);
      return merged.filter((loan) => {
        const key = getStatusMeta(loan.status).key;
        return key === "returned" || key === "cancelled";
      });
    },
    [history, loans]
  );
  const filteredReadingLoans = useMemo(
    () => filterOrders(readingLoans, searchValue),
    [readingLoans, searchValue]
  );
  const filteredHistory = useMemo(
    () => filterOrders(historyLoans, searchValue),
    [historyLoans, searchValue]
  );

  useEffect(() => {
    if (filteredCartItems.length === 0) {
      setSelectedCartItemId(null);
      return;
    }
    const hasSelection = filteredCartItems.some(
      (item) => item.id === selectedCartItemId
    );
    if (!hasSelection) {
      setSelectedCartItemId(filteredCartItems[0].id);
    }
  }, [filteredCartItems, selectedCartItemId]);

  const getTabButtonClass = (tab) =>
    `${styles["tabs-btn"]} ${activeTab === tab ? styles["tabs-btn-active"] : ""
      }`.trim();

  const handleSelectCartItem = (itemId) => {
    setSelectedCartItemId(itemId);
  };

  const getCartItemUiState = (book) => {
    const qtyValue = qtyDrafts[book.id] ?? String(book.qty ?? 1);
    const isItemBusy =
      updatingItemId === book.id ||
      removingItemId === book.id ||
      borrowing;
    return {
      qtyValue,
      isItemBusy,
      updateLabel: updatingItemId === book.id ? "Saving…" : "Update",
      removeLabel: removingItemId === book.id ? "Removing…" : "Remove",
    };
  };

  const handleQtyInputChange = (itemId, value) => {
    if (value === "" || /^[0-9]+$/.test(value)) {
      setQtyDrafts((prev) => ({ ...prev, [itemId]: value }));
    }
  };

  const handleAdjustQty = (itemId, delta) => {
    setQtyDrafts((prev) => {
      const relatedItem = cart.items.find((book) => book.id === itemId);
      const fallbackQty = Number.isFinite(Number(relatedItem?.qty))
        ? Number(relatedItem.qty)
        : 1;
      const parsedCurrent = Number.parseInt(prev[itemId], 10);
      const currentQty = Number.isFinite(parsedCurrent)
        ? parsedCurrent
        : fallbackQty;
      const nextQty = Math.max(0, currentQty + delta);
      return { ...prev, [itemId]: String(nextQty) };
    });
  };

  const handleEditItem = async (item) => {
    if (!item?.bookId) {
      setCartActionStatus({
        type: "error",
        message: "Missing book id for this item.",
      });
      return;
    }
    const draftValue = qtyDrafts[item.id];
    if (draftValue === "") {
      setCartActionStatus({
        type: "error",
        message: "Please enter a quantity before updating.",
      });
      return;
    }
    const fallbackQty = Number.isFinite(Number(item.qty))
      ? Number(item.qty)
      : 1;
    const nextQty = Number.parseInt(draftValue ?? fallbackQty ?? 1, 10);
    if (!Number.isFinite(nextQty) || nextQty < 0) {
      setCartActionStatus({
        type: "error",
        message: "Please enter a valid quantity (0 or more).",
      });
      return;
    }
    try {
      setUpdatingItemId(item.id);
      setCartActionStatus({ type: "info", message: "" });
      await updateCartItem(item.bookId, nextQty, accessToken);
      await loadCart();
      setQtyDrafts((prev) => ({ ...prev, [item.id]: String(nextQty) }));
      setCartActionStatus({
        type: "info",
        message: nextQty === 0 ? "Item removed from cart." : "Quantity updated.",
      });
    } catch (error) {
      setCartActionStatus({
        type: "error",
        message: error.message ?? "Unable to update this item.",
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (item) => {
    if (!item?.bookId) {
      setCartActionStatus({
        type: "error",
        message: "Missing book id for this item.",
      });
      return;
    }
    try {
      setRemovingItemId(item.id);
      setCartActionStatus({ type: "info", message: "" });
      await removeCartItem(item.bookId, accessToken);
      await loadCart();
      setCartActionStatus({
        type: "info",
        message: "Item removed from cart.",
      });
    } catch (error) {
      setCartActionStatus({
        type: "error",
        message: error.message ?? "Unable to remove this item.",
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleBorrow = async () => {
    if ((cart.items?.length ?? 0) === 0 || borrowing) return;
    try {
      setBorrowing(true);
      setCartActionStatus({ type: "info", message: "" });
      await checkoutCart(accessToken);
      await Promise.all([loadCart(), loadLoans(), loadHistory()]);
      setCartActionStatus({
        type: "info",
        message: "Checkout successful. See Reading Books for your reservation.",
      });
      setActiveTab("reading");
    } catch (error) {
      setCartActionStatus({
        type: "error",
        message: error.message ?? "Unable to place your checkout.",
      });
    } finally {
      setBorrowing(false);
    }
  };

  const handleRenewLoan = (order) => {
    if (!order?.id) return;
    if (order.canRenew === false) {
      const reason = order.overdueFee > 0
        ? "Pay any overdue fees before renewing this loan."
        : "All renewals have already been used for this loan.";
      setLoanActionMessage(reason);
      return;
    }
    setRenewError("");
    setRenewDialog(order);
  };

  const confirmRenewLoan = async () => {
    if (!renewDialog?.id) return;
    const order = renewDialog;
    if (order.canRenew === false) {
      const message = order.overdueFee > 0
        ? "Overdue fees must be paid before renewing this loan."
        : "This loan does not have any renewals remaining.";
      setRenewError(message);
      setLoanActionMessage(message);
      return;
    }
    setLoanActionMessage("");
    setLoanActionState((prev) => ({ ...prev, [order.id]: "renew" }));
    try {
      await renewLoan(order.id, accessToken);
      await Promise.all([loadLoans(), loadHistory()]);
      setLoanActionMessage("Loan renewed. Check the updated due date.");
      setRenewDialog(null);
      setRenewError("");
    } catch (error) {
      const payloadMessage =
        error?.payload?.message || error?.message || "Unable to renew this loan.";
      setLoanActionMessage(payloadMessage);
      setRenewError(payloadMessage);
    } finally {
      setLoanActionState((prev) => ({ ...prev, [order.id]: null }));
    }
  };

  const closeRenewDialog = () => {
    setRenewDialog(null);
    setRenewError("");
  };

  const handleShowQr = async (order) => {
    if (!order?.id) return;
    const actionKey = order.id;
    setLoanActionMessage("");
    setLoanActionState((prev) => ({ ...prev, [actionKey]: "qr" }));
    try {
      const response = await fetchLoanQr(order.id, accessToken);
      if (!response.ok) {
        throw new Error(`Unable to load QR (${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const popup = window.open();
      if (popup) {
        popup.location.href = objectUrl;
        popup.opener = null;
        setLoanActionMessage("QR code opened in a new tab.");
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = order.code ? `${order.code}-qr.png` : "qr.png";
        link.rel = "noopener noreferrer";
        link.target = "_blank";
        link.click();
        setLoanActionMessage("QR code downloaded. Open the file to view.");
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      setLoanActionMessage(error.message ?? "Unable to load QR code.");
    } finally {
      setLoanActionState((prev) => ({ ...prev, [actionKey]: null }));
    }
  };

  const handleViewBook = (bookId) => {
    if (!bookId) return;
    navigate(`/book/${bookId}`);
  };

  const handleCancelReservation = async (order) => {
    if (!order?.id) return;
    const actionKey = order.id;
    setLoanActionMessage("");
    setLoanActionState((prev) => ({ ...prev, [actionKey]: "cancel" }));
    try {
      await cancelLoan(order.id, accessToken);
      await Promise.all([loadLoans(), loadHistory()]);
      setLoanActionMessage("Reservation cancelled.");
      // Reload book catalog to update inventory counts
      if (typeof onBooksReload === "function") {
        onBooksReload();
      }
    } catch (error) {
      const status = error?.status ? ` (status ${error.status})` : "";
      const detail =
        error?.payload?.message || error?.payload?.error || error?.message;
      setLoanActionMessage(
        detail
          ? `${detail}${status}`
          : `Unable to cancel this reservation${status}.`
      );
    } finally {
      setLoanActionState((prev) => ({ ...prev, [actionKey]: null }));
    }
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
    if ((cart.items?.length ?? 0) === 0) {
      return (
        <p className={styles["state-message"]}>
          Your cart is empty right now.
        </p>
      );
    }
    if (filteredCartItems.length === 0) {
      return (
        <p className={styles["state-message"]}>
          No cart items match your search.
        </p>
      );
    }
    const selectedItem =
      filteredCartItems.find((item) => item.id === selectedCartItemId) ??
      null;
    const selectedItemUi = selectedItem ? getCartItemUiState(selectedItem) : null;
    return (
      <div className={styles["cart-card"]}>
        <div className={styles["cart-header"]}>
          <p>
            Order Draft{" "}
            {cart.code ? <span>{cart.code}</span> : <span>#CART</span>}
          </p>
          <p>{filteredCartItems.length} item(s)</p>
        </div>
        {cartActionStatus.message && (
          <p
            className={`${styles["cart-note"]} ${cartActionStatus.type === "error"
              ? styles["cart-note-error"]
              : ""
              }`.trim()}
          >
            {cartActionStatus.message}
          </p>
        )}
        <div className={styles["loan-items"]}>
          {filteredCartItems.map((book) => {
            const { qtyValue, isItemBusy } = getCartItemUiState(book);
            const isSelected = book.id === selectedCartItemId;
            const loanItemClass = `${styles["loan-item"]} ${isSelected ? styles["cart-item-selected"] : ""
              }`.trim();
            return (
              <div
                className={loanItemClass}
                key={book.id}
                onClick={() => handleSelectCartItem(book.id)}
              >
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
                    <div className={styles["qty-control"]}>
                      <span className={styles["loan-qty"]}>Qty</span>
                      <div className={styles["qty-input-wrapper"]}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          className={styles["qty-input"]}
                          value={qtyValue}
                          disabled={isItemBusy}
                          onChange={(event) =>
                            handleQtyInputChange(book.id, event.target.value)
                          }
                          onFocus={() => handleSelectCartItem(book.id)}
                        />
                        <div className={styles["qty-stepper"]}>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={isItemBusy}
                            onClick={() => {
                              handleSelectCartItem(book.id);
                              handleAdjustQty(book.id, 1);
                            }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={isItemBusy}
                            onClick={() => {
                              handleSelectCartItem(book.id);
                              handleAdjustQty(book.id, -1);
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles["cart-footer"]}>
          <div className={styles["cart-selection"]}>
            <p>
              Selected:{" "}
              <span>{selectedItem ? selectedItem.title : "No book selected"}</span>
            </p>
          </div>
          <div className={styles["cart-button-row"]}>
            <button
              className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
              type="button"
              onClick={() => selectedItem && handleEditItem(selectedItem)}
              disabled={!selectedItemUi || selectedItemUi.isItemBusy}
            >
              {selectedItemUi?.updateLabel ?? "Update"}
            </button>
            <button
              className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
              type="button"
              onClick={() => selectedItem && handleRemoveItem(selectedItem)}
              disabled={!selectedItemUi || selectedItemUi.isItemBusy}
            >
              {selectedItemUi?.removeLabel ?? "Remove"}
            </button>
            <button
              className={`${styles["pill-btn"]} ${styles["pill-btn-primary"]}`}
              type="button"
              disabled={(cart.items?.length ?? 0) === 0 || borrowing}
              onClick={handleBorrow}
            >
              {borrowing ? "Borrowing…" : "Borrow"}
            </button>
          </div>
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
    if (filteredReadingLoans.length === 0) {
      return (
        <p className={styles["state-message"]}>
          No reserved or borrowing books to show right now.
        </p>
      );
    }
    return (
      <>
        {loanActionMessage && (
          <p className={styles["cart-note"]}>{loanActionMessage}</p>
        )}
        {filteredReadingLoans.map((order) => {
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
                    <button
                      type="button"
                      className={styles["loan-cover-btn"]}
                      onClick={() => handleViewBook(item.bookId)}
                      aria-label={`View details for ${item.title}`}
                    >
                      <img
                        className={styles["loan-cover"]}
                        src={item.cover}
                        alt={item.title}
                      />
                    </button>
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
                {meta.key === "overdue" && order.overdueFee > 0 && (
                  <p className={styles["loan-overdue-fee"]}>
                    Overdue Fee: <span className={styles["fee-amount"]}>{formatCurrency(order.overdueFee)}</span>
                  </p>
                )}
                {typeof order.renewalsRemaining === "number" && (
                  <p className={styles["loan-renewals"]}>
                    Renewals left: <span>{order.renewalsRemaining}</span>
                  </p>
                )}
                {order.qrRef && (
                  <p className={styles["loan-qr"]}>
                    QR Ref: <span>{order.qrRef}</span>
                  </p>
                )}
                <p className={styles["loan-id"]}>Loan ID # {order.id}</p>
                {meta.key === "reserved" ? (
                  <div className={styles["loan-actions"]}>
                    <button
                      className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
                      type="button"
                      onClick={() => handleShowQr(order)}
                      disabled={loanActionState[order.id] === "qr"}
                    >
                      {loanActionState[order.id] === "qr" ? "Loading…" : "Show QR Code"}
                    </button>
                    <button
                      className={`${styles["pill-btn"]} ${styles["pill-btn-danger"]}`}
                      type="button"
                      onClick={() => handleCancelReservation(order)}
                      disabled={loanActionState[order.id] === "cancel"}
                    >
                      {loanActionState[order.id] === "cancel"
                        ? "Cancelling…"
                        : "Cancel Reservation"}
                    </button>
                  </div>
                ) : meta.key === "borrowing" || meta.key === "overdue" ? (
                  <div className={styles["loan-actions"]}>
                    <button
                      className={`${styles["pill-btn"]} ${styles["pill-btn-primary"]}`}
                      type="button"
                      onClick={() => handleRenewLoan(order)}
                      disabled={
                        loanActionState[order.id] === "renew" || order.canRenew === false
                      }
                    >
                      {order.canRenew === false
                        ? "Renew unavailable"
                        : loanActionState[order.id] === "renew"
                          ? "Renewing…"
                          : "Renew"}
                    </button>
                    {order.canRenew === false && (
                      <p className={styles["loan-note"]}>
                        {order.overdueFee > 0
                          ? "Pay overdue fees before renewing."
                          : "All renewals have been used."}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const renderHistory = () => {
    if (historyLoading) {
      return <p className={styles["state-message"]}>Loading history…</p>;
    }
    if (filteredHistory.length === 0) {
      return (
        <p className={styles["state-message"]}>
          No returned or cancelled loans recorded yet.
        </p>
      );
    }
    return (
      <>
        {filteredHistory.map((order) => {
          const meta = getStatusMeta(order.status);
          const returnedDate = formatDate(order.returnedOn);
          const stateClass = styles[`loan-card-${meta.key}`] || "";
          const statusClass =
            styles[`status-${meta.key}`] || styles["status-default"];
          const isReturned = meta.key === "returned";
          return (
            <div
              className={`${styles["loan-card"]} ${stateClass}`.trim()}
              key={order.id}
            >
              <div className={styles["loan-items"]}>
                {order.items.map((item) => (
                  <div className={styles["loan-item"]} key={item.id}>
                    <button
                      type="button"
                      className={styles["loan-cover-btn"]}
                      onClick={() => handleViewBook(item.bookId)}
                      aria-label={`View details for ${item.title}`}
                    >
                      <img
                        className={styles["loan-cover"]}
                        src={item.cover}
                        alt={item.title}
                      />
                    </button>
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
                <span className={`${styles["status-pill"]} ${statusClass}`}>
                  {meta.label}
                </span>
                {returnedDate && (
                  <p className={styles["loan-return"]}>
                    Returned On: <span>{returnedDate}</span>
                  </p>
                )}
                <p className={styles["loan-id"]}>Loan ID # {order.id}</p>
                {isReturned && null}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === "cart") return renderCart();
    if (activeTab === "history") return renderHistory();
    return renderLoanCards();
  };

  const footerOffset = useMemo(
    () => Math.max(footerHeight + 20, 280),
    [footerHeight]
  );
  const accountPageStyle = useMemo(
    () => ({ paddingBottom: `${footerOffset}px` }),
    [footerOffset]
  );

  return (
    <div className={styles["account-page"]} style={accountPageStyle}>
      <SiteHeader
        isLoggedIn={Boolean(accessToken)}
        isAdmin={isAdmin}
        mode="cart"
      />
      {renewDialog && (
        <div className={styles["modal-backdrop"]}>
          <div className={styles["modal-card"]}>
            <h3>Renew loan #{renewDialog.id}?</h3>
            <p>
              We will extend the due date for{" "}
              <strong>{renewDialog.items.length}</strong> book
              {renewDialog.items.length === 1 ? "" : "s"} if renewals remain.
            </p>
            {renewError && (
              <p className={styles["modal-error"]}>{renewError}</p>
            )}
            <div className={styles["modal-actions"]}>
              <button
                type="button"
                className={`${styles["pill-btn"]} ${styles["pill-btn-outline"]}`}
                onClick={closeRenewDialog}
                disabled={loanActionState[renewDialog.id] === "renew"}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles["pill-btn"]} ${styles["pill-btn-primary"]}`}
                onClick={confirmRenewLoan}
                disabled={loanActionState[renewDialog.id] === "renew"}
              >
                {loanActionState[renewDialog.id] === "renew"
                  ? "Renewing…"
                  : "Confirm Renew"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={styles["account-main"]}>
        <section className={styles["tabs-card"]}>
          <button
            className={getTabButtonClass("cart")}
            onClick={() => setActiveTab("cart")}
          >
            Your Cart
          </button>
          <button
            className={getTabButtonClass("reading")}
            onClick={() => setActiveTab("reading")}
          >
            Reading Books
          </button>
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

      <SiteFooter ref={footerRef} />
    </div>
  );
}

export default CartPage;
