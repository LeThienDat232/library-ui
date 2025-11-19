import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function HomePage({
  isLoggedIn,
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
    const handleScroll = () => {
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sortedBooks.length]);

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
    <div className="home-app">
      {/* HERO + HEADER */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <header className="home-header">
            <div className="home-brand">
              <span className="home-brand-name">WEBSHELF</span>
              <span className="brand-divider" />
              <img src={webshelfLogo} alt="Webshelf logo" />
            </div>

            <nav className="home-nav">
              <button
                type="button"
                className="home-cart-btn"
                onClick={() => navigate(isLoggedIn ? "/cart" : "/login")}
              >
                Cart
              </button>
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
              {[...trendingBooks, ...trendingBooks].map((book, idx) => (
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
                      <div className="home-stars home-stars-small">
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span className="home-star-muted">★</span>
                      </div>
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
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="home-main">
        <div className="home-section-inner home-main-grid">
          {/* SIDEBAR */}
          <aside className="home-sidebar">
            <div className="home-sidebar-block">
              <h3>Book by Genre</h3>
              <button
                type="button"
                className={`home-nav-pill ${
                  activeGenre === "All" ? "home-nav-pill-active" : ""
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
                  className={`home-nav-pill ${
                    activeGenre === genre.name ? "home-nav-pill-active" : ""
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
                  className={`home-sidebar-link ${
                    recommendationFilter === option.id
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
            {featuredBooks.map((book) => (
              <article
                className="home-book-card"
                key={book.book_id ?? book.title}
              >
                <div className="home-cover">
                  <img src={book.cover_url || FALLBACK_COVER} alt={book.title} />
                </div>
                <div className="home-book-info">
                  <h3 className="home-book-title">{book.title}</h3>
                  <p className="home-book-author">By {book.author}</p>
                  <div className="home-book-votes">
                    <div className="home-stars home-stars-small">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span className="home-star-muted">★</span>
                    </div>
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
