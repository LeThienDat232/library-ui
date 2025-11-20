const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "https://library-api-dicz.onrender.com"
).replace(/\/$/, "");

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

function normalizeListPayload(payload) {
  if (!payload) {
    return { rows: [], count: 0 };
  }
  let rows = [];
  if (Array.isArray(payload)) {
    rows = payload;
  } else if (Array.isArray(payload.rows)) {
    rows = payload.rows;
  } else if (Array.isArray(payload.items)) {
    rows = payload.items;
  }
  return {
    rows,
    count: payload.count ?? payload.total ?? rows.length,
  };
}

export async function adminScan(tokenString, accessToken) {
  const response = await fetch(`${API_BASE_URL}/admin/scan`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ code: tokenString?.trim?.() ?? tokenString }),
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
