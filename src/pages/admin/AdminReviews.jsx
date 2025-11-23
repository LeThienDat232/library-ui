import { useCallback, useEffect, useState } from "react";
import styles from "./AdminReviews.module.css";
import {
  adminListReviews,
  adminHideReview,
  adminShowReview,
} from "../../api/admin";
import { useAuthToken } from "../../contexts/AuthContext.jsx";
import useAdminApiError from "../../hooks/useAdminApiError.js";

const statusOptions = [
  { value: "", label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];

function AdminReviews() {
  const accessToken = useAuthToken();
  const [filters, setFilters] = useState({ status: "", bookId: "", userId: "" });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const notifyAuthError = useCallback(
    (message) => setFeedback({ type: "error", message }),
    []
  );
  const handleAuthError = useAdminApiError(notifyAuthError);
  const updateReviewStatus = useCallback(
    (reviewId, nextStatus) => {
      setReviews((prev) =>
        prev.reduce((acc, review) => {
          if (review.review_id !== reviewId) {
            acc.push(review);
            return acc;
          }
          const updatedReview = { ...review, status: nextStatus };
          if (filters.status && filters.status !== nextStatus) {
            return acc;
          }
          acc.push(updatedReview);
          return acc;
        }, []),
      );
    },
    [filters.status],
  );

  useEffect(() => {
    let ignore = false;
    async function loadReviews() {
      try {
        setLoading(true);
        setFeedback({ type: "", message: "" });
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.bookId.trim()) params.book_id = filters.bookId.trim();
        if (filters.userId.trim()) params.user_id = filters.userId.trim();
        const payload = await adminListReviews(params, accessToken);
        if (!ignore) {
          setReviews(payload.rows);
        }
      } catch (error) {
        if (!ignore) {
          if (!handleAuthError(error)) {
            setFeedback({ type: "error", message: error.message });
            setReviews([]);
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      ignore = true;
    };
  }, [filters, accessToken, handleAuthError]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleHide = async (reviewId) => {
    try {
      await adminHideReview(reviewId, accessToken);
      setFeedback({ type: "success", message: "Review hidden." });
      updateReviewStatus(reviewId, "hidden");
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    }
  };

  const handleShow = async (reviewId) => {
    try {
      await adminShowReview(reviewId, accessToken);
      setFeedback({ type: "success", message: "Review shown." });
      updateReviewStatus(reviewId, "visible");
    } catch (error) {
      if (!handleAuthError(error)) {
        setFeedback({ type: "error", message: error.message });
      }
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Review moderation</p>
          <h2>Keep community comments healthy</h2>
        </div>
      </header>

      <div className={styles.filters}>
        <label>
          <span>Status</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Book ID</span>
          <input
            type="text"
            name="bookId"
            value={filters.bookId}
            onChange={handleFilterChange}
            placeholder="167171"
          />
        </label>
        <label>
          <span>User ID</span>
          <input
            type="text"
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
            placeholder="55"
          />
        </label>
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

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>User</th>
              <th>Rating</th>
              <th>Content</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => {
              const statusValue = (review.status || "").toString();
              const statusKey = statusValue
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");
              return (
                <tr key={review.review_id}>
                  <td>
                    <p className={styles.primaryText}>{review.book?.title || review.book_id}</p>
                    <p className={styles.subText}>ID: {review.book_id}</p>
                  </td>
                  <td>
                    <p className={styles.primaryText}>{review.user?.email || review.user_id}</p>
                    <p className={styles.subText}>User #{review.user_id}</p>
                  </td>
                  <td>{review.rating ?? "—"}</td>
                  <td>
                    <p className={styles.reviewBody}>
                      {review.content || review.comment || review.body || "—"}
                    </p>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${
                        styles[`status-${statusKey}`] || ""
                      }`}
                    >
                      {statusValue ? statusValue.replace(/_/g, " ") : "—"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => handleShow(review.review_id)}
                        className={styles.primaryBtn}
                      >
                        Show
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHide(review.review_id)}
                        className={styles.dangerBtn}
                      >
                        Hide
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && reviews.length === 0 && (
              <tr>
                <td colSpan="6" className={styles.emptyCell}>
                  No reviews to moderate.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" className={styles.emptyCell}>
                  Loading reviews…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminReviews;
