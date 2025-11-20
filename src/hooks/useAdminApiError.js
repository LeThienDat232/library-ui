import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function useAdminApiError(onExpired) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return useCallback(
    (error) => {
      const rawMessage = error?.message || "";
      if (error?.status === 401 || /expired|unauthorized|token/i.test(rawMessage)) {
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
