import { Link, useNavigate } from "react-router-dom";
import webshelfLogo from "../assets/webshelf-logo.png";

function SiteHeader({ isLoggedIn = false, isAdmin = false, mode = "home" }) {
  const navigate = useNavigate();
  const isCartMode = mode === "cart";
  const primaryButtonLabel = isCartMode ? "Return Home" : "Cart";
  const primaryButtonTarget = isCartMode ? "/" : "/cart";

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

      <nav className="home-nav">
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
