import React from "react";
import "./app.css";

const trendingBooks = [
  { title: "Tentang Kamu", author: "Tere Liye" },
  { title: "Pergi", author: "Tere Liye" },
  { title: "Garis Waktu", author: "Fiersa Besari" },
  { title: "Becoming", author: "Michelle Obama" },
  { title: "Becoming", author: "Michelle Obama" },
];

const featuredBooks = [
  {
    title: "All The Light We Cannot See",
    author: "Anthony Doerr",
  },
  {
    title: "Where The Crawdads Sing",
    author: "Delia Owens",
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
  },
  {
    title: "Konspirasi Alam Semesta",
    author: "Fiersa Besari",
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
  },
];

function App() {
  return (
    <div className="home-app">
      {/* HERO + HEADER */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <header className="home-header">
            <div className="home-logo">
              <span className="home-logo-text">WEBSHELF</span>
              <span className="home-logo-icon">📚</span>
            </div>

            <nav className="home-nav">
              <a href="#explorer">Explorer</a>
              <a href="#shop">Shop</a>
              <a href="#blog">Blog</a>
              <button className="home-login-btn">Log in</button>
            </nav>
          </header>

          <div className="home-hero-body">
            <div className="home-hero-text">
              <h1>MEET YOUR NEXT FAVORITE BOOK.</h1>
              <p className="home-hero-sub">What Will You Discover?</p>

              <div className="home-search-box">
                <span className="home-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search Book"
                  aria-label="Search book"
                />
              </div>
            </div>

            {/* blue abstract shape */}
            <div className="home-hero-shape" />
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section className="home-trending">
        <div className="home-section-inner">
          <h2 className="home-section-title">Trending</h2>
          <div className="home-trending-row">
            {trendingBooks.map((book, idx) => (
              <div className="home-trending-card" key={idx}>
                <div className="home-cover home-cover-tall" />
                <div className="home-book-meta">
                  <h3>{book.title}</h3>
                  <p className="home-book-author">{book.author}</p>
                  <div className="home-stars">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span className="home-star-muted">★</span>
                  </div>
                </div>
              </div>
            ))}
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
              <button className="home-nav-pill home-nav-pill-active">
                All Genres
              </button>
              <button className="home-nav-pill">Business</button>
              <button className="home-nav-pill">Science</button>
              <button className="home-nav-pill">Fiction</button>
              <button className="home-nav-pill">Philosophy</button>
              <button className="home-nav-pill">Biography</button>
            </div>

            <div className="home-sidebar-block">
              <h3>Recommendations</h3>
              <button className="home-sidebar-link">Artist of the Month</button>
              <button className="home-sidebar-link">Book of the Year</button>
              <button className="home-sidebar-link">Top Genre</button>
              <button className="home-sidebar-link">Trending</button>
            </div>
          </aside>

          {/* BOOK LIST */}
          <div className="home-book-list">
            {featuredBooks.map((book, index) => (
              <article className="home-book-card" key={index}>
                <div className="home-cover" />
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
                    <span>1,988,288 voters</span>
                  </div>
                  <p className="home-book-desc">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Purus morbi eleifend enim, tristique.
                  </p>
                  <button className="home-ghost-btn">Buy Now</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <span>2020 MYBOOK</span>
          <div className="home-footer-links">
            <a href="#explorer">Explorer</a>
            <a href="#shop">Shop</a>
            <a href="#about">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
