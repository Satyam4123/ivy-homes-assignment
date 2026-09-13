import {
  apiRequest,
  setAuthTokens,
  getAccessToken,
  getRefreshToken,
  clearAuthTokens,
} from "./apiClient.js";

export async function login(credentials) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  const data = await response.json();

  if (!data.access_token || !data.refresh_token) {
    throw new Error(
      "Login succeeded but authentication tokens were not returned.",
    );
  }

  setAuthTokens(data.access_token, data.refresh_token);

  return data.user || { authenticated: true };
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await fetch(
    new URL("/auth/refresh", import.meta.env.VITE_API_BASE_URL),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
        ...(import.meta.env.VITE_API_KEY
          ? { "x-api-key": import.meta.env.VITE_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    },
  );

  if (!response.ok) {
    clearAuthTokens();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const data = await response.json();

  if (!data.access_token) {
    clearAuthTokens();
    throw new Error("Unable to refresh your session.");
  }

  setAuthTokens(data.access_token, data.refresh_token);

  return data.access_token;
}

export async function getCurrentUser() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  // The backend contract provided does not expose a dedicated
  // current-user endpoint, so do not make an unrelated API request
  // just to determine whether a session exists.
  return { authenticated: true };
}

export async function logout() {
  try {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      await fetch(new URL("/auth/logout", import.meta.env.VITE_API_BASE_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
          ...(import.meta.env.VITE_API_KEY
            ? { "x-api-key": import.meta.env.VITE_API_KEY }
            : {}),
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });
    }
  } finally {
    clearAuthTokens();
  }
}
