import { apiRequest } from "./client";

export async function verifyPublicLink(shortCode, body) {
  return apiRequest(`/public/verify/${shortCode}`, {
    method: "POST",
    body,
    auth: false,
  });
}
