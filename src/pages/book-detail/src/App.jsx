import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BookDetail.module.css";

const defaultCover =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=60";
const fallbackBook = {
  book_id: "fallback",
  title: "Garis Waktu",
  author: "Fiersa Besari",
  cover_url: defaultCover,
  review_count: 0,
  avg_rating: null,
  inventory: { total: 0, available: 0 },
  genres: [{ name: "General" }],
};

const defaultSuggestions = [
  {
    title: "All The Light We Cannot See",
    author: "Anthony Doerr",
    cover_url:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=320&q=60",
    review_count: 0,
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
    cover_url:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=320&q=60",
    review_count: 0,
  },
  {
    title: "Where The Crawdads Sing",
    author: "Delia Owens",
    cover_url:
      "https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=320&q=60",
    review_count: 0,
  },
  {
    title: "Crazy Rich Asians",
    author: "Kevin Kwan",
    cover_url:
      "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=320&q=60",
    review_count: 0,
  },
];

const currentReaders = [
  "https://randomuser.me/api/portraits/women/45.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
];

function BookDetailPage({ book, books = [] }) {
  const navigate = useNavigate();
  const displayBook = book ?? fallbackBook;
  const genres = displayBook.genres ?? [];
  const primaryGenre = genres[0]?.name;
  const ratingValue = Number(displayBook.avg_rating ?? 0);
  const reviewCount = displayBook.review_count ?? 0;
  const availableCount = displayBook.inventory?.available ?? 0;
  const totalCount = displayBook.inventory?.total ?? 0;

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
    if (!combined.length) {
      return defaultSuggestions;
    }
    return combined.slice(0, 4);
  }, [books, displayBook]);

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

                    <button className={styles['primary-btn']}>Add To Cart</button>
                  </div>
                </div>

                <div className={styles['book-body']}>
                  <div className={styles['book-section']}>
                    <h3 className={styles['section-title']}>Brief Description</h3>
                    <p className={styles['section-text']}>
                      {displayBook.description ??
                        "Discover more about this title directly from our library catalog. Detailed descriptions will appear here once available."}
                    </p>
                  </div>

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

                  <div className={styles['currently-reading']}>
                    <p className={styles['section-text']}>
                      <strong>{Math.max(totalCount - availableCount, 0)}</strong>{" "}
                      copies currently on loan
                    </p>
                    <div className={styles['avatar-row']}>
                      {currentReaders.map((reader, index) => (
                        <span
                          className={styles.avatar}
                          key={reader}
                          style={{ zIndex: currentReaders.length - index }}
                        >
                          <img src={reader} alt={`Reader ${index + 1}`} />
                        </span>
                      ))}
                      <span className={`${styles.avatar} ${styles.more}`}>+1</span>
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

              <div className={styles['rate-box']}>
                <div className={styles['rate-avatar']}>
                  <span>👤</span>
                </div>
                <div className={styles['rate-content']}>
                  <p className={styles['rate-title']}>Rate This Book</p>
                  <div className={`${styles.stars} ${styles.large}`}>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>
              </div>

              <div className={styles['reviews-list']}>
                <ReviewItem
                  title="Crazy Rich Asians"
                  date="Jan 28, 2025"
                  rating={5}
                />
                <ReviewItem
                  title="Crazy Rich Asians"
                  date="Jan 28, 2025"
                  rating={4}
                />
                <ReviewItem
                  title="Crazy Rich Asians"
                  date="Jan 28, 2025"
                  rating={4}
                />
              </div>
            </section>
          </section>

          {/* RIGHT COLUMN */}
          <section className={styles['right-column']}>
            {/* YOU MIGHT ALSO LIKE */}
            <section className={styles['recommend-card']}>
              <h2 className={styles['recommend-title']}>You Might Also Like</h2>

              {youMightAlsoLike.map((suggestion) => (
                <SuggestionItem key={suggestion.book_id} {...suggestion} />
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
                    4.7 <span>/ 5</span>
                  </p>
                  <p className={styles['score-sub']}>18,340 ratings · 1,856 reviews</p>
                </div>

                <div className={styles['score-bars']}>
                  <ScoreRow label="5" percent={86} />
                  <ScoreRow label="4" percent={61} />
                  <ScoreRow label="3" percent={12} />
                  <ScoreRow label="2" percent={5} />
                  <ScoreRow label="1" percent={8} />
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

function ReviewItem({ title, date, rating }) {
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
        <p className={styles['review-text']}>
          An audiobook was not available, so I took turns with Simon to read it
          out loud. It was very interesting to learn about another couple&apos;s
          journey and how their marriage survived the challenges of being
          shipwrecked for over one hundred and eighteen and two-thirds days.
        </p>
      </div>
    </article>
  );
}

function SuggestionItem({ title, author, review_count, cover_url, cover }) {
  return (
    <div className={styles['suggestion-item']}>
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
    </div>
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
