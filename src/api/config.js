const DEFAULT_API_BASE_URL = "https://api.webshelf.io.vn";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export function buildApiUrl(path = "") {
  if (!path) {
    return API_BASE_URL;
  }
  return path.startsWith("/")
    ? `${API_BASE_URL}${path}`
    : `${API_BASE_URL}/${path}`;
}
