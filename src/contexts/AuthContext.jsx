import { createContext, useContext } from "react";

const defaultAuthValue = {
  session: null,
  user: null,
  accessToken: "",
  isAuthenticated: false,
  isAdmin: false,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext(defaultAuthValue);

export function useAuth() {
  return useContext(AuthContext) ?? defaultAuthValue;
}

export function useAuthSession() {
  const { session } = useAuth();
  return session;
}

export function useAuthToken() {
  const { accessToken } = useAuth();
  return accessToken || "";
}

export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return Boolean(isAdmin);
}

export function isAdminUser(user) {
  if (!user) return false;
  const roleValue = (
    user.role ||
    user.role_name ||
    user.roleName ||
    user.type ||
    ""
  )
    .toString()
    .toLowerCase();
  if (roleValue === "admin" || roleValue === "librarian") {
    return true;
  }
  if (Array.isArray(user.roles)) {
    return user.roles.some((role) =>
      (role?.name || role?.role || "").toString().toLowerCase() === "admin"
    );
  }
  const permissions = user.permissions || user.scopes;
  if (Array.isArray(permissions)) {
    return permissions.some((perm) =>
      perm && perm.toString().toLowerCase().includes("admin")
    );
  }
  return false;
}
