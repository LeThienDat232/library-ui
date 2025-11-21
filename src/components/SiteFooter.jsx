import { forwardRef, useCallback, useMemo } from "react";

const SiteFooter = forwardRef(function SiteFooter(_, ref) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const openExternal = useCallback((targetUrl) => {
    if (!targetUrl || typeof window === "undefined") {
      return;
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <footer className="home-footer" ref={ref}>
      <div className="home-footer-inner">
        <div className="home-footer-branding">
          <p className="home-footer-brand">WEBSHELF</p>
          <p className="home-footer-copy">
            The modern way to browse, borrow, and fall in love with reading
            again.
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
                "https://mail.google.com/mail/?view=cm&fs=1&to=webshelf@gmail.com"
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
  );
});

export default SiteFooter;
