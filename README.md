# Webshelf Library UI

A React + Vite frontend for the Webshelf library system. Patrons can explore the catalog, manage their carts, place holds, and maintain their accounts. Librarians gain access to circulation, catalog, invoice, transaction, review, and user management tools, all backed by the API documented at `https://98.92.25.69/docs/`.

## Features
- **Catalog & discovery** – search thousands of titles, inspect availability, and drill into rich book detail pages with community reviews and recommendations.
- **Borrower experience** – authentication (register, login, password reset), cart and checkout, QR pickup codes, account/profile management, and loan history views.
- **Admin console** – dashboards for circulation tasks, book CRUD, invoice tracking, transaction auditing, review moderation, and user maintenance (including password resets & deletion).
- **Reusable API layer** – all requests share a single configurable base URL (`src/api/config.js`) so switching environments is straightforward.

## Tech Stack
- React 19 with React Router 7
- Vite 7 for dev/build tooling
- ESLint 9 with React hooks/refresh plugins
- ZXing for in-browser QR/Barcode scanning

## Project Structure
```
src/
├── api/                # REST helpers (library + admin)
├── components/         # Shared layout/widgets (header, footer, etc.)
├── contexts/           # Auth context/provider hooks
├── hooks/              # Admin-specific utilities
├── pages/              # Feature routes (home, admin modules, auth flows, etc.)
└── assets/             # Brand assets (favicon, logos)
public/
└── webshelf-icon.png   # Favicon served by Vite
```

## Getting Started
```bash
npm install        # install dependencies
npm run dev        # launch Vite dev server (http://localhost:5173 by default)
npm run lint       # optional: check for lint issues
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

## Configuration
- **API base URL** – defaults to `https://98.92.25.69`. Override by creating a `.env` or `.env.local` file and setting:
  ```
  VITE_API_URL=https://your-api-host
  ```
  Every module imports `API_BASE_URL` from `src/api/config.js`, so no other edits are required.

- **Branding** – replace `public/webshelf-icon.png` (and any assets in `src/assets/`) to update the app icon or logos. Vite will serve whatever file shares that name.

## Useful Tips
- The admin “Manage Users” screen can reset passwords or delete members using the `/admin/users` endpoints. Make sure you’re signed in with an admin account before visiting `/admin/users`.
- For QR/scan testing at the circulation desk, connect a camera that the browser can access; ZXing powers the scanning workflow under `/admin/circulation`.

## License
Internal academic project – no explicit license supplied. Consult your institution before redistributing.
