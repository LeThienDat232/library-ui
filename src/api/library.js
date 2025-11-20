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

async function parseResponse(response, fallbackMessage) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
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
  const parsedId =
    typeof bookId === "string" ? Number.parseInt(bookId, 10) : bookId;
  const numericBookId = Number.isFinite(parsedId) ? parsedId : Number(bookId);
  if (!Number.isFinite(numericBookId)) {
    throw new Error("Book identifier is invalid.");
  }
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
  const parsedId =
    typeof bookId === "string" ? Number.parseInt(bookId, 10) : bookId;
  const numericBookId = Number.isFinite(parsedId) ? parsedId : Number(bookId);
  if (!Number.isFinite(numericBookId)) {
    throw new Error("Book identifier is invalid.");
  }
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
  const parsedId =
    typeof bookId === "string" ? Number.parseInt(bookId, 10) : bookId;
  const numericBookId = Number.isFinite(parsedId) ? parsedId : Number(bookId);
  if (!Number.isFinite(numericBookId)) {
    throw new Error("Book identifier is invalid.");
  }
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
  const parsedId =
    typeof loanId === "string" ? Number.parseInt(loanId, 10) : loanId;
  const numericLoanId = Number.isFinite(parsedId) ? parsedId : Number(loanId);
  if (!Number.isFinite(numericLoanId)) {
    throw new Error("Loan id is invalid.");
  }
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
  const response = await fetch(buildUrl("/loans/history", params), {
    headers: authHeaders(accessToken),
    signal: options.signal,
  });
  return parseResponse(response, "Unable to load your history");
}

export async function cancelLoan(loanId, accessToken, options = {}) {
  if (loanId === undefined || loanId === null) {
    throw new Error("Missing loan id.");
  }
  const parsedId =
    typeof loanId === "string" ? Number.parseInt(loanId, 10) : loanId;
  const numericLoanId = Number.isFinite(parsedId) ? parsedId : Number(loanId);
  if (!Number.isFinite(numericLoanId)) {
    throw new Error("Loan id is invalid.");
  }
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
  const parsedId =
    typeof loanId === "string" ? Number.parseInt(loanId, 10) : loanId;
  const numericLoanId = Number.isFinite(parsedId) ? parsedId : Number(loanId);
  if (!Number.isFinite(numericLoanId)) {
    throw new Error("Loan id is invalid.");
  }
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
  const parsedId =
    typeof loanId === "string" ? Number.parseInt(loanId, 10) : loanId;
  const numericLoanId = Number.isFinite(parsedId) ? parsedId : Number(loanId);
  if (!Number.isFinite(numericLoanId)) {
    throw new Error("Loan id is invalid.");
  }
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

export { API_BASE_URL };
