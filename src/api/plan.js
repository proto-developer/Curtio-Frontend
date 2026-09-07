import { apiRequest } from "./client";

export async function getPlan({ token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest("/plan", { token, redirectOn401 });
  return data;
}
