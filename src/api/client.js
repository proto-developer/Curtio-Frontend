import env from "@/config/env";
import { getApiToken, redirectToLogin } from "@/lib/auth/session";

/**
 * Shared fetch wrapper. Authenticated calls attach the Bearer token.
 * List-style reads pass redirectOn401 so a stale JWT sends the user to /login
 * the same way the pages used to do inline.
 */
export async function apiRequest(
  path,
  {
    method = "GET",
    body,
    auth = true,
    token,
    redirectOn401 = auth,
    headers = {},
  } = {},
) {
  const requestHeaders = { ...headers };
  if (body !== undefined && requestHeaders["Content-Type"] == null) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const authToken = token !== undefined ? token : auth ? getApiToken() : null;
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${env.BACKEND_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (redirectOn401 && res.status === 401) {
    redirectToLogin();
    return { status: 401, data: null, redirected: true };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data, redirected: false };
}
