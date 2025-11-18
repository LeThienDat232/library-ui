import React from "react";
import "./app.css";
import webshelfLogo from "./assets/webshelf-logo.png";

const trendingBooks = [
  {
    title: "Tentang Kamu",
    author: "Tere Liye",
    cover:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Pergi",
    author: "Tere Liye",
    cover:
      "https://images.unsplash.com/photo-1528208079127-0c566ade0f2c?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Garis Waktu",
    author: "Fiersa Besari",
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=60",
  },
];

const featuredBooks = [
  {
    title: "All The Light We Cannot See",
    author: "Anthony Doerr",
    cover:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Where The Crawdads Sing",
    author: "Delia Owens",
    cover:
      "https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
    cover:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Konspirasi Alam Semesta",
    author: "Fiersa Besari",
    cover:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=60",
  },
  {
    title: "Crazy Rich Asians",
    author: "Kevin Kwan",
    cover:
      "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=300&q=60",
  },
];

function App() {
  const heroBook = featuredBooks[0];

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
              <a href="#explorer">Explorer</a>
              <a href="#shop">Shop</a>
              <button className="home-login-btn">Log in</button>
            </nav>
          </header>

          <div className="home-hero-body">
            <div className="home-hero-text">
              <h1>MEET YOUR NEXT FAVORITE BOOK.</h1>
              <p className="home-hero-desc">What Will You Discover?</p>

              <div className="home-search-box">
                <span className="home-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search Book"
                  aria-label="Search book"
                />
              </div>
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
                <div className="home-trending-card" key={`${book.title}-${idx}`}>
                  <div className="home-cover home-cover-tall">
                    <img src={book.cover} alt={book.title} />
                  </div>
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
                <div className="home-cover">
                  <img src={book.cover} alt={book.title} />
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
          <span>2025 WEBSHELF</span>
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
