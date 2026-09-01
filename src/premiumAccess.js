/**
 * Paid-plan flag, read from the JWT claim — the same shape as ownerAccess.js.
 *
 * This is only a snapshot taken at login, so it is used for the FIRST render
 * before GET /urls returns. That response carries a live `isPremium` computed
 * from the subscriptions collection, and pages prefer it once it arrives.
 *
 * Independent of isOwner(): premium lifts the link quota, owner unlocks
 * pre-click analytics. Neither implies the other.
 */
export const isPremium = () => {
  try {
    const token = localStorage.getItem("apiToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (typeof payload.isPremium === "boolean") {
        return payload.isPremium;
      }
    }

    const data =
      localStorage.getItem("LoginUser") || localStorage.getItem("user");
    if (!data || data === "undefined") return false;
    return Boolean(JSON.parse(data).isPremium);
  } catch {
    return false;
  }
};

/**
 * May this account hold unlimited links? True for subscribers AND for owners —
 * owners run the tool and are never asked to buy their own product.
 *
 * Quota only. It does not work in reverse: a subscriber is not an owner and
 * never gains pre-click analytics (that stays with ownerAccess.js).
 */
export const hasUnlimitedLinks = () => {
  if (isPremium()) return true;
  try {
    const token = localStorage.getItem("apiToken");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.isOwner === true;
  } catch {
    return false;
  }
};

/** Links a plan may hold. Free is capped; unlimited otherwise. */
export const FREE_LINK_LIMIT = 1;

/** Campaigns a plan may hold — Free gets 1, matching the published Pricing page. */
export const FREE_CAMPAIGN_LIMIT = 1;

export const linkLimitFor = (unlimited) =>
  unlimited ? Infinity : FREE_LINK_LIMIT;

export const campaignLimitFor = (unlimited) =>
  unlimited ? Infinity : FREE_CAMPAIGN_LIMIT;

/**
 * Did this account once have a subscription that is no longer active?
 *
 * `subscriptionStatus` comes from GET /urls: "none" means they never
 * subscribed, "active"/"trialing" means they still are, and anything else
 * ("expired", "canceled", "past_due") means a record exists but has lapsed.
 * Records are never deleted, so this stays true after the period ends.
 */
export const isSubscriptionExpired = (subscriptionStatus) =>
  Boolean(subscriptionStatus) &&
  !["none", "active", "trialing"].includes(subscriptionStatus);
