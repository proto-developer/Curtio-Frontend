import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import applySeo from "./applySeo";
import { resolveRouteSeo, ROUTE_SEO } from "./seoConfig";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Start each test from the real index.html head so we also prove the runtime
// updates the baseline tags in place instead of appending duplicates.
const indexHead = fs
  .readFileSync(path.join(projectRoot, "index.html"), "utf8")
  .match(/<head>([\s\S]*?)<\/head>/)[1];

const attr = (selector, name) =>
  document.head.querySelector(selector)?.getAttribute(name) ?? null;

const applyRoute = (pathname) => {
  const seo = resolveRouteSeo(pathname);
  applySeo({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    noindex: seo.noindex ?? false,
  });
  return seo;
};

beforeEach(() => {
  document.head.innerHTML = indexHead;
});

const PUBLIC_ROUTES = ["/", "/features", "/accuracy", "/blog", "/blog/some-post", "/register"];
const ALL_ROUTES = [...PUBLIC_ROUTES, "/login", "/forgot-password", "/dashboard", "/analytics/abc123"];

describe("route SEO metadata", () => {
  it("gives every route a title, description and canonical", () => {
    for (const route of ALL_ROUTES) {
      applyRoute(route);
      expect(document.title, route).toBeTruthy();
      expect(attr('meta[name="description"]', "content"), route).toBeTruthy();
      expect(attr('link[rel="canonical"]', "href"), route).toBeTruthy();
    }
  });

  it("does not reuse one title across pages", () => {
    const titles = ALL_ROUTES.map((route) => {
      applyRoute(route);
      return document.title;
    });
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("does not reuse one description across pages", () => {
    const descriptions = PUBLIC_ROUTES.map((route) => {
      applyRoute(route);
      return attr('meta[name="description"]', "content");
    });
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("points each canonical at its own path", () => {
    for (const route of ["/features", "/accuracy", "/blog"]) {
      applyRoute(route);
      expect(attr('link[rel="canonical"]', "href")).toMatch(new RegExp(`${route}$`));
    }
  });

  it("emits Open Graph and Twitter card tags", () => {
    const seo = applyRoute("/features");
    expect(attr('meta[property="og:title"]', "content")).toBe(seo.title);
    expect(attr('meta[property="og:description"]', "content")).toBe(seo.description);
    expect(attr('meta[property="og:url"]', "content")).toBe(seo.canonical);
    expect(attr('meta[property="og:image"]', "content")).toMatch(/^https?:\/\/.+\.png$/);
    expect(attr('meta[property="og:site_name"]', "content")).toBe("Curtio");
    expect(attr('meta[name="twitter:card"]', "content")).toBe("summary_large_image");
    expect(attr('meta[name="twitter:image"]', "content")).toMatch(/^https?:\/\//);
  });

  it("updates the head in place rather than appending duplicate tags", () => {
    applyRoute("/features");
    applyRoute("/accuracy");
    expect(document.head.querySelectorAll("title").length).toBeLessThanOrEqual(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
  });

  it("keeps private routes out of the index and public ones in", () => {
    applyRoute("/dashboard");
    expect(attr('meta[name="robots"]', "content")).toBe("noindex, nofollow");
    applyRoute("/analytics/abc123");
    expect(attr('meta[name="robots"]', "content")).toBe("noindex, nofollow");
    applyRoute("/features");
    expect(attr('meta[name="robots"]', "content")).toBe("index, follow");
  });

  it("lets a blog post override the static /blog/:slug entry", () => {
    const base = resolveRouteSeo("/blog/tracking-clicks-honestly");
    applySeo({
      title: "Tracking clicks honestly | Curtio Blog",
      description: "How Curtio filters bots and link previews out of your click counts.",
      canonical: base.canonical,
      image: "https://cdn.sanity.io/images/fk4ygrwd/production/abc-1200x800.jpg",
      type: "article",
    });
    expect(document.title).toBe("Tracking clicks honestly | Curtio Blog");
    expect(attr('meta[property="og:type"]', "content")).toBe("article");
    expect(attr('meta[property="og:image"]', "content")).toContain("cdn.sanity.io");
    expect(attr('link[rel="canonical"]', "href")).toMatch(/\/blog\/tracking-clicks-honestly$/);
  });

  it("covers every route declared in App.jsx", () => {
    const appSource = fs
      .readFileSync(path.join(projectRoot, "src/App.jsx"), "utf8")
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ""); // ignore commented-out routes
    const appRoutes = appSource.matchAll(/<Route\s+path="([^"*]+)"/g);
    for (const [, route] of appRoutes) {
      expect(ROUTE_SEO, `missing SEO entry for ${route}`).toHaveProperty(route);
    }
  });
});
