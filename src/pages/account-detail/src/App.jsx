import { useState } from "react";
import styles from "./AccountPage.module.css";
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
    status: "reserved",
    pickupBy: "Feb 22, 2025",
    qrRef: "#QR4521",
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
    status: "borrowing",
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

function AccountPage() {
  const [activeTab, setActiveTab] = useState("reading"); // 'cart' | 'reading' | 'history'
  const getTabButtonClass = (tab) =>
    `${styles['tabs-btn']} ${activeTab === tab ? styles['tabs-btn-active'] : ''}`.trim();

  const renderItems = () => {
    // --- CART = simple list of books ---
    if (activeTab === 'cart') {
      return (
        <div className={styles['cart-card']}>
          <div className={styles['cart-header']}>
            <p>Order Draft <span>{cartOrder.code}</span></p>
          </div>
          <div className={styles['loan-items']}>
            {cartOrder.books.map((book) => (
              <div className={styles['loan-item']} key={book.id}>
                <img className={styles['loan-cover']} src={book.cover} alt={book.title} />
                <div className={styles['loan-info']}>
                  <h3>{book.title}</h3>
                  <p className={styles['loan-author']}>By {book.author}</p>
                  <p className={styles['loan-desc']}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi eleifend enim, tristique.
                  </p>
                  <div className={styles['cart-row']}>
                    <p className={styles['loan-qty']}>Qty: {book.qty}</p>
                    <div className={styles['cart-actions']}>
                      <button className={`${styles['pill-btn']} ${styles['pill-btn-outline']}`}>Edit</button>
                      <button className={`${styles['pill-btn']} ${styles['pill-btn-outline']}`}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles['cart-footer']}>
            <button className={`${styles['pill-btn']} ${styles['pill-btn-primary']}`}>Borrow</button>
          </div>
        </div>
      );
    }

    // --- READING BOOKS = loans with multiple items ---
    if (activeTab === 'reading') {
      return readingOrders.map((order) => {
        const isReserved = order.status === "reserved";
        const stateClass = isReserved
          ? styles['loan-card-reserved']
          : styles['loan-card-borrowing'];
        const statusClass = isReserved
          ? styles['status-reserved']
          : styles['status-borrowing'];
        return (
        <div
          className={`${styles['loan-card']} ${stateClass}`}
          key={order.code}
        >
          <div className={styles['loan-items']}>
            {order.items.map((item) => (
              <div className={styles['loan-item']} key={item.id}>
                <img className={styles['loan-cover']} src={item.cover} alt={item.title} />
                <div className={styles['loan-info']}>
                  <h3>{item.title}</h3>
                  <p className={styles['loan-author']}>By {item.author}</p>
                  <p className={styles['loan-desc']}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi eleifend
                    enim, tristique.
                  </p>
                  <p className={styles['loan-qty']}>Qty: {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles['loan-card-right']}>
            <span className={`${styles['status-pill']} ${statusClass}`}>
              {isReserved ? "Reserved" : "Borrowing"}
            </span>
            <p className={styles['loan-return']}>
              {isReserved ? "Pickup By: " : "Return By: "}
              <span>{isReserved ? order.pickupBy : order.returnBy}</span>
            </p>
            {isReserved && (
              <p className={styles['loan-qr']}>
                QR Ref: <span>{order.qrRef}</span>
              </p>
            )}
            <p className={styles['loan-id']}>{order.code}</p>
            {isReserved ? (
              <div className={styles['loan-actions']}>
                <button className={`${styles['pill-btn']} ${styles['pill-btn-outline']}`}>Show QR Code</button>
                <button className={`${styles['pill-btn']} ${styles['pill-btn-danger']}`}>Cancel Reservation</button>
              </div>
            ) : (
              <button className={`${styles['pill-btn']} ${styles['pill-btn-primary']}`}>Renew</button>
            )}
          </div>
        </div>
        )
      })
    }

    // --- HISTORY = past loans with multiple items ---
    return historyOrders.map((order) => (
      <div className={styles['loan-card']} key={order.code}>
        <div className={styles['loan-items']}>
          {order.items.map((item) => (
            <div className={styles['loan-item']} key={item.id}>
              <img className={styles['loan-cover']} src={item.cover} alt={item.title} />
              <div className={styles['loan-info']}>
                <h3>{item.title}</h3>
                <p className={styles['loan-author']}>By {item.author}</p>
                <p className={styles['loan-desc']}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus morbi eleifend
                  enim, tristique.
                </p>
                <p className={styles['loan-qty']}>Qty: {item.qty}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles['loan-card-right']}>
          <p className={styles['loan-return']}>
            Returned On: <span>{order.returnedOn}</span>
          </p>
          <p className={styles['loan-id']}>{order.code}</p>
          <button className={`${styles['pill-btn']} ${styles['pill-btn-outline']}`}>Write Review</button>
        </div>
      </div>
    ))
  }

  return (
    <div className={styles['account-page']}>
      {/* Top blue header */}
      <header className={styles['account-header']}>
        <div className={styles['account-header-inner']}>
          <div className={styles['brand-block']}>
            <img src={webshelfLogo} alt="Webshelf logo" />
            <div className={styles['brand-copy']}>
              <span className={styles['brand-name']}>WEBSHELF</span>
            
            </div>
          </div>

          <div className={styles['header-right']}>
            <nav className={styles['top-nav']}>
              <a href="#">Account</a>
            </nav>
            <div className={styles['user-avatar']}>
              <span />
            </div>
          </div>
        </div>
      </header>

      {/* Main account area */}
      <main className={styles['account-main']}>
        <section className={styles['tabs-card']}>
          <button
            className={getTabButtonClass("cart")}
            onClick={() => setActiveTab("cart")}
          >
            Your Cart
          </button>
          <span className={styles['tabs-divider']} />
          <button
            className={getTabButtonClass("reading")}
            onClick={() => setActiveTab("reading")}
          >
            Reading Books
          </button>
          <span className={styles['tabs-divider']} />
          <button
            className={getTabButtonClass("history")}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </section>

        <div className={styles['search-wrapper']}>
          <span className={styles['search-icon']}>🔍</span>
          <input
            type="text"
            className={styles['search-input']}
            placeholder="Search Order"
            aria-label="Search order"
          />
        </div>

        <section className={styles['loan-list']}>{renderItems()}</section>
      </main>

      <footer className={styles['account-footer']}>
        <div className={styles['account-footer-inner']}>
          <span>2025 WEBSHELF</span>
          <div className={styles['account-footer-links']}>
            <a href="#about">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AccountPage;
