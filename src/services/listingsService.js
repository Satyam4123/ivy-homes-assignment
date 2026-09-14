import { apiRequest } from "./apiClient.js";

export async function getListings(
  { limit, offset, locality, bhk, minPrice, maxPrice, furnishing, sortBy },
  signal,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (locality.trim()) params.set("locality", locality.trim());
  if (bhk) params.set("bhk", bhk);
  if (minPrice) params.set("min_price", minPrice);
  if (maxPrice) params.set("max_price", maxPrice);
  if (furnishing) params.set("furnishing", furnishing);
  if (sortBy) params.set("sort_by", sortBy);

  const response = await apiRequest(`/v1/listings?${params.toString()}`, {
    signal,
  });

  return response.json();
}

export async function getListingById(listingId, signal) {
  const response = await apiRequest(
    `/v1/listings/${encodeURIComponent(listingId)}`,
    { signal },
  );

  return response.json();
}

export async function getSavedListings(signal) {
  const response = await apiRequest("/v1/saved", { signal });
  return response.json();
}

export async function saveListing(listingId) {
  const response = await apiRequest("/v1/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listing_id: listingId }),
  });

  return response.json();
}

export async function unsaveListing(listingId) {
  const response = await apiRequest(
    `/v1/saved/${encodeURIComponent(listingId)}`,
    { method: "DELETE" },
  );

  return response.json();
}
