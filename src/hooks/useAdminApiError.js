import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function useAdminApiError(onExpired) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return useCallback(
    (error) => {
      const rawMessage = error?.message || "";
      const status = error?.status;
      const isAuthStatus = status === 401 || status === 403;
      const looksExpired = /expired|unauthorized|forbidden|login required|jwt/i.test(
        rawMessage
      );
      if (isAuthStatus || looksExpired) {
        if (typeof onExpired === "function") {
          onExpired("Session expired. Please sign in again.");
        }
        logout();
        navigate("/login", { replace: true });
        return true;
      }
      return false;
    },
    [logout, navigate, onExpired]
  );
}

export default useAdminApiError;
