import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminBooks.module.css";
import {
  adminListBooks,
  adminCreateBook,
  adminUpdateBook,
  adminDeleteBook,
} from "../../api/admin";
import { useAuth, useAuthToken } from "../../contexts/AuthContext.jsx";

const emptyForm = {
  title: "",
  author: "",
  coverUrl: "",
  totalCopies: 5,
  availableCopies: 5,
  genres: "",
};

function AdminBooks() {
  const accessToken = useAuthToken();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const [selectedBook, setSelectedBook] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAuthError = (error) => {
    if (error?.status === 401 || /expired token/i.test(error?.message || "")) {
      setFeedback({
        type: "error",
        message: "Session expired. Please sign in again.",
      });
      logout();
      navigate("/login", { replace: true });
      return true;
    }
    return false;
  };

  useEffect(() => {
    let ignore = false;
    async function loadBooks() {
      try {
        setLoading(true);
        const params = { limit: 40 };
        const payload = await adminListBooks(params, accessToken);
        if (!ignore) {
          const items = Array.isArray(payload) ? payload : payload.items ?? [];
          setBooks(items);
        }
      } catch (error) {
        if (!ignore) {
          if (handleAuthError(error)) {
            return;
          }
          setBooks([]);
          setFeedback({ type: "error", message: error.message });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBooks();
    return () => {
      ignore = true;
    };
  }, [accessToken, refreshKey]);

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) =>
      (book.title || "").toLowerCase().includes(query)
    );
  }, [books, search]);

  const resetForm = () => {
    setFormValues(emptyForm);
    setSelectedBook(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (book) => {
    setSelectedBook(book);
    setFormValues({
      title: book.title ?? "",
      author: book.author ?? "",
      coverUrl: book.cover_url ?? "",
      totalCopies: book.inventory?.total ?? 0,
      availableCopies: book.inventory?.available ?? 0,
      genres: (book.genres || [])
        .map((genre) => genre.genre_id || genre.id || genre.name)
        .filter(Boolean)
        .join(", "),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setFeedback({ type: "", message: "" });
      const trimmedTitle = formValues.title.trim();
      const trimmedAuthor = formValues.author.trim();
      const total = Number(formValues.totalCopies) || 0;
      const payload = {
        title: trimmedTitle,
        author: trimmedAuthor,
        total,
      };
      const coverUrl = formValues.coverUrl.trim();
      if (coverUrl) {
        payload.cover_url = coverUrl;
      }
      const genreIds = formValues.genres
        ? formValues.genres
            .split(",")
            .map((genre) => Number(genre.trim()))
            .filter((id) => Number.isFinite(id) && id > 0)
        : [];
      if (genreIds.length > 0) {
        payload.genre_ids = genreIds;
      }

      if (selectedBook) {
        await adminUpdateBook(selectedBook.book_id, payload, accessToken);
        setFeedback({ type: "success", message: "Book updated." });
      } else {
        await adminCreateBook(payload, accessToken);
        setFeedback({ type: "success", message: "Book added to catalog." });
      }
      setSearch("");
      setRefreshKey((prev) => prev + 1);
      resetForm();
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Delete this book? This cannot be undone.")) return;
    try {
      await adminDeleteBook(bookId, accessToken);
      setFeedback({ type: "success", message: "Book deleted." });
      setBooks((prev) => prev.filter((book) => book.book_id !== bookId));
      if (selectedBook?.book_id === bookId) {
        resetForm();
      }
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    }
  };

  return (
    <section className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Catalog tools</p>
        <h2>Book management</h2>
        <p className={styles.subtitle}>
          Keep a few demo books ready so you can show create + update flows. Adjust the payload to
          match your backend if the schema differs.
        </p>
      </header>

      <div className={styles.searchRow}>
        <input
          type="search"
          placeholder="Search by title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {feedback.message && (
        <p
          className={
            feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess
          }
          role={feedback.type === "error" ? "alert" : undefined}
        >
          {feedback.message}
        </p>
      )}

      <div className={styles.layout}>
        <div className={styles.listPane}>
          <h3>Recent books</h3>
          {loading && <p className={styles.muted}>Loading…</p>}
          {!loading && (
            <ul>
          {filteredBooks.map((book) => (
            <li key={book.book_id}>
                  <div>
                    <p className={styles.primaryText}>{book.title}</p>
                    <p className={styles.subText}>{book.author}</p>
                  </div>
                  <div className={styles.listActions}>
                    <button type="button" onClick={() => handleEdit(book)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(book.book_id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          {!loading && filteredBooks.length === 0 && (
            <li className={styles.muted}>
              {books.length === 0 ? "No books yet." : "No books match that title."}
            </li>
          )}
        </ul>
      )}
        </div>

        <form className={styles.formPane} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h3>{selectedBook ? "Update book" : "Add a book"}</h3>
            {selectedBook && (
              <button type="button" className={styles.linkBtn} onClick={resetForm}>
                + New book
              </button>
            )}
          </div>

          <label>
            <span>Title</span>
            <input
              type="text"
              name="title"
              value={formValues.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Author</span>
            <input
              type="text"
              name="author"
              value={formValues.author}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Cover URL</span>
            <input
              type="url"
              name="coverUrl"
              value={formValues.coverUrl}
              onChange={handleChange}
              placeholder="https://"
            />
          </label>

          <div className={styles.row}>
            <label>
              <span>Total copies</span>
              <input
                type="number"
                name="totalCopies"
                min="0"
                value={formValues.totalCopies}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Available</span>
              <input
                type="number"
                name="availableCopies"
                min="0"
                value={formValues.availableCopies}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            <span>Genres (IDs, comma separated)</span>
            <input
              type="text"
              name="genres"
              value={formValues.genres}
              onChange={handleChange}
              placeholder="1, 2, 3"
            />
          </label>

          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? "Saving…" : selectedBook ? "Save changes" : "Create book"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminBooks;
