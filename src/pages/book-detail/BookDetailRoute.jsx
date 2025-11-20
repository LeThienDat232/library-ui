import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import BookDetailPage from "./src/App.jsx";
import { fetchBookById } from "../../api/library.js";

function BookDetailRoute({
  selectedBook,
  books,
  onBookSelect,
  authSession,
  catalogById,
}) {
  const { bookId: bookIdParam } = useParams();
  const [fetchedBook, setFetchedBook] = useState(null);
  const [loading, setLoading] = useState(Boolean(bookIdParam));
  const [errorMessage, setErrorMessage] = useState("");

  const numericBookId = useMemo(() => {
    if (!bookIdParam) return null;
    const parsed = Number.parseInt(bookIdParam, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [bookIdParam]);

  const knownBook = useMemo(() => {
    if (!bookIdParam || !catalogById?.get) return null;
    try {
      return (
        catalogById.get(bookIdParam) ??
        (numericBookId !== null ? catalogById.get(numericBookId) : null) ??
        null
      );
    } catch {
      return null;
    }
  }, [bookIdParam, catalogById, numericBookId]);

  useEffect(() => {
    if (!bookIdParam) {
      setFetchedBook(null);
      setErrorMessage("");
      setLoading(false);
      return;
    }
    if (knownBook) {
      setFetchedBook(knownBook);
      setErrorMessage("");
      setLoading(false);
      return;
    }
    let ignore = false;
    async function loadBook() {
      try {
        setLoading(true);
        setErrorMessage("");
        const payload = await fetchBookById(bookIdParam);
        if (!ignore) {
          setFetchedBook(payload);
          setErrorMessage("");
        }
      } catch (error) {
        if (!ignore) {
          setFetchedBook(null);
          setErrorMessage(error.message ?? "Unable to load this book.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadBook();
    return () => {
      ignore = true;
    };
  }, [bookIdParam, knownBook]);

  const activeBook = bookIdParam ? knownBook ?? fetchedBook : selectedBook;

  if (!bookIdParam && !activeBook) {
    return <Navigate to="/" replace />;
  }

  if (bookIdParam) {
    if (loading) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "#111827",
          }}
        >
          <p>Loading book details…</p>
        </div>
      );
    }
    if (errorMessage) {
      return <Navigate to="/" replace />;
    }
    if (!activeBook) {
      return <Navigate to="/" replace />;
    }
  }

  if (!activeBook) {
    return <Navigate to="/" replace />;
  }

  return (
    <BookDetailPage
      book={activeBook}
      books={books}
      onBookSelect={onBookSelect}
      authSession={authSession}
    />
  );
}

export default BookDetailRoute;
