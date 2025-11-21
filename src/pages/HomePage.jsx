import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import webshelfLogo from "../assets/webshelf-logo.png";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=60";

const RECOMMENDATION_OPTIONS = [
  { id: "popular", label: "Trending" },
  { id: "top-rated", label: "Top Rated" },
  { id: "new-arrivals", label: "New Arrivals" },
  { id: "available", label: "Available Now" },
];
const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 10;

const clampRatingValue = (value) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 5) return 5;
  return value;
};

const getBookRatingValue = (book) => {
  if (!book || typeof book !== "object") {
    return 0;
  }
  const candidates = [
    book.avg_rating,
    book.average_rating,
    book.averageRating,
    book.rating,
  ];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) {
      return clampRatingValue(numeric);
    }
  }
  return 0;
};

const renderRatingStars = (id, ratingValue) => {
  const safeRating = clampRatingValue(ratingValue);
  const filledStars = Math.round(safeRating);
  return Array.from({ length: 5 }, (_, idx) => (
    <span
      key={`${id}-star-${idx}`}
      className={idx < filledStars ? "" : "home-star-muted"}
    >
      ★
    </span>
  ));
};

function HomePage({
  isLoggedIn,
  isAdmin = false,
  books = [],
  loading,
  errorMessage,
  searchValue = "",
  onSearchChange,
  onBookSelect,
}) {
  const navigate = useNavigate();
  const [activeGenre, setActiveGenre] = useState("All");
  const [recommendationFilter, setRecommendationFilter] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const openExternal = useCallback((targetUrl) => {
    if (!targetUrl || typeof window === "undefined") {
      return;
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleBookSelection = (book) => {
    if (onBookSelect) {
      onBookSelect(book);
    }
    navigate("/book");
  };

  const safeBooks = useMemo(
    () => (Array.isArray(books) ? books : []),
    [books],
  );

  const genreOptions = useMemo(() => {
    const genreMap = new Map();
    safeBooks.forEach((book) =>
      book.genres?.forEach((genre) => {
        const current = genreMap.get(genre.name) ?? { name: genre.name, count: 0 };
        current.count += 1;
        genreMap.set(genre.name, current);
      }),
    );
    return Array.from(genreMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 13);
  }, [safeBooks]);

  const trendingBooks = useMemo(() => {
    const list = [...safeBooks].sort(
      (a, b) => (b.review_count ?? 0) - (a.review_count ?? 0),
    );
    return list.slice(0, 12);
  }, [safeBooks]);

  const filteredBooks = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return safeBooks.filter((book) => {
      const title = book.title?.toLowerCase() ?? "";
      const author = book.author?.toLowerCase() ?? "";
      const matchesQuery = query
        ? title.includes(query) || author.includes(query)
        : true;
      const matchesGenre =
        activeGenre === "All"
        || book.genres?.some((genre) => genre.name === activeGenre);
      return matchesQuery && matchesGenre;
    });
  }, [safeBooks, searchValue, activeGenre]);

  const sortedBooks = useMemo(() => {
    const list = [...filteredBooks];
    switch (recommendationFilter) {
      case "top-rated":
        list.sort(
          (a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0),
        );
        break;
      case "new-arrivals":
        list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );
        break;
      case "available":
        list.sort(
          (a, b) =>
            (b.inventory?.available ?? 0) - (a.inventory?.available ?? 0),
        );
        break;
      case "popular":
      default:
        list.sort(
          (a, b) => (b.review_count ?? 0) - (a.review_count ?? 0),
        );
        break;
    }
    return list;
  }, [filteredBooks, recommendationFilter]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [searchValue, activeGenre, recommendationFilter]);

  useEffect(() => {
    setVisibleCount((prev) =>
      Math.min(prev, Math.max(sortedBooks.length, INITIAL_VISIBLE)),
    );
  }, [sortedBooks.length]);

  useEffect(() => {
    let lastScroll = 0;
    let ticking = false;

    const handleScroll = () => {
      const now = Date.now();

      // Throttle to run at most once every 150ms
      if (now - lastScroll < 150) {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
          });
        }
        return;
      }

      lastScroll = now;
      setShowScrollTop(window.scrollY > 400);

      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setVisibleCount((prev) => {
          if (prev >= sortedBooks.length) {
            return prev;
          }
          return Math.min(prev + LOAD_MORE_STEP, sortedBooks.length);
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sortedBooks.length]);

  useEffect(() => {
    const node = footerRef.current;
    if (!node) {
      return undefined;
    }

    const updateHeight = () => {
      setFooterHeight(node.offsetHeight || 0);
    };

    updateHeight();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(node);
    }

    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const reservedFooterOffset = Math.max(footerHeight + 20, 280);
  const homeAppStyle = useMemo(
    () => ({ "--home-footer-effective": `${reservedFooterOffset}px` }),
    [reservedFooterOffset],
  );

  const featuredBooks = sortedBooks.slice(0, visibleCount);
  const descriptorParts = [];
  if (activeGenre !== "All") {
    descriptorParts.push(`in ${activeGenre}`);
  }
  if (searchValue.trim()) {
    descriptorParts.push(`matching “${searchValue.trim()}”`);
  }
  const resultsSubtitle = descriptorParts.join(" ");

  return (
    <div className="home-app" style={homeAppStyle}>
      {/* HEADER */}
      <header className="home-header">
        <Link
          to="/"
          className="home-brand"
          aria-label="Go to the Webshelf homepage"
        >
          <span className="home-brand-name">WEBSHELF</span>
          <span className="brand-divider" />
          <img src={webshelfLogo} alt="Webshelf logo" />
        </Link>

        <nav className="home-nav">
          <button
            type="button"
            className="home-cart-btn"
            onClick={() => navigate(isLoggedIn ? "/cart" : "/login")}
          >
            Cart
          </button>
          {isAdmin && (
            <button
              type="button"
              className="home-admin-btn"
              onClick={() => navigate("/admin")}
            >
              Admin
            </button>
          )}
          {isLoggedIn ? (
            <button
              type="button"
              className="home-avatar-btn"
              onClick={() => navigate("/account")}
              aria-label="Open account settings"
            >
              <span>👤</span>
            </button>
          ) : (
            <button
              type="button"
              className="home-login-btn"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-body">
            <div className="home-hero-text">
              <h1>MEET YOUR NEXT FAVORITE BOOK.</h1>
              <p className="home-hero-desc">What Will You Discover?</p>

              <form
                className="home-search-box"
                onSubmit={(event) => event.preventDefault()}
              >
                <span className="home-search-icon">🔍</span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  placeholder="Search by title or author"
                  aria-label="Search book"
                />
                {searchValue && (
                  <button
                    type="button"
                    className="home-clear-search"
                    onClick={() => onSearchChange?.("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </form>
            </div>

            <div className="home-hero-panel">
              <div className="panel-shape" />
              <div className="panel-ring" />
              <div className="panel-dots" />
              <div className="panel-dots panel-dots--low" />
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section className="home-trending">
        <div className="home-section-inner">
          <h2 className="home-section-title">Trending</h2>
          <div className="home-trending-marquee">
            <div className="home-trending-track">
              {[...trendingBooks, ...trendingBooks].map((book, idx) => {
                const ratingValue = getBookRatingValue(book);
                const ratingLabel = clampRatingValue(ratingValue).toFixed(1);
                const ratingKey =
                  book.book_id ??
                  book.id ??
                  `${book.title ?? "book"}-trend-${idx}`;
                const starElements = renderRatingStars(ratingKey, ratingValue);
                return (
                  <article
                  className="home-trending-card"
                  key={`${book.book_id ?? book.title}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleBookSelection(book)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleBookSelection(book);
                    }
                  }}
                >
                  <div className="home-cover home-cover-tall">
                    <img
                      src={book.cover_url || book.cover || FALLBACK_COVER}
                      alt={book.title}
                    />
                  </div>
                  <div className="home-book-info home-trending-info">
                    <h3 className="home-book-title">{book.title}</h3>
                    <p className="home-trending-author">By {book.author}</p>
                    <div className="home-book-votes">
                      <div
                        className="home-stars home-stars-small"
                        aria-label={`Average rating ${ratingLabel} out of 5`}
                      >
                        {starElements}
                      </div>
                      <span className="home-rating-score">{ratingLabel}</span>
                      <span>
                        {book.review_count ?? 0} review
                        {(book.review_count ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="home-trending-desc">
                      {book.genres?.map((genre) => genre.name).join(", ") ||
                        "Discover this highlighted pick from our catalog."}
                    </p>
                  </div>
                </article>
              );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="home-main" id="home-catalog">
        <div className="home-section-inner home-main-grid">
          {/* SIDEBAR */}
          <aside className="home-sidebar">
            <div className="home-sidebar-block">
              <h3>Book by Genre</h3>
              <button
                type="button"
                className={`home-nav-pill ${activeGenre === "All" ? "home-nav-pill-active" : ""
                  }`}
                aria-pressed={activeGenre === "All"}
                onClick={() => setActiveGenre("All")}
              >
                All Genres
              </button>
              {genreOptions.map((genre) => (
                <button
                  type="button"
                  key={genre.name}
                  className={`home-nav-pill ${activeGenre === genre.name ? "home-nav-pill-active" : ""
                    }`}
                  aria-pressed={activeGenre === genre.name}
                  onClick={() => setActiveGenre(genre.name)}
                >
                  {genre.name}
                  <span className="home-pill-count">{genre.count}</span>
                </button>
              ))}
            </div>

            <div className="home-sidebar-block">
              <h3>Recommendations</h3>
              {RECOMMENDATION_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`home-sidebar-link ${recommendationFilter === option.id
                      ? "home-sidebar-link-active"
                      : ""
                    }`}
                  aria-pressed={recommendationFilter === option.id}
                  onClick={() => setRecommendationFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </aside>

          {/* BOOK LIST */}
          <div className="home-book-list">
            {!loading && !errorMessage && filteredBooks.length > 0 && (
              <p className="home-results-meta">
                Showing {filteredBooks.length} book
                {filteredBooks.length === 1 ? "" : "s"}
                {resultsSubtitle ? ` ${resultsSubtitle}` : ""}
              </p>
            )}
            {loading && <p className="home-loading-copy">Loading catalog…</p>}
            {errorMessage && (
              <p className="home-error-copy" role="alert">
                {errorMessage}
              </p>
            )}
            {!loading && !errorMessage && featuredBooks.length === 0 && (
              <p className="home-error-copy">No books available right now.</p>
            )}
            {featuredBooks.map((book, index) => {
              const ratingValue = getBookRatingValue(book);
              const ratingLabel = clampRatingValue(ratingValue).toFixed(1);
              const ratingKey =
                book.book_id ??
                book.id ??
                `${book.title ?? "book"}-list-${index}`;
              const starElements = renderRatingStars(ratingKey, ratingValue);
              return (
                <article
                className="home-book-card"
                key={book.book_id ?? book.title}
              >
                <button
                  type="button"
                  className="home-cover-btn"
                  onClick={() => handleBookSelection(book)}
                  aria-label={`View details for ${book.title}`}
                >
                  <div className="home-cover">
                    <img
                      src={book.cover_url || FALLBACK_COVER}
                      alt={book.title}
                    />
                  </div>
                </button>
                <div className="home-book-info">
                  <h3 className="home-book-title">{book.title}</h3>
                  <p className="home-book-author">By {book.author}</p>
                  <div className="home-book-votes">
                    <div
                      className="home-stars home-stars-small"
                      aria-label={`Average rating ${ratingLabel} out of 5`}
                    >
                      {starElements}
                    </div>
                    <span className="home-rating-score">{ratingLabel}</span>
                    <span>
                      {book.review_count ?? 0} review
                      {(book.review_count ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="home-book-desc">
                    {book.genres?.map((genre) => genre.name).join(", ") ||
                      "Discover this new arrival from our catalog."}
                  </p>
                  <button
                    type="button"
                    className="home-ghost-btn"
                    onClick={() => handleBookSelection(book)}
                  >
                    Borrow Now
                  </button>
                </div>
              </article>
            );
            })}
          </div>
        </div>
      </section>

      <footer className="home-footer" ref={footerRef}>
        <div className="home-footer-inner">
          <div className="home-footer-branding">
            <p className="home-footer-brand">WEBSHELF</p>
            <p className="home-footer-copy">
              The modern way to browse, borrow, and fall in love with reading again.
            </p>
          </div>
          <p className="home-footer-note">
            © {currentYear} Webshelf Library. Built for PTUDWeb demos.
          </p>
          <div className="home-footer-contact">
            <button
              type="button"
              className="home-footer-contact-link"
              onClick={() => openExternal("tel:+84123456789")}
            >
              <span className="contact-label">Phone:</span>
              <span>+84 123 456 789</span>
            </button>
            <button
              type="button"
              className="home-footer-contact-link"
              onClick={() =>
                openExternal(
                  "https://mail.google.com/mail/?view=cm&fs=1&to=webshelf@gmail.com",
                )
              }
            >
              <span className="contact-label">Email:</span>
              <span>webshelf@gmail.com</span>
            </button>
            <button
              type="button"
              className="home-footer-contact-link"
              onClick={() =>
                openExternal("https://maps.app.goo.gl/njG1LXAnWpqW6aQK8")
              }
            >
              <span className="contact-label">Address:</span>
              <span>Trường đại học Công Nghệ Thông Tin</span>
            </button>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          type="button"
          className="home-back-to-top"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default HomePage;
