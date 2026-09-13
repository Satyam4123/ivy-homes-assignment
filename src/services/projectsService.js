import { apiRequest } from "./apiClient.js";

export async function getProjects({ limit, offset }, signal) {
  const response = await apiRequest(
    `/v1/projects?limit=${limit}&offset=${offset}`,
    { signal },
  );
  return response.json();
}
