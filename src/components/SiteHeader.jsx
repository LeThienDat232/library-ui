import { Link, useNavigate } from "react-router-dom";
import webshelfLogo from "../assets/webshelf-logo.png";

function SiteHeader({
  isLoggedIn = false,
  isAdmin = false,
  mode = "home",
  showSearch = false,
  searchValue = "",
  onSearchChange,
}) {
  const navigate = useNavigate();
  const isCartMode = mode === "cart";
  const primaryButtonLabel = isCartMode ? "Return Home" : "Cart";
  const primaryButtonTarget = isCartMode ? "/" : "/cart";
  const shouldRenderSearch = showSearch && typeof onSearchChange === "function";

  return (
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

      <nav className={`home-nav${shouldRenderSearch ? " home-nav--search" : ""}`}>
        {shouldRenderSearch && (
          <form
            className="home-search-box home-header-search"
            onSubmit={(event) => event.preventDefault()}
          >
            <span className="home-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by title or author"
              aria-label="Search catalog"
            />
            {searchValue && (
              <button
                type="button"
                className="home-clear-search"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
        )}
        {isLoggedIn && (
          <button
            type="button"
            className="home-cart-btn"
            onClick={() => navigate(primaryButtonTarget)}
          >
            {primaryButtonLabel}
          </button>
        )}
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
            <span role="img" aria-hidden="true">
              👤
            </span>
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
  );
}

export default SiteHeader;
