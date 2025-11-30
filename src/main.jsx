import { StrictMode } from 'react' // a special wrapper used only in development to: warn about unsafe patterns, run some functions twice (in dev) to catch side-effects.
import { createRoot } from 'react-dom/client' //connect React to the HTML page.
import './index.css'
import App from './App.jsx' // imports root component.
import ErrorBoundary from './components/ErrorBoundary.jsx' //imports a custom component to catch errors in the component tree.

// Render the App component wrapped in StrictMode and ErrorBoundary to the DOM element with id 'root'.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

