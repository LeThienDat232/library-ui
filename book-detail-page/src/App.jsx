import './App.css'
import webshelfLogo from './assets/webshelf-logo.png'

const trendingBooks = [
  {
    title: 'Tentang Kamu',
    author: 'Tere Liye',
    cover:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Pergi',
    author: 'Tere Liye',
    cover:
      'https://images.unsplash.com/photo-1528208079127-0c566ade0f2c?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Garis Waktu',
    author: 'Fiersa Besari',
    cover:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Becoming',
    author: 'Michelle Obama',
    cover:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Where The Crawdads Sing',
    author: 'Delia Owens',
    cover:
      'https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Crazy Rich Asians',
    author: 'Kevin Kwan',
    cover:
      'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=300&q=60',
  },
]

const featuredBooks = [
  {
    title: 'All The Light We Cannot See',
    author: 'Anthony Doerr',
    voters: '1,988,288',
    cover:
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Where The Crawdads Sing',
    author: 'Delia Owens',
    voters: '1,988,288',
    cover:
      'https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Rich People Problems',
    author: 'Kevin Kwan',
    voters: '1,988,288',
    cover:
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Becoming',
    author: 'Michelle Obama',
    voters: '1,988,288',
    cover:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=60',
  },
  {
    title: 'Konspirasi Alam Semesta',
    author: 'Fiersa Besari',
    voters: '1,988,288',
    cover:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=60',
  },
]

const genres = [
  'All Genres',
  'Business',
  'Science',
  'Fiction',
  'Philosophy',
  'Biography',
]

const recommendations = [
  'Artist of the Month',
  'Book of the Year',
  'Top Genre',
  'Trending',
]

function App() {
  return (
    <div className="page">
      <header className="hero">
        <nav className="hero__nav">
          <div className="brand">
            <img src={webshelfLogo} alt="Webshelf logo" className="brand-logo" />
            <span className="brand-title">WEBSHELF</span>
          </div>
          <div className="nav-links">
            <a href="#discover">Explorer</a>
            <a href="#shop">Shop</a>
            <a href="#blog">Blog</a>
          </div>
          <button className="btn btn--ghost">Log in</button>
        </nav>
        <div className="hero__body">
          <div className="hero__text">
            <p className="eyebrow">What Will You Discover?</p>
            <h1>MEET YOUR NEXT FAVORITE BOOK.</h1>
            <div className="search-bar">
              <input type="text" placeholder="Search Book" aria-label="Search" />
              <button className="btn btn--search">Search</button>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <div className="hero__blob" />
            <div className="hero__circle" />
            <div className="hero__dots hero__dots--top" />
            <div className="hero__dots hero__dots--bottom" />
          </div>
        </div>
      </header>

      <main>
        <section className="section section--trending">
          <div className="section-header">
            <h2>Trending</h2>
            <button className="link-button">View all</button>
          </div>
          <div className="trending-grid">
            {trendingBooks.map((book) => (
              <div key={book.title} className="trending-card">
                <img src={book.cover} alt={book.title} />
                <p className="book-title">{book.title}</p>
                <p className="book-author">{book.author}</p>
                <div className="rating" aria-label="rating">
                  {'★'.repeat(5)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section--catalogue">
          <aside className="catalogue-sidebar">
            <div className="sidebar-block">
              <h3>Book by Genre</h3>
              <ul>
                {genres.map((genre) => (
                  <li key={genre} className={genre === 'All Genres' ? 'active' : ''}>
                    {genre}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sidebar-block">
              <h3>Recommendations</h3>
              <ul>
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="catalogue-grid">
            {featuredBooks.map((book) => (
              <article key={book.title} className="featured-card">
                <img src={book.cover} alt={book.title} />
                <div className="featured-content">
                  <h4>{book.title}</h4>
                  <p className="book-author">By {book.author}</p>
                  <p className="rating">
                    ★★★★☆ <span>{book.voters} voters</span>
                  </p>
                  <p className="book-description">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi
                    eleifend enim, tristique.
                  </p>
                  <button className="btn btn--primary">Buy Now</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>2020 MYBOOK</p>
        <div className="footer-links">
          <a href="#explorer">Explorer</a>
          <a href="#shop">Shop</a>
          <a href="#about">About</a>
        </div>
      </footer>
    </div>
  )
}

export default App
