const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "https://library-api-dicz.onrender.com"
).replace(/\/$/, "");

function authHeaders(accessToken, extra = {}) {
  if (!accessToken) {
    throw new Error("Missing access token for this request.");
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

function normalizeNumberId(rawValue, label = "Identifier") {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    throw new Error(`Missing ${label.toLowerCase()}.`);
  }
  const parsed =
    typeof rawValue === "string" ? Number.parseInt(rawValue, 10) : rawValue;
  const numeric = Number.isFinite(parsed) ? parsed : Number(rawValue);
  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} is invalid.`);
  }
  return numeric;
}

function extractErrorMessage(payload) {
  if (!payload) return "";
  const directKeys = [payload.error, payload.message]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  if (directKeys.length > 0) {
    return directKeys[0];
  }

  const rawErrors = payload.errors;
  if (!rawErrors) {
    return "";
  }
  const errorItems = [];
  if (Array.isArray(rawErrors)) {
    errorItems.push(...rawErrors);
  } else if (typeof rawErrors === "object") {
    Object.values(rawErrors).forEach((value) => {
      if (Array.isArray(value)) {
        errorItems.push(...value);
      } else {
        errorItems.push(value);
      }
    });
  } else if (typeof rawErrors === "string") {
    errorItems.push(rawErrors);
  }

  const normalized = errorItems
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();
      if (typeof item === "object") {
        const nestedMessage =
          (typeof item.message === "string" && item.message) ||
          (typeof item.error === "string" && item.error) ||
          Object.values(item).find((value) => typeof value === "string");
        return (nestedMessage || "").trim();
      }
      try {
        return String(item).trim();
      } catch {
        return "";
      }
    })
    .filter(Boolean);
  return normalized.join(" ").trim();
}

async function parseResponse(response, fallbackMessage) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detailedMessage = extractErrorMessage(payload);
    const message =
      detailedMessage ||
      fallbackMessage ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchCart(accessToken, options = {}) {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "GET",
    headers: authHeaders(accessToken),
    signal: options.signal,
  });
  return parseResponse(response, "Unable to load your cart");
}

export async function addBookToCart(bookId, quantity = 1, accessToken) {
  if (bookId === undefined || bookId === null) {
    throw new Error("Missing book identifier.");
  }
  const numericBookId = normalizeNumberId(bookId, "Book identifier");
  const numericQuantity =
    typeof quantity === "number"
      ? Math.max(1, Math.floor(quantity))
      : Math.max(1, Number.parseInt(quantity, 10) || 1);

  const payload = {
    book_id: numericBookId,
    quantity: numericQuantity,
  };
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "POST",
    headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Unable to add this book to your cart");
}

export async function updateCartItem(bookId, quantity, accessToken) {
  if (bookId === undefined || bookId === null) {
    throw new Error("Missing book identifier.");
  }
  if (quantity === undefined || quantity === null || quantity === "") {
    throw new Error("Quantity is required.");
  }
  const numericBookId = normalizeNumberId(bookId, "Book identifier");
  const numericQuantity =
    typeof quantity === "number"
      ? Math.max(0, Math.floor(quantity))
      : Math.max(0, Number.parseInt(quantity, 10) || 0);

  const payload = { book_id: numericBookId, quantity: numericQuantity };
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: "PUT",
    headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Unable to update this cart item");
}

export async function removeCartItem(bookId, accessToken) {
  if (bookId === undefined || bookId === null) {
    throw new Error("Missing book identifier.");
  }
  const numericBookId = normalizeNumberId(bookId, "Book identifier");
  const response = await fetch(`${API_BASE_URL}/cart/${numericBookId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  return parseResponse(response, "Unable to remove this cart item");
}

export async function checkoutCart(accessToken) {
  const response = await fetch(`${API_BASE_URL}/checkout`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
  return parseResponse(response, "Checkout failed");
}

export async function fetchLoans(accessToken, params = {}, options = {}) {
  const response = await fetch(buildUrl("/loans", params), {
    headers: authHeaders(accessToken),
    signal: options.signal,
  });
  return parseResponse(response, "Unable to load your loans");
}

export async function fetchLoanById(loanId, accessToken, options = {}) {
  if (loanId === undefined || loanId === null || loanId === "") {
    throw new Error("Missing loan id.");
  }
  const numericLoanId = normalizeNumberId(loanId, "Loan id");
  const response = await fetch(`${API_BASE_URL}/loans/${numericLoanId}`, {
    headers: authHeaders(accessToken),
    signal: options.signal,
  });
  return parseResponse(response, "Unable to find that loan");
}

export async function fetchLoanHistory(
  accessToken,
  params = {},
  options = {}
) {
  try {
    const response = await fetch(buildUrl("/loans/history", params), {
      headers: authHeaders(accessToken),
      signal: options.signal,
    });
    const payload = await parseResponse(response, "Unable to load your history");
    return payload;
  } catch (error) {
    if (
      error?.status === 404 ||
      error?.status === 500 ||
      error?.status === 502 ||
      error?.status === 503 ||
      error?.status === 504
    ) {
      const fallbackItems = await fetchLoanHistoryFallback(
        accessToken,
        params,
        options
      );
      return {
        page: 1,
        limit: fallbackItems.length,
        total: fallbackItems.length,
        items: fallbackItems,
      };
    }
    throw error;
  }
}

async function fetchLoanHistoryFallback(accessToken, params, options) {
  const requestedStatuses = params?.status;
  const statusList = Array.isArray(requestedStatuses)
    ? requestedStatuses
    : requestedStatuses
      ? [requestedStatuses]
      : ["returned", "completed", "cancelled", "void"];
  const seen = new Set();
  const aggregated = [];

  for (const status of statusList) {
    const lookupKey = (status || "").toString().trim().toLowerCase();
    if (!lookupKey || seen.has(lookupKey)) continue;
    seen.add(lookupKey);
    try {
      const payload = await fetchLoans(
        accessToken,
        { ...params, status: lookupKey },
        options
      );
      const rows = normalizeList(payload);
      aggregated.push(...rows);
    } catch (innerError) {
      if (
        innerError?.status &&
        innerError.status >= 500 &&
        innerError.status <= 599
      ) {
        continue;
      }
      if (innerError?.status === 404) {
        continue;
      }
      throw innerError;
    }
  }

  return aggregated;
}

export async function cancelLoan(loanId, accessToken, options = {}) {
  if (loanId === undefined || loanId === null) {
    throw new Error("Missing loan id.");
  }
  const numericLoanId = normalizeNumberId(loanId, "Loan id");
  const tryAdmin =
    options.allowAdminFallback !== false || options.isAdmin === true;

  async function postCancel(path) {
    const response = await fetch(path, {
      method: "POST",
      headers: authHeaders(accessToken),
    });
    return parseResponse(response, "Unable to cancel this reservation");
  }

  try {
    return await postCancel(`${API_BASE_URL}/loans/${numericLoanId}/cancel`);
  } catch (error) {
    if (tryAdmin && (error.status === 404 || error.status === 403)) {
      return postCancel(`${API_BASE_URL}/admin/loans/${numericLoanId}/cancel`);
    }
    throw error;
  }
}

export async function renewLoan(loanId, accessToken) {
  if (loanId === undefined || loanId === null) {
    throw new Error("Missing loan id.");
  }
  const numericLoanId = normalizeNumberId(loanId, "Loan id");
  const response = await fetch(`${API_BASE_URL}/loans/${numericLoanId}/renew`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
  return parseResponse(response, "Unable to renew this loan");
}

export async function fetchLoanQr(loanId, accessToken, options = {}) {
  if (loanId === undefined || loanId === null) {
    throw new Error("Missing loan id.");
  }
  const numericLoanId = normalizeNumberId(loanId, "Loan id");
  const response = await fetch(
    `${API_BASE_URL}/loans/${numericLoanId}/qr.png`,
    {
      method: "GET",
      headers: authHeaders(accessToken),
      signal: options.signal,
    }
  );
  return response;
}

export async function fetchBookById(bookId, options = {}) {
  if (bookId === undefined || bookId === null || bookId === "") {
    throw new Error("Missing book identifier.");
  }
  const parsedId =
    typeof bookId === "string" ? Number.parseInt(bookId, 10) : bookId;
  const lookupId = Number.isFinite(parsedId) ? parsedId : bookId;
  const response = await fetch(
    buildUrl("/books", { book_id: lookupId, limit: 1 }),
    {
    signal: options.signal,
    }
  );
  const payload = await parseResponse(response, "Unable to load this book");
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const directBook =
    payload && !payload.items && (payload.book_id || payload.id) ? payload : null;
  const book = items[0] ?? directBook ?? null;
  if (!book) {
    throw new Error("Book not found.");
  }
  return book;
}

export async function fetchBookReviews(bookId, options = {}) {
  const numericBookId = normalizeNumberId(bookId, "Book identifier");
  const headers = { Accept: "application/json" };
  const token =
    options.accessToken ||
    options.token ||
    options.authToken ||
    options.access_token ||
    "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const query = {
    limit: options.limit || 50,
    page: options.page || 1,
  };
  try {
    const response = await fetch(
      buildUrl(`/reviews/book/${numericBookId}`, query),
      {
        method: "GET",
        headers,
        signal: options.signal,
      }
    );
    const payload = await parseResponse(response, "Unable to load reviews");
    return normalizeList(payload);
  } catch (error) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function submitBookReview(bookId, review, accessToken) {
  const numericBookId = normalizeNumberId(bookId, "Book identifier");
  const ratingValue = Number(review?.rating ?? review?.score ?? 0);
  const textValue =
    review?.body ?? review?.comment ?? review?.content ?? review?.text ?? "";
  const providedLoanId =
    review?.loanId ??
    review?.loan_id ??
    review?.loanID ??
    review?.loan ??
    null;
  const providedLoanItemId =
    review?.loanItemId ??
    review?.loan_item_id ??
    review?.loanItemID ??
    review?.loan_item ??
    null;
  let normalizedLoanId = null;
  let normalizedLoanItemId = null;
  if (providedLoanId !== null && providedLoanId !== undefined && providedLoanId !== "") {
    try {
      normalizedLoanId = normalizeNumberId(providedLoanId, "Loan id");
    } catch {
      normalizedLoanId = null;
    }
  }
  if (
    providedLoanItemId !== null &&
    providedLoanItemId !== undefined &&
    providedLoanItemId !== ""
  ) {
    try {
      normalizedLoanItemId = normalizeNumberId(providedLoanItemId, "Loan item id");
    } catch {
      normalizedLoanItemId = null;
    }
  }
  const payload = {
    book_id: numericBookId,
    rating: Number.isFinite(ratingValue) ? ratingValue : 0,
    body: textValue,
    comment: textValue,
    title: review?.title || undefined,
  };
  if (normalizedLoanId) {
    payload.loan_id = normalizedLoanId;
  }
  if (normalizedLoanItemId) {
    payload.loan_item_id = normalizedLoanItemId;
  }
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Unable to submit review");
}

function normalizeList(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload.reviews)) {
    return payload.reviews;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
}

export { API_BASE_URL };
