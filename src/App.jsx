import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import CartPage from "./pages/account-detail/src/App.jsx";
import AccountSettings from "./pages/account-settings/AccountSettings.jsx";
import ResetPassword from "./pages/reset-password/ResetPassword.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/login-page/src/App.jsx";
import RegisterPage from "./pages/register-page/src/App.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminCirculation from "./pages/admin/AdminCirculation.jsx";
import AdminInvoices from "./pages/admin/AdminInvoices.jsx";
import AdminTransactions from "./pages/admin/AdminTransactions.jsx";
import AdminReviews from "./pages/admin/AdminReviews.jsx";
import AdminBooks from "./pages/admin/AdminBooks.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import BookDetailRoute from "./pages/book-detail/BookDetailRoute.jsx";
import { AuthContext, isAdminUser } from "./contexts/AuthContext.jsx";
import { API_BASE_URL } from "./api/config.js";

const AUTH_STORAGE_KEY = "webshelf-auth";

const normalizeAuthSession = (rawSession) => {
  if (!rawSession || typeof rawSession !== "object") {
    return null;
  }
  const accessToken =
    rawSession.token ??
    rawSession.accessToken ??
    rawSession.access_token ??
    rawSession.jwt ??
    null;
  const refreshToken =
    rawSession.refreshToken ?? rawSession.refresh_token ?? null;
  const userProfile =
    rawSession.user ?? rawSession.account ?? rawSession.profile ?? null;
  return {
    ...rawSession,
    token: accessToken,
    accessToken,
    refreshToken,
    user: userProfile,
  };
};

function App() {
  const [authSession, setAuthSession] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? normalizeAuthSession(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const accessToken = authSession?.accessToken ?? authSession?.token ?? "";
  const isLoggedIn = Boolean(accessToken || authSession);

  const loadBooks = useCallback(async () => {
    try {
      setBooksLoading(true);
      setBooksError("");
      const params = new URLSearchParams({ limit: "25000" });
      if (searchValue.trim()) {
        params.set("title", searchValue.trim());
      }
      const response = await fetch(`${API_BASE_URL}/books?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Unable to load catalog (${response.status})`);
      }
      const payload = await response.json();
      setBooks(payload.items ?? []);
    } catch (error) {
      setBooksError(error.message ?? "Failed to reach library API");
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  }, [searchValue]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const catalogById = useMemo(() => {
    const map = new Map();
    books.forEach((book) => {
      const id = book.book_id ?? book.id;
      if (id === undefined || id === null) return;
      map.set(id, book);
      const idAsString = id?.toString?.();
      if (idAsString) {
        map.set(idAsString, book);
      }
    });
    return map;
  }, [books]);

  const handleLogin = useCallback((sessionPayload) => {
    const payload = normalizeAuthSession(sessionPayload);
    setAuthSession(payload);
    if (payload) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setAuthSession(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const handleBookSelect = (book) => {
    if (!book) {
      setSelectedBook(null);
      return;
    }
    const bookWithLatestData = catalogById.get(book.book_id) ?? book;
    setSelectedBook(bookWithLatestData);
  };

  const authUser = authSession?.user ?? null;
  const isAdmin = isAdminUser(authUser);
  const authValue = useMemo(
    () => ({
      session: authSession,
      user: authUser,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isAdmin,
      login: handleLogin,
      logout: handleLogout,
    }),
    [accessToken, authSession, authUser, handleLogin, handleLogout, isAdmin]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                books={books}
                loading={booksLoading}
                errorMessage={booksError}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onBookSelect={handleBookSelect}
              />
            }
          />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/book"
            element={
              <BookDetailRoute
                selectedBook={selectedBook}
                books={books}
                onBookSelect={handleBookSelect}
                authSession={authSession}
                catalogById={catalogById}
              />
            }
          />
          <Route
            path="/book/:bookId"
            element={
              <BookDetailRoute
                selectedBook={selectedBook}
                books={books}
                onBookSelect={handleBookSelect}
                authSession={authSession}
                catalogById={catalogById}
              />
            }
          />
          <Route
            path="/cart"
            element={
              isLoggedIn ? <CartPage onBooksReload={loadBooks} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/account"
            element={
              isLoggedIn ? (
                <AccountSettings
                  authSession={authSession}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="circulation" element={<AdminCirculation />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="books" element={<AdminBooks />} />
          </Route>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/reset" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
