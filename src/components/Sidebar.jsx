import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isOwner } from "../ownerAccess";
import { isSubscriptionExpired } from "../premiumAccess";
import env from "../../Config/env";
import {
  Zap,
  BarChart2,
  Link as LinkIcon,
  TrendingUp,
  Activity,
  X,
  Pencil,
  LogOut,
  ArrowLeft,
} from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  linksCount,
  FREE_LIMIT = 1,
  isPremium = false,
  // True once a subscription has lapsed — swaps the free-plan meter for a
  // "buy again" prompt. Records are never deleted, so this stays accurate.
  subscriptionExpired = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const getStoredUser = () => {
    const data =
      localStorage.getItem("LoginUser") || localStorage.getItem("user");
    if (!data || data === "undefined") return {};
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  };

  const storedUser = getStoredUser();
  const userName = storedUser.name || "User";
  const userEmail = storedUser.email || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const canViewPreClicks = isOwner();
  // Admins run the tool — they are unlimited without paying, so no plan card.
  const isAdmin = canViewPreClicks;

  // The sidebar resolves its own plan so it never has to guess while a page is
  // still loading. `null` means "not known yet" and renders nothing, which is
  // why a lapsed subscriber no longer sees "Free Plan" flash first.
  const [plan, setPlan] = useState(null);
  const planLinkLimit = plan?.freeLinkLimit ?? FREE_LIMIT;
  const planCampaignLimit = plan?.freeCampaignLimit ?? 1;
  // Prefer the page's live link count (it updates as links are added/removed)
  // and fall back to the count the plan endpoint reported.
  const usedLinks = linksCount ?? plan?.linksCount ?? 0;
  const usedCampaigns = plan?.campaignsCount ?? 0;
  const meterWidth = (used, limit) =>
    Math.min(100, (used / (limit || 1)) * 100);

  useEffect(() => {
    const apiToken = localStorage.getItem("apiToken");
    if (!apiToken || isAdmin) return;

    let cancelled = false;
    fetch(`${env.BACKEND_URL}/plan`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success) setPlan(data);
      })
      .catch(() => {
        /* Leave the plan slot empty rather than showing a wrong plan. */
      });

    return () => {
      cancelled = true;
    };
    // Re-reads when the link count changes, so the campaign meter refreshes
    // after a link or campaign is created or deleted.
  }, [isAdmin, linksCount]);

  function handleLogout() {
    localStorage.removeItem("apiToken");
    localStorage.removeItem("LoginUser");
    navigate("/login");
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 xl:w-80 lg:w-72 md:w-64 w-72 max-w-[85vw] bg-white border-r border-slate-100
          flex flex-col py-5 px-3 xl:px-4
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Close button — mobile only */}
        <div className="flex justify-end mb-2 md:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex items-center justify-center xl:mb-6 mb-4">
          <Link
            to="/dashboard/analytics"
            className="font-bold text-2xl tracking-[-0.03em] text-slate-900"
            style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
          >
            curtio<span className="text-indigo-600">.</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <Link
            to="/dashboard/analytics"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs xl:text-sm transition-colors text-left ${currentPath === "/dashboard/analytics"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            <BarChart2 size={16} className="shrink-0" /> <span className="truncate">Redirected Clicks Dashboard</span>
          </Link>

          {canViewPreClicks && <Link
            to="/dashboard/preclick"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs xl:text-sm transition-colors text-left ${currentPath === "/dashboard/preclick"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            <Activity size={16} className="shrink-0" /> <span className="truncate">Non-Redirected Clicks Dashboard</span>
          </Link>}

          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs xl:text-sm transition-colors text-left ${currentPath === "/dashboard"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            <LinkIcon size={16} className="shrink-0" /> <span className="truncate">Links</span>
          </Link>

          <Link
            to="/dashboard/campaigns"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs xl:text-sm transition-colors text-left ${currentPath === "/dashboard/campaigns"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            <TrendingUp size={16} className="shrink-0" /> <span className="truncate">Campaigns</span>
          </Link>
        </nav>

        {/* Plan badge.
            - Admins (owners) never see plan info at all: they run the tool and
              are unlimited without paying.
            - A lapsed subscriber sees "Plus Plan Expired", not "Free Plan" —
              calling them Free hides that they used to pay and gives them
              nothing to act on.
            - Everyone else sees the free-plan meter. */}
        {plan && linksCount !== undefined && !isAdmin && (
          plan.unlimitedLinks ? (
            <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 my-3">
              <div className="text-xs font-bold text-indigo-700 mb-1">
                Plus Plan
              </div>
              <div className="text-xs text-slate-500">
                {usedLinks}/Unlimited links used
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {usedCampaigns}/Unlimited campaigns used
              </div>
            </div>
          ) : isSubscriptionExpired(plan.subscriptionStatus) ? (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 my-3">
              <div className="text-xs font-bold text-amber-800 mb-1">
                Plus Plan Expired
              </div>
              <div className="text-xs text-amber-700/90 mb-3 leading-[1.5]">
                Subscribe again to create more links and campaigns.
              </div>
              <Link
                to="/pricing"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Subscribe Again
              </Link>
            </div>
          ) : (
            <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 my-3">
              <div className="text-xs font-bold text-indigo-700 mb-1">
                Free Plan
              </div>

              <div className="text-xs text-slate-500 mb-1.5">
                {usedLinks}/{planLinkLimit} links used
              </div>
              <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${meterWidth(usedLinks, planLinkLimit)}%` }}
                />
              </div>

              <div className="text-xs text-slate-500 mb-1.5">
                {usedCampaigns}/{planCampaignLimit} campaigns used
              </div>
              <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${meterWidth(usedCampaigns, planCampaignLimit)}%` }}
                />
              </div>

              {/* Both quotas spent — the only way forward is to upgrade. */}
              {usedLinks >= planLinkLimit && usedCampaigns >= planCampaignLimit && (
                <Link
                  to="/pricing"
                  onClick={() => setSidebarOpen(false)}
                  className="mt-3 flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  Upgrade to Plus
                </Link>
              )}
            </div>
          )
        )}

        <div className="border-t border-slate-200 pt-3 mt-auto">
          <div className="flex items-center gap-3 px-2 mb-3 min-w-0">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                  {userName}
                </span>
                {/* Owners get an Admin marker here instead of a plan card. */}
                {isAdmin && (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2 py-[1px] text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 truncate">
                {userEmail}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Link
              to="/dashboard/editprofile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white text-xs xl:text-sm font-medium px-3 py-2 rounded-xl text-center cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              <Pencil size={15} /> Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white text-xs xl:text-sm font-medium px-3 py-2 rounded-xl text-center cursor-pointer hover:bg-indigo-700 transition-colors flex w-full items-center justify-center gap-2"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
