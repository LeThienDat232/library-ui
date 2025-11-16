import React from "react";
import "./app.css";
import webshelfLogo from "./assets/webshelf-logo.png";

const bookCover =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=480&q=60";

const currentReaders = [
  "https://randomuser.me/api/portraits/women/45.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
];

const suggestions = [
  {
    title: "All The Light We Cannot See",
    author: "Anthony Doerr",
    votes: "1,988,288 votes",
    cover:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=320&q=60",
  },
  {
    title: "Rich People Problems",
    author: "Kevin Kwan",
    votes: "1,988,288 votes",
    cover:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=320&q=60",
  },
  {
    title: "Where The Crawdads Sing",
    author: "Delia Owens",
    votes: "1,988,288 votes",
    cover:
      "https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=320&q=60",
  },
  {
    title: "Crazy Rich Asians",
    author: "Kevin Kwan",
    votes: "1,988,288 votes",
    cover:
      "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=320&q=60",
  },
];

function App() {
  return (
    <div className="app">
      <div className="app-bg" />

      <div className="app-shell">
        {/* Top bar */}
        <header className="top-bar">
          <button className="icon-button" aria-label="Back">
            ←
          </button>
          <div className="brand">
            <img src={webshelfLogo} alt="Webshelf logo" />
            <div className="brand-copy">
              <span className="brand-name">WEBSHELF</span>
              <span className="brand-tagline">Curated reads</span>
            </div>
          </div>
        </header>

        <main className="page-layout">
          {/* LEFT COLUMN */}
          <section className="left-column">
            {/* MAIN BOOK CARD */}
            <section className="book-card">
              <div className="book-card-inner">
                {/* Cover */}
                <div className="cover-wrapper">
                  <div className="cover-shadow">
                    <div className="cover-frame">
                      <img src={bookCover} alt="Garis Waktu cover" />
                    </div>
                  </div>
                </div>

                {/* Main info */}
                <div className="book-main">
                  <div className="book-heading">
                    <h1 className="book-title">Garis Waktu</h1>
                    <button className="icon-squared">
                      <span>＋</span>
                    </button>
                  </div>

                  <div className="book-meta">
                    <span>By Fiersa Besari</span>
                    <span className="dot">•</span>
                    <span>1 Juli 2016</span>
                  </div>

                  <div className="book-stats">
                    <div className="stars">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span className="star-muted">★</span>
                    </div>
                    <span className="stat-item">3.7M Read</span>
                    <span className="stat-dot">•</span>
                    <span className="stat-item">9.8K Votes</span>
                  </div>

                  <button className="primary-btn">Add To Cart</button>

                  <div className="book-section">
                    <h3 className="section-title">Brief Description</h3>
                    <p className="section-text">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Varius nisl sed sit aliquet nullam pretium. Velit vel
                      aliquam amet augue. Risus id purus dolor dolor. Sagittis
                      at vulputate rhoncus pharetra purus vitae ac. Sit nam
                      eleifend mauris, duis mattis eget. Viverra accumsan
                      elementum vehicula orci magna.
                    </p>
                  </div>

                  <div className="book-tags">
                    <span className="chip">Biografi</span>
                    <span className="chip">AutoBiografi</span>
                    <span className="chip">Memoar</span>
                  </div>

                  <div className="book-section details-grid">
                    <h3 className="section-title">Book Details</h3>
                    <div className="detail-columns">
                      <div className="detail-column">
                        <DetailRow label="Penerbit" value="MediaKita" />
                        <DetailRow label="Diterbitkan Tanggal" value="1 Juli 2016" />
                        <DetailRow label="Bahasa" value="Indonesia" />
                      </div>
                      <div className="detail-column">
                        <DetailRow label="Genre" value="Fiksi / Romance / Umum" />
                        <DetailRow label="Jumlah Halaman" value="210 Halaman" />
                        <DetailRow label="Keterangan" value="Selesai" />
                      </div>
                    </div>
                  </div>

                  <div className="currently-reading">
                    <p className="section-text">
                      <strong>2021</strong> people are currently reading
                    </p>
                    <div className="avatar-row">
                      {currentReaders.map((reader, index) => (
                        <span
                          className="avatar"
                          key={reader}
                          style={{ zIndex: currentReaders.length - index }}
                        >
                          <img src={reader} alt={`Reader ${index + 1}`} />
                        </span>
                      ))}
                      <span className="avatar more">+1</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* RATINGS & REVIEWS */}
            <section className="ratings-card">
              <div className="ratings-header">
                <h2>Ratings &amp; Reviews</h2>
                <button className="secondary-btn">Write A Review</button>
              </div>

              <div className="rate-box">
                <div className="rate-avatar">
                  <span>👤</span>
                </div>
                <div className="rate-content">
                  <p className="rate-title">Rate This Book</p>
                  <div className="stars large">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>
              </div>

              <div className="reviews-list">
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
          <section className="right-column">
            {/* YOU MIGHT ALSO LIKE */}
            <section className="recommend-card">
              <h2 className="recommend-title">You Might Also Like</h2>

              {suggestions.map((suggestion) => (
                <SuggestionItem key={suggestion.title} {...suggestion} />
              ))}
            </section>

            {/* COMMUNITY REVIEWS */}
            <section className="community-card">
              <h2>Community Reviews</h2>

              <div className="community-main">
                <div className="community-score">
                  <div className="stars">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span className="star-muted">★</span>
                  </div>
                  <p className="score-number">
                    4.7 <span>/ 5</span>
                  </p>
                  <p className="score-sub">18,340 ratings · 1,856 reviews</p>
                </div>

                <div className="score-bars">
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
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function ReviewItem({ title, date, rating }) {
  return (
    <article className="review-item">
      <div className="review-avatar">👤</div>
      <div className="review-body">
        <div className="review-header">
          <h3 className="review-title">{title}</h3>
          <span className="review-date">{date}</span>
        </div>
        <div className="stars small">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={i + 1 <= rating ? "" : "star-muted"}
            >
              ★
            </span>
          ))}
        </div>
        <p className="review-text">
          An audiobook was not available, so I took turns with Simon to read it
          out loud. It was very interesting to learn about another couple&apos;s
          journey and how their marriage survived the challenges of being
          shipwrecked for over one hundred and eighteen and two-thirds days.
        </p>
      </div>
    </article>
  );
}

function SuggestionItem({ title, author, votes, cover }) {
  return (
    <div className="suggestion-item">
      <div className="suggestion-cover">
        <img src={cover} alt={title} />
      </div>
      <div className="suggestion-info">
        <h3 className="suggestion-title">{title}</h3>
        <p className="suggestion-author">By {author}</p>
        <div className="suggestion-meta">
          <div className="stars tiny">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span className="star-muted">★</span>
          </div>
          <span className="suggestion-votes">{votes}</span>
        </div>
        <p className="suggestion-desc">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi
          eleifend enim.
        </p>
      </div>
    </div>
  );
}

function ScoreRow({ label, percent }) {
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="score-percent">{percent}%</span>
    </div>
  );
}

export default App;
