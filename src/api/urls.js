import { apiRequest } from "./client";

export async function listUrls({ token, redirectOn401 = true } = {}) {
  const { data, redirected } = await apiRequest("/urls", {
    token,
    redirectOn401,
  });
  if (redirected) return null;
  return data;
}

export async function createUrl(payload, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest("/urls", {
    method: "POST",
    body: payload,
    token,
    redirectOn401,
  });
  return data;
}

export async function deleteUrl(slug, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest(`/urls/${slug}`, {
    method: "DELETE",
    token,
    redirectOn401,
  });
  return data;
}

export async function toggleUrl(slug, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest(`/urls/${slug}/toggle`, {
    method: "PATCH",
    token,
    redirectOn401,
  });
  return data;
}

export async function updateUrlLabels(slug, labels, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest(`/urls/${slug}/labels`, {
    method: "PATCH",
    body: { labels },
    token,
    redirectOn401,
  });
  return data;
}

export async function updateUrlCampaigns(slug, campaigns, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest(`/urls/${slug}/campaigns`, {
    method: "PATCH",
    body: { campaigns },
    token,
    redirectOn401,
  });
  return data;
}

export async function deleteCampaign(name, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest(`/urls/campaign/${encodeURIComponent(name)}`, {
    method: "DELETE",
    token,
    redirectOn401,
  });
  return data;
}

export async function renameCampaign(oldName, newName, { token, redirectOn401 = false } = {}) {
  const { data } = await apiRequest(`/urls/campaign/${encodeURIComponent(oldName)}`, {
    method: "PATCH",
    body: { newName },
    token,
    redirectOn401,
  });
  return data;
}
