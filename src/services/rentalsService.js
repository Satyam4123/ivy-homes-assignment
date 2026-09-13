import { apiRequest } from "./apiClient.js";

export async function getRentals({ limit, offset }, signal) {
  const response = await apiRequest(
    `/v1/rentals?limit=${limit}&offset=${offset}`,
    { signal },
  );
  return response.json();
}
