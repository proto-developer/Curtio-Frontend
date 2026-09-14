import { apiRequest } from "./client";

export async function login(email, password) {
  const { data } = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  return data;
}

export async function googleLogin(accessToken) {
  const { data } = await apiRequest("/auth/google", {
    method: "POST",
    body: { token: accessToken },
    auth: false,
  });
  return data;
}

export async function register(form) {
  const { data } = await apiRequest("/auth/register", {
    method: "POST",
    body: form,
    auth: false,
  });
  return data;
}

export async function verifyOtp(email, otp) {
  const { data } = await apiRequest("/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
    auth: false,
  });
  return data;
}

export async function sendResetOtp(email) {
  const { data } = await apiRequest("/auth/send-reset-otp", {
    method: "POST",
    body: { email },
    auth: false,
  });
  return data;
}

export async function resetPassword({ email, otp, password }) {
  const { data } = await apiRequest("/auth/reset-password", {
    method: "POST",
    body: { email, otp, password },
    auth: false,
  });
  return data;
}

export async function updateProfile(payload, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest("/auth/update-profile", {
    method: "PATCH",
    body: payload,
    token,
    redirectOn401,
  });
  return data;
}

export async function updateAccountLabels(labels, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest("/auth/labels", {
    method: "PUT",
    body: { labels },
    token,
    redirectOn401,
  });
  return data;
}
