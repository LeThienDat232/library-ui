import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AccountPage from "./pages/account-detail/src/App.jsx";
import BookDetailPage from "./pages/book-detail/src/App.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/login-page/src/App.jsx";
import RegisterPage from "./pages/register-page/src/App.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const handleLogin = () => setIsLoggedIn(true);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              isLoggedIn={isLoggedIn}
              onBookSelect={setSelectedBook}
            />
          }
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/book"
          element={
            selectedBook ? (
              <BookDetailPage book={selectedBook} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/account"
          element={
            isLoggedIn ? <AccountPage /> : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
