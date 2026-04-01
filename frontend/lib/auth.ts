// frontend/lib/auth.ts
export type Tokens = {
  access: string;
  refresh?: string;
};

const ACCESS_KEY = "gm_access";
const REFRESH_KEY = "gm_refresh";

export function saveTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}