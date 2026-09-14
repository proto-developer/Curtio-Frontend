export const isOwner = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("LoginUser") || localStorage.getItem("user") || "{}",
    );
    // JWT token decoded owner flag if present, or checked via token payload
    const token = localStorage.getItem("apiToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (typeof payload.isOwner === "boolean") {
          return payload.isOwner;
        }
      } catch (e) {
        // Fallback to user object property
      }
    }
    return Boolean(user.isOwner);
  } catch {
    return false;
  }
};