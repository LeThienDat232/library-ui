import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BookDetail.module.css";
import {
  addBookToCart,
  fetchBookReviews,
  submitBookReview,
} from "../../../api/library.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";

const defaultCover =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=60";
const fallbackBook = {
  book_id: "fallback",
  title: "Garis Waktu",
  author: "Fiersa Besari",
  cover_url: defaultCover,
  review_count: 0,
  avg_rating: null,
  rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  inventory: { total: 0, available: 0 },
  genres: [{ name: "General" }],
};

const ratingLevels = [5, 4, 3, 2, 1];

function BookDetailPage({ book, books = [], onBookSelect, authSession }) {
  const navigate = useNavigate();
  const { session: contextSession, accessToken: contextToken } = useAuth();
  const displayBook = book ?? fallbackBook;
  const genres = displayBook.genres ?? [];
  const primaryGenre = genres[0]?.name;
  const ratingValue = Number(displayBook.avg_rating ?? 0);
  const reviewCount = displayBook.review_count ?? 0;
  const availableCount = displayBook.inventory?.available ?? 0;
  const totalCount = displayBook.inventory?.total ?? 0;
  const ratingBreakdown = displayBook.rating_breakdown ?? {};
  const totalBreakdownVotes = ratingLevels.reduce(
    (sum, level) => sum + Number(ratingBreakdown[level] ?? 0),
    0
  );
  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [cartStatus, setCartStatus] = useState({ type: "idle", message: "" });
  const [cartSubmitting, setCartSubmitting] = useState(false);
  const session = authSession ?? contextSession;
  const accessToken =
    contextToken ||
    session?.accessToken ||
    session?.token ||
    "";
  const hasSession = Boolean(
    accessToken || session?.userId || session?.user?.user_id
  );

  useEffect(() => {
    if (!displayBook?.book_id) {
      setReviews([]);
      setReviewsError("");
      setReviewsLoading(false);
      return;
    }
    let ignore = false;
    const controller = new AbortController();
    async function loadReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError("");
        const payload = await fetchBookReviews(displayBook.book_id, {
          signal: controller.signal,
          accessToken,
        });
        if (!ignore) {
          setReviews(Array.isArray(payload) ? payload : []);
        }
      } catch (error) {
        if (error.name === "AbortError" || ignore) {
          return;
        }
        const unauthorized = error.status === 401;
        const notFound = error.status === 404;
        if (!ignore) {
          setReviews([]);
          if (notFound) {
            setReviewsError("");
            return;
          }
          setReviewsError(
            unauthorized
              ? hasSession
                ? "Your session expired. Please sign in again."
                : "Sign in to view community reviews."
              : error.message ?? "Failed to load reviews."
          );
        }
      } finally {
        if (!ignore) {
          setReviewsLoading(false);
        }
      }
    }
    loadReviews();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [displayBook?.book_id, accessToken, hasSession]);

  const youMightAlsoLike = useMemo(() => {
    if (!displayBook) return [];
    const sameAuthor = books.filter(
      (item) =>
        item.book_id !== displayBook.book_id && item.author === displayBook.author
    );
    const backupList = books.filter(
      (item) => item.book_id !== displayBook.book_id && item.author !== displayBook.author
    );
    const combined = sameAuthor.length > 0 ? sameAuthor : backupList;
    return combined.slice(0, 4);
  }, [books, displayBook]);

  useEffect(() => {
    setCartStatus({ type: "idle", message: "" });
    setCartSubmitting(false);
  }, [displayBook?.book_id]);

  const handleAddToCart = async () => {
    if (!displayBook?.book_id) {
      setCartStatus({
        type: "error",
        message: "We could not find this book ID.",
      });
      return;
    }
    if (!hasSession) {
      setCartStatus({
        type: "error",
        message: "Please sign in to add books to your cart.",
      });
      navigate("/login");
      return;
    }
    try {
      setCartSubmitting(true);
      setCartStatus({ type: "info", message: "Adding to cart…" });
      await addBookToCart(displayBook.book_id, 1, accessToken);
      setCartStatus({
        type: "success",
        message: "Added to your cart. View it from the Cart tab.",
      });
    } catch (error) {
      const unauthorized = error?.status === 401;
      const serverMessage =
        error?.payload?.error ||
        error?.payload?.message ||
        error?.response?.message;
      setCartStatus({
        type: "error",
        message: unauthorized
          ? "Your session expired. Please sign in again."
          : serverMessage || error.message || "Unable to add this title right now.",
      });
      if (unauthorized) {
        navigate("/login");
      }
    } finally {
      setCartSubmitting(false);
    }
  };

  return (
    <div className={styles.app}>
      <div className={styles['app-bg']} />

      <div className={styles['app-shell']}>
        {/* Top bar */}
        <header className={styles['top-bar']}>
          <button
            className={styles['icon-button']}
            aria-label="Back to home"
            type="button"
            onClick={() => navigate("/")}
          >
            ←
          </button>
        </header>

        <main className={styles['page-layout']}>
          {/* LEFT COLUMN */}
          <section className={styles['left-column']}>
            {/* MAIN BOOK CARD */}
            <section className={styles['book-card']}>
              <div className={styles['book-card-inner']}>
                <div className={styles['book-hero']}>
                  {/* Cover */}
                  <div className={styles['cover-wrapper']}>
                    <div className={styles['cover-shadow']}>
                      <div className={styles['cover-frame']}>
                        <img
                          src={displayBook.cover_url || displayBook.cover || defaultCover}
                          alt={`${displayBook.title} cover`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Main info */}
                  <div className={styles['book-main']}>
                    <div className={styles['book-heading']}>
                      <h1 className={styles['book-title']}>{displayBook.title}</h1>
                      <button className={styles['icon-squared']}>
                        <span>＋</span>
                      </button>
                    </div>

                    <div className={styles['book-meta']}>
                      <span>By {displayBook.author}</span>
                      <span className={styles.dot}>•</span>
                      <span>{primaryGenre ?? "Genre unknown"}</span>
                    </div>

                    <div className={styles['book-stats']}>
                      <div className={styles.stars}>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span className={styles['star-muted']}>★</span>
                      </div>
                      <span className={styles['stat-item']}>
                        {ratingValue ? `${ratingValue.toFixed(1)} avg rating` : "Not yet rated"}
                      </span>
                      <span className={styles['stat-dot']}>•</span>
                      <span className={styles['stat-item']}>
                        {reviewCount} review{reviewCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <button
                      className={styles['primary-btn']}
                      type="button"
                      onClick={handleAddToCart}
                      disabled={cartSubmitting}
                    >
                      {cartSubmitting ? "Adding…" : "Add To Cart"}
                    </button>
                    {cartStatus.message && (
                      <p
                        className={`${styles['cart-status']} ${
                          styles[`cart-status-${cartStatus.type}`] || ""
                        }`}
                        role={cartStatus.type === "error" ? "alert" : undefined}
                      >
                        {cartStatus.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles['book-body']}>
                    <div className={styles['book-tags']}>
                      {genres.length > 0 ? (
                        genres.map((genre) => (
                          <span className={styles.chip} key={genre.genre_id ?? genre.name}>
                            {genre.name}
                          </span>
                        ))
                      ) : (
                        <span className={styles.chip}>General</span>
                      )}
                    </div>

                  <div className={`${styles['book-section']} ${styles['details-grid']}`}>
                    <h3 className={styles['section-title']}>Book Details</h3>
                    <div className={styles['detail-columns']}>
                      <div className={styles['detail-column']}>
                        <DetailRow label="Book ID" value={displayBook.book_id} />
                        <DetailRow label="Genre" value={primaryGenre ?? "Unknown"} />
                        <DetailRow
                          label="Availability"
                          value={`${availableCount} of ${totalCount}`}
                        />
                      </div>
                      <div className={styles['detail-column']}>
                        <DetailRow
                          label="Average Rating"
                          value={
                            ratingValue ? `${ratingValue.toFixed(1)} / 5` : "Not yet rated"
                          }
                        />
                        <DetailRow label="Reviews" value={reviewCount} />
                        <DetailRow
                          label="Status"
                          value={availableCount > 0 ? "Available" : "Out of stock"}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* RATINGS & REVIEWS */}
            <section className={styles['ratings-card']}>
              <div className={styles['ratings-header']}>
                <h2>Ratings &amp; Reviews</h2>
                <button className={styles['secondary-btn']}>Write A Review</button>
              </div>

              <form
                className={styles['rate-box']}
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!hasSession) {
                    setReviewsError("You must borrow this book before reviewing.");
                    return;
                  }
                  try {
                    setReviewSubmitting(true);
                    setReviewsError("");
                    const created = await submitBookReview(
                      displayBook.book_id,
                      { rating: reviewRating, body: reviewText },
                      accessToken
                    );
                    setReviewText("");
                    setReviewRating(5);
                    const normalizedReview = (() => {
                      if (!created || typeof created !== "object") return null;
                      if (created.review && typeof created.review === "object") {
                        return created.review;
                      }
                      if (
                        created.data &&
                        typeof created.data === "object" &&
                        !Array.isArray(created.data)
                      ) {
                        return created.data;
                      }
                      if (Array.isArray(created.items) && created.items.length > 0) {
                        return created.items[0];
                      }
                      return created;
                    })();
                    if (
                      normalizedReview &&
                      typeof normalizedReview === "object" &&
                      (normalizedReview.review_id !== undefined ||
                        normalizedReview.rating !== undefined ||
                        normalizedReview.body ||
                        normalizedReview.comment ||
                        normalizedReview.text)
                    ) {
                      setReviews((prev) => [normalizedReview, ...prev]);
                    }
                  } catch (error) {
                    setReviewsError(error.message ?? "Unable to submit review.");
                  } finally {
                    setReviewSubmitting(false);
                  }
                }}
              >
                <div className={styles['rate-avatar']}>
                  <span>👤</span>
                </div>
                <div className={styles['rate-content']}>
                  <p className={styles['rate-title']}>Rate This Book</p>
                  <select
                    className={styles['rate-select']}
                    value={reviewRating}
                    onChange={(event) => setReviewRating(Number(event.target.value))}
                    disabled={!hasSession || reviewSubmitting}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} Star{value === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={styles['rate-input']}
                    placeholder={
                      hasSession
                        ? "Share your thoughts..."
                        : "Borrow this title to leave a review."
                    }
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    disabled={!hasSession || reviewSubmitting}
                  />
                  <button
                    type="submit"
                    className={styles['submit-review']}
                    disabled={!hasSession || reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>

              <div className={styles['reviews-list']}>
                {reviewsLoading && <p className={styles['section-text']}>Loading reviews…</p>}
                {reviewsError && (
                  <p className={styles['section-text']} role="alert">
                    {reviewsError}
                  </p>
                )}
                {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                  <p className={styles['section-text']}>No reviews yet.</p>
                )}
                {reviews.map((review) => (
                  <ReviewItem
                    key={review.review_id ?? review.title}
                    title={review.title ?? displayBook.title}
                    date={review.createdAt ?? ""}
                    rating={Number(review.rating ?? 0)}
                    text={review.body ?? review.text}
                  />
                ))}
              </div>
            </section>
          </section>

          {/* RIGHT COLUMN */}
          <section className={styles['right-column']}>
            {/* YOU MIGHT ALSO LIKE */}
            <section className={styles['recommend-card']}>
              <h2 className={styles['recommend-title']}>You Might Also Like</h2>

              {youMightAlsoLike.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.book_id}
                  book={suggestion}
                  onSelect={() => {
                    if (onBookSelect) {
                      onBookSelect(suggestion);
                      navigate("/book");
                    }
                  }}
                />
              ))}
            </section>

            {/* COMMUNITY REVIEWS */}
            <section className={styles['community-card']}>
              <h2>Community Reviews</h2>

              <div className={styles['community-main']}>
                <div className={styles['community-score']}>
                  <div className={styles.stars}>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span className={styles['star-muted']}>★</span>
                  </div>
                  <p className={styles['score-number']}>
                    {ratingValue ? ratingValue.toFixed(1) : "0.0"} <span>/ 5</span>
                  </p>
                  <p className={styles['score-sub']}>
                    {reviewCount} rating{reviewCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className={styles['score-bars']}>
                  {ratingLevels.map((level) => (
                    <ScoreRow
                      key={level}
                      label={level}
                      percent={
                        totalBreakdownVotes
                          ? Math.round(
                              (Number(ratingBreakdown[level] ?? 0) / totalBreakdownVotes) * 100
                            )
                          : 0
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

/* Small dumb presentational components */

function DetailRow({ label, value }) {
  return (
    <div className={styles['detail-row']}>
      <span className={styles['detail-label']}>{label}</span>
      <span className={styles['detail-value']}>{value}</span>
    </div>
  );
}

function ReviewItem({ title, date, rating, text }) {
  return (
    <article className={styles['review-item']}>
      <div className={styles['review-avatar']}>👤</div>
      <div className={styles['review-body']}>
        <div className={styles['review-header']}>
          <h3 className={styles['review-title']}>{title}</h3>
          <span className={styles['review-date']}>{date}</span>
        </div>
        <div className={`${styles.stars} ${styles.small}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={i + 1 <= rating ? undefined : styles['star-muted']}
            >
              ★
            </span>
          ))}
        </div>
        {text && <p className={styles['review-text']}>{text}</p>}
      </div>
    </article>
  );
}

function SuggestionItem({ book, onSelect }) {
  const { title, author, review_count, cover_url, cover } = book;
  return (
    <button type="button" className={styles['suggestion-item']} onClick={onSelect}>
      <div className={styles['suggestion-cover']}>
        <img src={cover_url || cover || defaultCover} alt={title} />
      </div>
      <div className={styles['suggestion-info']}>
        <h3 className={styles['suggestion-title']}>{title}</h3>
        <p className={styles['suggestion-author']}>By {author}</p>
        <div className={styles['suggestion-meta']}>
          <div className={`${styles.stars} ${styles.tiny}`}>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span className={styles['star-muted']}>★</span>
          </div>
          <span className={styles['suggestion-votes']}>
            {review_count ?? 0} review{(review_count ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
        <p className={styles['suggestion-desc']}>
          {`More from ${author}. Discover additional favorites from our catalog.`}
        </p>
      </div>
    </button>
  );
}

function ScoreRow({ label, percent }) {
  return (
    <div className={styles['score-row']}>
      <span className={styles['score-label']}>{label}</span>
      <div className={styles['score-bar-track']}>
        <div
          className={styles['score-bar-fill']}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={styles['score-percent']}>{percent}%</span>
    </div>
  );
}

export default BookDetailPage;
