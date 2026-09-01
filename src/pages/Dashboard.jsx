import { useState, useEffect, useRef } from "react";
import { Link, Links, useNavigate, useLocation } from "react-router-dom";
import {
  Zap,
  Plus,
  Copy,
  Check,
  BarChart2,
  ExternalLink,
  Trash2,
  Link as LinkIcon,
  TrendingUp,
  MousePointerClick,
  Search,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  LogOut,
  Menu,
  X,
  Pencil,
  Edit,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from "lucide-react";
import { SHORTENER_DOMAIN } from "../components/Shortner";
import Sidebar from "../components/Sidebar";
import { FaWhatsapp } from "react-icons/fa6";
import ShareModal from "../components/LinkShareModal";
import LabelCell from "../components/LabelCell";
import { isOwner } from "../ownerAccess";
import AddToCampaignModal from "../components/AddToCampaignModal";
import useSocket from "../socket/useSocket";
import env from "../../Config/env";
import QrModal from "../components/ui/QrModal";
import { syncPendingUrl } from "../lib/sync";
import { addNewLinkId, isLinkNew, markLinkAsViewed } from "../lib/newLinkTracker";

const baseUrl = env.BACKEND_URL;

function StatCard({ icon, label, value, sub, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-100 min-h-[5.5rem] md:min-h-[7.5rem] rounded-2xl p-3 md:p-5 shadow-sm hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-200 transition-all duration-300 cursor-pointer w-full ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5 md:mb-3 gap-1">
        <span className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-500 truncate">{label}</span>
        <div className="w-6 h-6 md:w-9 md:h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 truncate">{value}</div>
      {sub && <div className="text-[10px] sm:text-xs xl:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">{sub}</div>}
    </div>
  );
}



function DeleteModal({ onConfirm, onCancel, deleting }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80 flex items-center justify-center p-4"
      onClick={() => !deleting && onCancel()}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg mb-1">
          Delete this link?
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          This action cannot be undone. The short link will stop working
          immediately.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 cursor-pointer py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 cursor-pointer  py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <>
                <Trash2 size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LimitModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap size={22} className="text-indigo-600" fill="currentColor" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg mb-1">
          Plan Limit Reached
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          You have reached the maximum number of active links for your current plan. Please upgrade to create more tracked links.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Understood
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shareLink, setShareLink] = useState(null);

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

  function handleLogout() {
    localStorage.removeItem("apiToken");
    localStorage.removeItem("LoginUser");
    navigate("/login");
  }

  const token = localStorage.getItem("apiToken");

  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [error, setError] = useState("");
  const [accountLabels, setAccountLabels] = useState({});

  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState("");
  const [qrLink, setQrLink] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(location.state?.filter || "All");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [campaignModalLink, setCampaignModalLink] = useState(null);

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalPreClicks = links.reduce((sum, l) => sum + (l.preClicks || 0), 0);
  const activeLinks = links.filter((l) => l.active).length;
  const inactiveLinks = links.length - activeLinks;
  const canViewPreClicks = isOwner();

  // const isPremium = PREMIUM_USERS.includes(userEmail);
  // const FREE_LIMIT = isPremium ? Infinity : 1;
  const isPremium = true;
  const FREE_LIMIT = Infinity;
  const atLimit = !isPremium && links.length >= FREE_LIMIT;

  const calculateReturningUsers = () => {
    const deviceCounts = {};

    links.forEach(l => {
      if (l.clickLogs) {
        l.clickLogs.forEach(log => {
          const diffTime = Math.abs(new Date() - new Date(log.clickedAt));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            const deviceId = `${log.ip}-${log.userAgent}`;
            deviceCounts[deviceId] = (deviceCounts[deviceId] || 0) + 1;
          }
        });
      }
    });

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    let returningCount = 0;
    let uniqueDevices = 0;
    Object.values(deviceCounts).forEach(count => {
      uniqueDevices++;
      if (count > 1) returningCount++;
    });

    if (uniqueDevices === 0) return "0%";
    return Math.round((returningCount / uniqueDevices) * 100) + "%";
  };
  const returningUsersPercentage = calculateReturningUsers();

  useEffect(() => {
    if (!token) {
      setLoadingLinks(false);
      return;
    }

    const loadDashboardData = async () => {
      await syncPendingUrl(token);
      fetchLinks();
    };
    loadDashboardData();
  }, [token]);

  // ── Real-time Socket.IO listener (replaces polling) ──────────
  useSocket("analytics:updated", (updatedUrl) => {
    if (!updatedUrl) return;
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== updatedUrl._id) return l;
        return {
          ...l,
          clicks: updatedUrl.clicks,
          preClicks: updatedUrl.preClicks || 0,
          clickLogs: updatedUrl.clickLogs || [],
          active: updatedUrl.active,
          labels: updatedUrl.labels || [],
          campaigns: updatedUrl.campaigns || [],
        };
      })
    );
  });

  async function fetchLinks(background = false) {
    if (!background) setLoadingLinks(true);
    if (!background) setError("");
    try {
      const baseUrl = env.BACKEND_URL;
      const res = await fetch(`${baseUrl}/urls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("apiToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        if (data.labels) {
          setAccountLabels(data.labels);
        }
        const sortedUrls = [...(data.urls || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const mapped = sortedUrls.map((u) => ({
          id: u._id,
          slug: u.shortCode,
          original: u.originalUrl,
          short: `${SHORTENER_DOMAIN}/${u.shortCode}`,
          clicks: u.clicks,
          preClicks: u.preClicks || 0,
          rawCreatedAt: u.createdAt,
          createdAt: new Date(u.createdAt).toISOString().slice(0, 10),
          active: u.active,
          password: u.password,
          expiresAt: u.expiresAt
            ? new Date(u.expiresAt).toISOString().slice(0, 16)
            : null,
          clickLogs: u.clickLogs || [],
          labels: u.labels || [],
          campaigns: u.campaigns || [],
        }));
        setLinks(mapped);
      } else {
        if (!background) setError(data.message || "Failed to fetch short links.");
      }
    } catch (err) {
      if (!background) setError("Network error. Could not connect to server.");
    } finally {
      if (!background) setLoadingLinks(false);
    }
  }

  function handleCopy(id, short) {
    navigator.clipboard.writeText(short);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }

  function handleDelete(id, slug) {
    setDeleteModal({ id, slug });
  }

  async function performDelete() {
    if (!deleteModal) return;
    const { id, slug } = deleteModal;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/urls/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setDeleteModal(null);
      } else {
        setError(data.message || "Failed to delete link.");
        setDeleteModal(null);
      }
    } catch (err) {
      setError("Network error. Could not delete link.");
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(id, slug) {
    setError("");
    try {
      const res = await fetch(`${baseUrl}/urls/${slug}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, active: data.url.active } : l
          )
        );
      } else {
        setError(data.message || "Failed to update link status.");
      }
    } catch (err) {
      setError("Network error. Could not update link status.");
    }
  }

  function buildFinalUrl(base) {
    const params = [];
    if (utmSource) params.push(`utm_source=${encodeURIComponent(utmSource)}`);
    if (utmMedium) params.push(`utm_medium=${encodeURIComponent(utmMedium)}`);
    if (utmCampaign) params.push(`utm_campaign=${encodeURIComponent(utmCampaign)}`);
    if (!params.length) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}${params.join("&")}`;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (atLimit) return;
    setCreating(true);
    setError("");
    try {
      const finalUrl = buildFinalUrl(url);
      const res = await fetch(`${baseUrl}/urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalUrl: finalUrl,
          customAlias: alias ? alias.toLowerCase().trim() : undefined,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.url?._id) {
          addNewLinkId(data.url._id);
        }
        await fetchLinks();
        setUrl("");
        setAlias("");
        setPassword("");
        setExpiresAt("");
        setUtmSource("");
        setUtmMedium("");
        setUtmCampaign("");
        setShowAdvanced(false);
        setShowForm(false);
      } else {
        setError(data.message || "Failed to create short URL.");
      }
    } catch (err) {
      setError("Network error. Could not create short URL.");
    } finally {
      setCreating(false);
    }
  }

  const filtered = links
    .filter((l) => {
      const matchesSearch =
        l.slug.toLowerCase().includes(search.toLowerCase()) ||
        l.original.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Active" && l.active) ||
        (selectedFilter === "Inactive" && !l.active);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.rawCreatedAt || b.createdAt) - new Date(a.rawCreatedAt || a.createdAt));


  return (
    <div className="min-h-screen bg-slate-50">
      {qrLink && <QrModal link={qrLink} onClose={() => setQrLink(null)} />}
      {shareLink && <ShareModal link={shareLink} onClose={() => setShareLink(null)} />}
      {deleteModal && (
        <DeleteModal
          onConfirm={performDelete}
          onCancel={() => setDeleteModal(null)}
          deleting={deleting}
        />
      )}
      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}
      {campaignModalLink && (
        <AddToCampaignModal
          link={campaignModalLink}
          existingCampaigns={(() => {
            const campaignsMap = {};
            links.forEach((l) => {
              const linkCampaigns = new Set();
              try {
                const urlObj = new URL(l.original);
                const campaign = urlObj.searchParams.get("utm_campaign");
                if (campaign && campaign.trim()) linkCampaigns.add(campaign.trim());
              } catch {}
              if (Array.isArray(l.campaigns)) {
                l.campaigns.forEach((c) => {
                  const name = typeof c === "string" ? c : c?.name;
                  if (name && name.trim()) linkCampaigns.add(name.trim());
                });
              }
              linkCampaigns.forEach((name) => {
                if (!campaignsMap[name]) campaignsMap[name] = { name, linksCount: 0 };
                campaignsMap[name].linksCount += 1;
              });
            });
            return Object.values(campaignsMap).sort((a, b) => b.linksCount - a.linksCount);
          })()}
          token={token}
          onClose={() => setCampaignModalLink(null)}
          onSuccess={() => fetchLinks()}
        />
      )}

      <div className="flex min-h-screen">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} linksCount={links.length} FREE_LIMIT={FREE_LIMIT} isPremium={isPremium} />

        {/* ── Main ── */}
        <main className="flex-1 min-w-0 md:ml-60 lg:ml-80 px-4 sm:px-6 md:px-8 py-6 md:py-8">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-2 md:mb-6  gap-1 md:gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 hover:bg-slate-50 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 truncate">
                My Links
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
                Manage and track your shortened URLs.
              </p>
            </div>

            <button
              onClick={() => {
                if (atLimit) {
                  setShowLimitModal(true);
                } else {
                  setShowForm(!showForm);
                }
              }}
              className="flex items-center gap-2 font-semibold text-sm px-3 sm:px-4 py-2.5 rounded-xl transition-colors shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Link</span>
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-5">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-800">Error</div>
                <div className="text-xs text-red-700 mt-0.5 break-words">{error}</div>
              </div>
            </div>
          )}

          {/* Create form */}
          {showForm && !atLimit && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 sm:p-6 mb-2 md:mb-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-2 md:mb-4">Create Your Tracked Link</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5 md:mb-1">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    placeholder="https://your-long-url.com/..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5 md:mb-1">
                    Custom Alias (optional)
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <span className="text-slate-400 text-sm pl-4 pr-1 whitespace-nowrap">
                      redirect.curtio.io/
                    </span>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) =>
                        setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      placeholder="my-link"
                      className="flex-1 py-2.5 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                    />
                  </div>
                </div>

                {/* Advanced toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors pt-1"
                >
                  {showAdvanced ? "Hide" : "Show"} advanced options.
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvanced && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 md:p-4 space-y-3 md:space-y-4">
                    {/* UTM Builder */}
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1 md:mb-2 flex items-center gap-1.5">
                        <TrendingUp size={12} /> UTM Parameters
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { label: "Source", val: utmSource, set: setUtmSource, ph: "twitter" },
                          { label: "Medium", val: utmMedium, set: setUtmMedium, ph: "social" },
                          { label: "Campaign", val: utmCampaign, set: setUtmCampaign, ph: "launch" },
                        ].map((f) => (
                          <div key={f.label}>
                            <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                            <input
                              type="text"
                              value={f.val}
                              onChange={(e) => f.set(e.target.value)}
                              placeholder={f.ph}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                            />
                          </div>
                        ))}
                      </div>
                      {(utmSource || utmMedium || utmCampaign) && (
                        <div className="mt-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono break-all">
                          {buildFinalUrl(url || "https://your-url.com")}
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 md:mb-2">
                        <span className="flex items-center gap-1.5">
                          <Lock size={12} /> Password Protection (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank for no password"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Visitors must enter this password before being redirected.
                      </p>
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 md:mb-2">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} /> Link Expiration (optional)
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Link will stop redirecting after this date and time.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1 flex-wrap">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {creating ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      "Create Link"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className={`grid grid-cols-2 sm:grid-cols-2 ${canViewPreClicks ? "lg:grid-cols-5 xl:grid-cols-5" : "lg:grid-cols-4 xl:grid-cols-4"} gap-2.5 sm:gap-4 mb-3 xl:mb-5`}>
            <Link to="/dashboard/analytics" className="w-full">
              <StatCard
                icon={<ArrowUpRight size={16} className="text-green-600" />}
                label="Redirected Clicks"
                value={totalClicks.toLocaleString()}
                sub="Completed redirects"
              />
            </Link>
            {canViewPreClicks && (
              <Link to="/dashboard/preclick" className="w-full">
                <StatCard
                  icon={<ArrowDownRight size={16} className="text-violet-500" />}
                  label="Non-Redirected Clicks"
                  value={totalPreClicks.toLocaleString()}
                  sub="no redirect"
                />
              </Link>
            )}
            <StatCard
              icon={<ToggleRight size={16} className="text-green-500" />}
              label="Active Links"
              value={activeLinks.toLocaleString()}
              sub="Currently redirecting"
            />
            <StatCard
              icon={<ToggleLeft size={16} className="text-slate-400" />}
              label="Inactive Links"
              value={inactiveLinks.toLocaleString()}
              sub="Disabled links"
            />
            <StatCard
              icon={<TrendingUp size={16} className="text-indigo-600" />}
              label="Returning Users"
              value={returningUsersPercentage}
              sub="Last 30 days"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search links..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative w-40" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
              >
                <span>{selectedFilter}</span>

                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${open ? "rotate-180" : ""
                    }`}
                />
              </button>

              {open && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                  {["All", "Active", "Inactive"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(item);
                        setOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer transition-colors ${selectedFilter === item
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* ── Links Table — only the table scrolls on x-axis ── */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {loadingLinks ? (
              <div className="py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
                <div className="text-slate-500 text-sm font-medium">
                  Loading your tracked links...
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <LinkIcon size={28} className="text-slate-200 mx-auto mb-3" />
                <div className="text-slate-500 text-sm font-medium">No links yet</div>
                <div className="text-slate-400 text-xs mt-1">
                  Create your first tracked link above.
                </div>
              </div>
            ) : (
              /* Scroll container — ONLY horizontal, no vertical scroll */
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: "780px" }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">
                        Short Link
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">
                        Destination
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">
                        Clicks
                      </th>
                      <th className="text-center text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-center text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">
                        Labels
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((link, i) => {
                      const isNew = isLinkNew(link);
                      return (
                      <tr
                        key={link.id}
                        onClick={() => {
                          if (isNew) {
                            markLinkAsViewed(link.id);
                            setLinks((prev) => [...prev]);
                          }
                        }}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""
                          }`}
                      >
                        {/* Short link */}
                        <td className="px-5 py-4" style={{ minWidth: "180px" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                              <Zap size={12} className="text-indigo-500" fill="currentColor" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-sm font-semibold text-indigo-600 whitespace-nowrap">
                                  {link.short}
                                </div>
                                {isNew && (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markLinkAsViewed(link.id);
                                      setLinks((prev) => [...prev]);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full cursor-pointer hover:bg-amber-600 transition-colors shadow-sm animate-pulse"
                                    title="New link! Click to dismiss ticket"
                                  >
                                    NEW <X size={10} />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                  {link.createdAt}
                                </span>
                                {link.password && (
                                  <Lock size={10} className="text-amber-500 shrink-0" title="Password protected" />
                                )}
                                {link.expiresAt && (
                                  <Clock size={10} className="text-orange-500 shrink-0" title={`Expires ${link.expiresAt}`} />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="px-5 py-4" style={{ minWidth: "160px", maxWidth: "220px" }}>
                          <span className="text-xs text-slate-500 truncate block" title={link.original}>
                            {link.original}
                          </span>
                        </td>

                        {/* Clicks */}
                        <td className="px-5 py-4 text-right" style={{ minWidth: "70px" }}>
                          <span className="text-sm font-bold text-slate-800">
                            {link.clicks.toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center" style={{ minWidth: "72px" }}>
                          <button
                            onClick={() => handleToggle(link.id, link.slug)}
                            className="flex items-center justify-center mx-auto cursor-pointer"
                          >
                            {link.active ? (
                              <ToggleRight size={22} className="text-indigo-500" />
                            ) : (
                              <ToggleLeft size={22} className="text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* Labels */}
                        <td className="px-5 py-4 text-center" style={{ minWidth: "140px" }}>
                          <LabelCell
                            link={link}
                            accountLabels={accountLabels}
                            onLabelsChanged={fetchLinks}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4" style={{ minWidth: "150px" }}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setCampaignModalLink(link)}
                              title="Add to Campaign"
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              <Target size={14} />
                            </button>
                            <button
                              onClick={() => setShareLink(link)}
                              title="Share on WhatsApp"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                            >
                              <FaWhatsapp size={14} />
                            </button>




                            <button
                              onClick={() => handleCopy(link.id, link.short)}
                              title="Copy link"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              {copied === link.id ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>

                            <button
                              onClick={() => setQrLink(link)}
                              title="QR Code"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                            >
                              <QrCode size={14} />
                            </button>
                            <Link
                              to={`/analytics/${link.id}`}
                              title="Analytics"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              <BarChart2 size={14} />
                            </Link>
                            <a
                              href={link.original}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open destination"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              onClick={() => handleDelete(link.id, link.slug)}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              Free plan: up to {FREE_LIMIT} tracked links.
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}