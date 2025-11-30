import { API_BASE_URL } from "./config.js";

function authHeaders(accessToken, extra = {}) {
  if (!accessToken) {
    throw new Error("Admin access token is missing.");
  }
  return {
    "Content-Type": "application/json",
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

function extractErrorMessage(payload) {
  if (!payload) return "";
  const keys = [payload.error, payload.message]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  if (keys.length > 0) {
    return keys[0];
  }
  const rawErrors = payload.errors;
  if (!rawErrors) return "";
  const collection = [];
  if (Array.isArray(rawErrors)) {
    collection.push(...rawErrors);
  } else if (typeof rawErrors === "object") {
    Object.values(rawErrors).forEach((value) => {
      if (Array.isArray(value)) {
        collection.push(...value);
      } else {
        collection.push(value);
      }
    });
  } else if (typeof rawErrors === "string") {
    collection.push(rawErrors);
  }
  const normalized = collection
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();
      if (typeof item === "object") {
        const nested =
          (typeof item.message === "string" && item.message) ||
          (typeof item.error === "string" && item.error) ||
          Object.values(item).find((value) => typeof value === "string");
        return (nested || "").trim();
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

function normalizeListPayload(payload) {
  if (!payload) {
    return { rows: [], count: 0 };
  }

  const pickRows = (source) => {
    if (!source) return null;
    if (Array.isArray(source)) return source;
    if (Array.isArray(source.rows)) return source.rows;
    if (Array.isArray(source.items)) return source.items;
    if (Array.isArray(source.users)) return source.users;
    if (Array.isArray(source.accounts)) return source.accounts;
    if (Array.isArray(source.results)) return source.results;
    return null;
  };

  let rows = [];
  if (Array.isArray(payload)) {
    rows = payload;
  } else {
    rows = pickRows(payload) ?? pickRows(payload.data) ?? pickRows(payload.meta) ?? [];
  }

  const pickNumber = (value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const count =
    pickNumber(payload.count) ??
    pickNumber(payload.total) ??
    pickNumber(payload.total_count) ??
    pickNumber(payload.total_items) ??
    pickNumber(payload.totalItems) ??
    pickNumber(payload.total_users) ??
    pickNumber(payload.totalUsers) ??
    pickNumber(payload.users_count) ??
    pickNumber(payload.meta?.count) ??
    pickNumber(payload.meta?.total) ??
    pickNumber(payload.pagination?.count) ??
    pickNumber(payload.pagination?.total) ??
    pickNumber(payload.data?.count) ??
    pickNumber(payload.data?.total) ??
    rows.length;

  return { rows, count };
}

export async function adminScan(tokenString, accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/scan`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      token: tokenString?.trim?.() ?? tokenString,
      code: tokenString?.trim?.() ?? tokenString,
    }),
  });
  return parseResponse(response, "Scan failed");
}

export async function adminConfirmLoan(loanId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/loans/${loanId}/confirm`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to confirm loan");
}

export async function adminReturnLoan(loanId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/loans/${loanId}/return`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to mark loan as returned");
}

export async function adminRenewLoan(loanId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/loans/${loanId}/renew`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to renew this loan");
}

export async function adminCancelLoan(loanId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/loans/${loanId}/cancel`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to cancel this loan");
}

export async function adminListInvoices(params, accessToken) {
  const response = await fetch(buildUrl("/admin/invoices", params), {
    headers: authHeaders(accessToken),
  });
  const payload = await parseResponse(response, "Unable to load invoices");
  return normalizeListPayload(payload);
}

export async function adminMarkInvoicePaid(invoiceId, paymentDetails, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/invoices/${invoiceId}/mark-paid`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(paymentDetails || {}),
    }
  );
  return parseResponse(response, "Unable to update invoice");
}

export async function adminVoidInvoice(invoiceId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/invoices/${invoiceId}/void`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to void invoice");
}

export async function adminRunOverdueJob(accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/jobs/run-overdue`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
  return parseResponse(response, "Unable to run overdue job");
}

export async function adminListTransactions(params, accessToken) {
  const response = await fetch(buildUrl("/admin/transactions", params), {
    headers: authHeaders(accessToken),
  });
  const payload = await parseResponse(response, "Unable to load transactions");
  return normalizeListPayload(payload);
}

export async function adminListReviews(params, accessToken) {
  const response = await fetch(buildUrl("/admin/reviews", params), {
    headers: authHeaders(accessToken),
  });
  const payload = await parseResponse(response, "Unable to load reviews");
  return normalizeListPayload(payload);
}

export async function adminHideReview(reviewId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/reviews/${reviewId}/hide`,
    {
      method: "PUT",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to hide review");
}

export async function adminShowReview(reviewId, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}/admin/reviews/${reviewId}/show`,
    {
      method: "PUT",
      headers: authHeaders(accessToken),
    }
  );
  return parseResponse(response, "Unable to approve review");
}

export async function adminListBooks(params, accessToken) {
  try {
    const response = await fetch(buildUrl("/admin/books", params), {
      headers: authHeaders(accessToken),
    });
    const payload = await parseResponse(response, "Unable to load books");
    return normalizeListPayload(payload);
  } catch (error) {
    if (error.status === 404 || error.status === 403) {
      const fallbackParams = { ...params };
      if (fallbackParams.search) {
        fallbackParams.title = fallbackParams.search;
        delete fallbackParams.search;
      }
      const fallbackResponse = await fetch(buildUrl("/books", fallbackParams));
      const payload = await parseResponse(fallbackResponse, "Unable to load books");
      return normalizeListPayload(payload);
    }
    throw error;
  }
}

export async function adminCreateBook(payload, accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/books`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Unable to create book");
}

export async function adminUpdateBook(bookId, payload, accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Unable to update book");
}

export async function adminDeleteBook(bookId, accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  return parseResponse(response, "Unable to delete book");
}

export async function adminListUsers(params, accessToken) {
  const response = await fetch(buildUrl("/admin/users", params), {
    headers: authHeaders(accessToken),
  });
  const payload = await parseResponse(response, "Unable to load users");
  return normalizeListPayload(payload);
}

export async function adminUpdateUser(userId, payload, accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(response, "Unable to update user");
}
