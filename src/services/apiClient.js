const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const ACCESS_TOKEN_KEY = "ivy-homes-access-token";
const REFRESH_TOKEN_KEY = "ivy-homes-refresh-token";

function getApiHeaders(headers = {}) {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  return {
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };
}

async function getErrorMessage(response) {
  try {
    const body = await response.json();

    return (
      body.detail ||
      body.message ||
      body.error ||
      "The request could not be completed."
    );
  } catch {
    return "The request could not be completed.";
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(new URL(path, API_BASE_URL), {
    ...options,
    headers: getApiHeaders(options.headers),
  });

  if (!response.ok) {
    const error = new Error(await getErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response;
}

export function setAuthTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
