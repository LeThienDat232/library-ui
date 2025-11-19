import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AccountPage from "./pages/account-detail/src/App.jsx";
import BookDetailPage from "./pages/book-detail/src/App.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/login-page/src/App.jsx";
import RegisterPage from "./pages/register-page/src/App.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadBooks() {
      try {
        setBooksLoading(true);
        setBooksError("");
        const response = await fetch(
          "https://library-api-dicz.onrender.com/books?limit=40"
        );
        if (!response.ok) {
          throw new Error(`Unable to load catalog (${response.status})`);
        }
        const payload = await response.json();
        if (!ignore) {
          setBooks(payload.items ?? []);
        }
      } catch (error) {
        if (!ignore) {
          setBooksError(error.message ?? "Failed to reach library API");
          setBooks([]);
        }
      } finally {
        if (!ignore) {
          setBooksLoading(false);
        }
      }
    }

    loadBooks();
    return () => {
      ignore = true;
    };
  }, []);

  const catalogById = useMemo(() => {
    const map = new Map();
    books.forEach((book) => {
      map.set(book.book_id, book);
    });
    return map;
  }, [books]);

  const handleLogin = () => setIsLoggedIn(true);

  const handleBookSelect = (book) => {
    if (!book) {
      setSelectedBook(null);
      return;
    }
    const bookWithLatestData = catalogById.get(book.book_id) ?? book;
    setSelectedBook(bookWithLatestData);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              isLoggedIn={isLoggedIn}
              books={books}
              loading={booksLoading}
              errorMessage={booksError}
              onBookSelect={handleBookSelect}
            />
          }
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/book"
          element={
            selectedBook ? (
              <BookDetailPage book={selectedBook} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/account"
          element={
            isLoggedIn ? <AccountPage /> : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
