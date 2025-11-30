const DEFAULT_API_BASE_URL = "https://98.92.25.69";

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
