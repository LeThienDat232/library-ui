import { useState } from "react";
import "./App.css";
import webshelfLogo from "./assets/webshelf-logo.png";

const cartOrder = {
  code: "#CART01",
  books: [
    {
      id: "C1",
      title: "All The Light We Cannot See",
      author: "Anthony Doerr",
      cover:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=60",
      qty: 1,
    },
    {
      id: "C2",
      title: "Rich People Problems",
      author: "Kevin Kwan",
      cover:
        "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=300&q=60",
      qty: 2,
    },
  ],
};

/** Each object = ONE loan (ticket), with multiple books inside `items` */
const readingOrders = [
  {
    code: "#12000",
    returnBy: "Feb 22, 2025",
    items: [
      {
        id: "B1",
        title: "All The Light We Cannot See",
        author: "Anthony Doerr",
        cover:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=60",
        qty: 1,
      },
      {
        id: "B2",
        title: "Rich People Problems",
        author: "Kevin Kwan",
        cover:
          "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=300&q=60",
        qty: 1,
      },
    ],
  },
  {
    code: "#12001",
    returnBy: "Mar 22, 2025",
    items: [
      {
        id: "B3",
        title: "Crazy Rich Asians",
        author: "Kevin Kwan",
        cover:
          "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=300&q=60",
        qty: 2,
      },
    ],
  },
];

/** History: past loans, also with multiple items per order */
const historyOrders = [
  {
    code: "#11001",
    borrowedOn: "Oct 12, 2024",
    returnedOn: "Dec 12, 2024",
    items: [
      {
        id: "H1",
        title: "Where The Crawdads Sing",
        author: "Delia Owens",
        cover:
          "https://images.unsplash.com/photo-1455885666463-1f31f32b4fe5?auto=format&fit=crop&w=300&q=60",
        qty: 1,
      },
      {
        id: "H2",
        title: "Becoming",
        author: "Michelle Obama",
        cover:
          "https://images.unsplash.com/photo-1544937950-fa07a98d237f?auto=format&fit=crop&w=300&q=60",
        qty: 1,
      },
    ],
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("reading"); // 'cart' | 'reading' | 'history'

  const renderItems = () => {
    // --- CART = simple list of books ---
    if (activeTab === 'cart') {
      return (
        <div className="cart-card">
          <div className="cart-header">
            <p>Order Draft <span>{cartOrder.code}</span></p>
          </div>
          <div className="loan-items">
            {cartOrder.books.map((book) => (
              <div className="loan-item" key={book.id}>
                <img className="loan-cover" src={book.cover} alt={book.title} />
                <div className="loan-info">
                  <h3>{book.title}</h3>
                  <p className="loan-author">By {book.author}</p>
                  <p className="loan-desc">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi eleifend enim, tristique.
                  </p>
                  <div className="cart-row">
                    <p className="loan-qty">Qty: {book.qty}</p>
                    <div className="cart-actions">
                      <button className="pill-btn pill-btn-outline">Edit</button>
                      <button className="pill-btn pill-btn-outline">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <button className="pill-btn pill-btn-primary">Borrow</button>
          </div>
        </div>
      );
    }

    // --- READING BOOKS = loans with multiple items ---
    if (activeTab === 'reading') {
      return readingOrders.map((order) => (
        <div className="loan-card" key={order.code}>
          <div className="loan-items">
            {order.items.map((item) => (
              <div className="loan-item" key={item.id}>
                <img className="loan-cover" src={item.cover} alt={item.title} />
                <div className="loan-info">
                  <h3>{item.title}</h3>
                  <p className="loan-author">By {item.author}</p>
                  <p className="loan-desc">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi eleifend
                    enim, tristique.
                  </p>
                  <p className="loan-qty">Qty: {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="loan-card-right">
            <p className="loan-return">
              Return By: <span>{order.returnBy}</span>
            </p>
            <p className="loan-id">{order.code}</p>
            <button className="pill-btn pill-btn-primary">Renew</button>
          </div>
        </div>
      ))
    }

    // --- HISTORY = past loans with multiple items ---
    return historyOrders.map((order) => (
      <div className="loan-card" key={order.code}>
        <div className="loan-items">
          {order.items.map((item) => (
            <div className="loan-item" key={item.id}>
              <img className="loan-cover" src={item.cover} alt={item.title} />
              <div className="loan-info">
                <h3>{item.title}</h3>
                <p className="loan-author">By {item.author}</p>
                <p className="loan-desc">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi eleifend
                  enim, tristique.
                </p>
                <p className="loan-qty">Qty: {item.qty}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="loan-card-right">
          <p className="loan-return">
            Returned On: <span>{order.returnedOn}</span>
          </p>
          <p className="loan-id">{order.code}</p>
          <button className="pill-btn pill-btn-outline">Write Review</button>
        </div>
      </div>
    ))
  }

  return (
    <div className="account-page">
      {/* Top blue header */}
      <header className="account-header">
        <div className="account-header-inner">
          <div className="brand-block">
            <img src={webshelfLogo} alt="Webshelf logo" />
            <div className="brand-copy">
              <span className="brand-name">WEBSHELF</span>
            
            </div>
          </div>

          <div className="header-right">
            <nav className="top-nav">
              <a href="#">Explorer</a>
              <a href="#">Shop</a>
            </nav>
            <div className="user-avatar">
              <span />
            </div>
          </div>
        </div>
      </header>

      {/* Main account area */}
      <main className="account-main">
        <section className="tabs-card">
          <button
            className={`tabs-btn ${activeTab === "cart" ? "active" : ""}`}
            onClick={() => setActiveTab("cart")}
          >
            Your Cart
          </button>
          <span className="tabs-divider" />
          <button
            className={`tabs-btn ${activeTab === "reading" ? "active" : ""}`}
            onClick={() => setActiveTab("reading")}
          >
            Reading Books
          </button>
          <span className="tabs-divider" />
          <button
            className={`tabs-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </section>

        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search Order"
            aria-label="Search order"
          />
        </div>

        <section className="loan-list">{renderItems()}</section>
      </main>

      <footer className="account-footer">
        <div className="account-footer-inner">
          <span>2025 WEBSHELF</span>
          <div className="account-footer-links">
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
