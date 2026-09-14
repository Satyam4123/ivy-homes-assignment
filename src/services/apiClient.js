const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const ACCESS_TOKEN_KEY = "ivy-homes-access-token";
const REFRESH_TOKEN_KEY = "ivy-homes-refresh-token";
let refreshPromise = null;
let sessionExpiryNotified = false;

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

function notifySessionExpired() {
  if (sessionExpiryNotified) {
    return;
  }

  sessionExpiryNotified = true;
  clearAuthTokens();

  if (typeof window !== "undefined") {
    window.alert("Your session has expired. Please log in again.");
    window.location.assign("/login");
  }
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    notifySessionExpired();
    throw new Error("Your session has expired. Please log in again.");
  }

  refreshPromise = fetch(new URL("/auth/refresh", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      Authorization: `Bearer ${refreshToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        notifySessionExpired();
        throw new Error("Your session has expired. Please log in again.");
      }

      const data = await response.json();

      if (!data.access_token) {
        notifySessionExpired();
        throw new Error("Your session has expired. Please log in again.");
      }

      setAuthTokens(data.access_token, data.refresh_token);
      sessionExpiryNotified = false;
      return data.access_token;
    })
    .catch((error) => {
      if (error.message !== "Your session has expired. Please log in again.") {
        notifySessionExpired();
      }

      throw new Error("Your session has expired. Please log in again.");
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiRequest(path, options = {}, hasRetried = false) {
  const response = await fetch(new URL(path, API_BASE_URL), {
    ...options,
    headers: getApiHeaders(options.headers),
  });

  if (response.status === 401 && !hasRetried && !path.startsWith("/auth/")) {
    const accessToken = await refreshAccessToken();
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return apiRequest(path, options, true);
  }

  if (response.status === 401 && hasRetried) {
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    const error = new Error(await getErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response;
}

export { refreshAccessToken };

export function setAuthTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionExpiryNotified = false;
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
