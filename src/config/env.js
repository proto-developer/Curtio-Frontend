
const env = {
  CLIENT_ID: import.meta.env?.VITE_CLIENT_ID || (typeof process !== "undefined" ? process.env?.CLIENT_ID : undefined),
  BACKEND_URL: import.meta.env?.VITE_API_BASE_URL || (typeof process !== "undefined" ? process.env?.VITE_API_BASE_URL : undefined),
  GOOGLE_API_KEY: import.meta.env?.VITE_GOOGLE_API_KEY || (typeof process !== "undefined" ? process.env?.GOOGLE_API_KEY : undefined),
  SANITY_PROJECT_ID: import.meta.env?.VITE_SANITY_PROJECT_ID || (typeof process !== "undefined" ? process.env?.SANITY_PROJECT_ID : undefined),
  SANITY_API_TOKEN: import.meta.env?.VITE_SANITY_API_TOKEN || (typeof process !== "undefined" ? process.env?.SANITY_API_TOKEN : undefined),
  SANITY_DATASET: import.meta.env?.VITE_SANITY_DATASET || (typeof process !== "undefined" ? process.env?.SANITY_DATASET : undefined),
  SANITY_API_VERSION: import.meta.env?.VITE_SANITY_API_VERSION || (typeof process !== "undefined" ? process.env?.SANITY_API_VERSION : undefined),
};

export default env; 