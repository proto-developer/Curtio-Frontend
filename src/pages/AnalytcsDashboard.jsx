import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSocket from "../socket/useSocket";
import { Copy,Check,BarChart2,Trash2,Link as LinkIcon, MousePointerClick,ToggleLeft,ToggleRight,QrCode,Menu,AlertCircle,Smartphone,Globe,Activity,Funnel, Target, X,
} from "lucide-react";
import {AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,BarChart,Bar,
} from "recharts";
import { SHORTENER_DOMAIN } from "../components/Shortner";
import Sidebar from "../components/Sidebar";
import Filter from "../components/filter";
import ShareModal from "../components/LinkShareModal";
import LabelCell from "../components/LabelCell";
import { isOwner } from "../ownerAccess";
import AddToCampaignModal from "../components/AddToCampaignModal";
import { isLinkNew, markLinkAsViewed } from "../lib/newLinkTracker";

const FREE_LIMIT = 100;
import {FaWhatsapp} from "react-icons/fa";
import env from "../../Config/env";

const COLORS = ["#4F46E5", "#F97316", "#22C55E", "#EAB308", "#EC4899"];

import {REFERER_RULES,BROWSER_RULES,detectSource,ALL_RULES,platformIconMap,} from "../lib/sourceDetection";
import QrModal from "../components/ui/QrModal";

function StatCard({ icon, label, value, sub, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-100 min-h-[5.5rem] md:min-h-[7.5rem] rounded-2xl p-3 md:p-5 shadow-sm hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-200 transition-all duration-300 cursor-pointer ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5 md:mb-3 gap-1">
        <span className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-500 truncate">{label}</span>
        <div className="w-6 h-6 md:w-9 md:h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="text-lg sm:text-xl md:text-3xl font-extrabold text-slate-900 truncate">{value}</div>
      {sub && <div className="text-[10px] sm:text-xs xl:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">{sub}</div>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-100 rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
        <div className="font-semibold mb-0.5">{label}</div>
        <div>{payload[0].value.toLocaleString()} clicks</div>
      </div>
    );
  }
  return null;
};



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
            className="flex-1 py-2.5 cursor-pointer rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 cursor-pointer py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
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

export default function AnalytcsDashboard() {
  const navigate = useNavigate();

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

  function handleLogout() {
    localStorage.removeItem("apiToken");
    localStorage.removeItem("LoginUser");
    navigate("/login");
  }

  const token = localStorage.getItem("apiToken");

  // const isPremium = PREMIUM_USERS.includes(userEmail);
  // const FREE_LIMIT = isPremium ? Infinity : 1;
  const isPremium = true;
  const FREE_LIMIT = Infinity;

  // Helper function to format date as YYYY-MM-DD
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate date range: today to 7 days ago
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const defaultEndDate = formatDateToString(tomorrow);
  const defaultStartDate = formatDateToString(sevenDaysAgo);

  const [rawUrls, setRawUrls] = useState([]);
  const [links, setLinks] = useState([]);
  const [accountLabels, setAccountLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [campaignModalLink, setCampaignModalLink] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [pendingStartDate, setPendingStartDate] = useState(defaultStartDate);
  const [pendingEndDate, setPendingEndDate] = useState(defaultEndDate);
  const [pendingCountry, setPendingCountry] = useState(selectedCountry);
  const [pendingDevice, setPendingDevice] = useState(selectedDevice);
  const [pendingSource, setPendingSource] = useState(selectedSource);

  useEffect(() => {
    if (filterOpen) {
      setPendingStartDate(startDate);
      setPendingEndDate(endDate);
      setPendingCountry(selectedCountry);
      setPendingDevice(selectedDevice);
      setPendingSource(selectedSource);
    }
  }, [
    filterOpen,
    startDate,
    endDate,
    selectedCountry,
    selectedDevice,
    selectedSource,
  ]);

  // Real calendar state — initialized to current month/year
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-indexed

  const handleDateClick = (dateStr) => {
    if (!pendingStartDate || (pendingStartDate && pendingEndDate)) {
      setPendingStartDate(dateStr);
      setPendingEndDate("");
    } else if (dateStr < pendingStartDate) {
      setPendingEndDate(pendingStartDate);
      setPendingStartDate(dateStr);
    } else {
      setPendingEndDate(dateStr);
    }
  };

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  // Number of days in the current calendar month
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  // Day-of-week the 1st falls on (0 = Sun)
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchUrls();
  }, [token]);

  // ── Real-time Socket.IO listener (replaces polling) ──────────
  useSocket("analytics:updated", (updatedUrl) => {
    if (!updatedUrl) return;

    setRawUrls((prev) =>
      prev.map((u) => (u._id === updatedUrl._id ? updatedUrl : u))
    );

    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== updatedUrl._id) return l;
        return {
          ...l,
          clicks: updatedUrl.clicks,
          preClicks: updatedUrl.preClicks || 0,
          preClickLogs: updatedUrl.preClickLogs || [],
          clickLogs: updatedUrl.clickLogs || [],
          active: updatedUrl.active,
          labels: updatedUrl.labels || [],
          campaigns: updatedUrl.campaigns || [],
        };
      })
    );
  });

  async function fetchUrls(background = false) {
    if (!background) setLoading(true);
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
        const sortedUrls = [...(data.urls || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRawUrls(sortedUrls);
        if (data.labels) {
          setAccountLabels(data.labels);
        }
        const mapped = sortedUrls.map((u) => ({
          id: u._id,
          slug: u.shortCode,
          original: u.originalUrl,
          short: `${SHORTENER_DOMAIN}/${u.shortCode}`,
          clicks: u.clicks,
          preClicks: u.preClicks || 0,
          preClickLogs: u.preClickLogs || [],
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
        if (!background) setError(data.message || "Failed to fetch URLs.");
      }
    } catch (err) {
      if (!background)
        setError("Network error. Could not retrieve link statistics.");
    } finally {
      if (!background) setLoading(false);
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
      const baseUrl = env.BACKEND_URL;
      const res = await fetch(`${baseUrl}/urls/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setRawUrls((prev) => prev.filter((u) => u._id !== id));
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
      const baseUrl = env.BACKEND_URL;
      const res = await fetch(`${baseUrl}/urls/${slug}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, active: data.url.active } : l,
          ),
        );
        setRawUrls((prev) =>
          prev.map((u) =>
            u._id === id ? { ...u, active: data.url.active } : u,
          ),
        );
      } else {
        setError(data.message || "Failed to update link status.");
      }
    } catch (err) {
      setError("Network error. Could not update link status.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-semibold text-sm">
          Loading user analytics...
        </p>
      </div>
    );
  }

  // ── Aggregated Stats Calculations (filtered) ──
  // Build filtered logs across all links according to selected filters
  const allFilteredLogs = [];
  const perLinkCounts = {};
  links.forEach((l) => {
    (l.clickLogs || []).forEach((log) => {
      const clickedAt = log.clickedAt
        ? new Date(log.clickedAt).toISOString().slice(0, 10)
        : null;
      if (startDate && clickedAt && clickedAt < startDate) return;
      if (endDate && clickedAt && clickedAt > endDate) return;
      const ua = (log.userAgent || "").toLowerCase();
      const detectDevice = () => {
        if (/mobile|android|iphone|phone/i.test(ua)) return "Mobile";
        if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
        return "Desktop";
      };
      if (selectedDevice && detectDevice() !== selectedDevice) return;
      if (selectedCountry && (log.country || "") !== selectedCountry) return;
      // platform/source
      const matchedSource = detectSource(log);
      if (selectedSource && matchedSource !== selectedSource) return;

      allFilteredLogs.push({ ...log, linkId: l.id, short: l.short });
      perLinkCounts[l.id] = (perLinkCounts[l.id] || 0) + 1;
    });
  });

  const totalUrls = links.length;
  const totalClicks = allFilteredLogs.length;
  const totalPreClicks = links.reduce((sum, l) => sum + (l.preClicks || 0), 0);
  const activeLinks = links.filter((l) => l.active).length;
  const inactiveLinks = totalUrls - activeLinks;

  const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const chartStart = parseDate(startDate);
  const chartEnd = parseDate(endDate);
  const clickHistory = [];
  const daysMap = {};

  const rangeStart =
    chartStart || new Date(new Date().setDate(new Date().getDate() - 6));
  const rangeEnd = chartEnd || chartStart || new Date();

  const iterator = new Date(rangeStart);
  while (iterator <= rangeEnd) {
    const dateStr = iterator.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    daysMap[dateStr] = 0;
    iterator.setDate(iterator.getDate() + 1);
  }

  allFilteredLogs.forEach((log) => {
    const clickedAt = log.clickedAt ? new Date(log.clickedAt) : null;
    if (!clickedAt) return;
    if (chartStart && clickedAt < chartStart) return;
    if (chartEnd && clickedAt > chartEnd) return;
    const dateStr = clickedAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    if (daysMap[dateStr] !== undefined) daysMap[dateStr]++;
  });

  Object.keys(daysMap).forEach((date) =>
    clickHistory.push({ date, clicks: daysMap[date] }),
  );

  // Devices Breakdown
  let mobile = 0,
    desktop = 0,
    tablet = 0;
  allFilteredLogs.forEach((log) => {
    const ua = (log.userAgent || "").toLowerCase();
    if (/mobile|android|iphone|phone/i.test(ua)) mobile++;
    else if (/tablet|ipad|playbook|silk/i.test(ua)) tablet++;
    else desktop++;
  });
  const divider = allFilteredLogs.length || 1;
  const deviceData = [
    { name: "Desktop", value: Math.round((desktop / divider) * 100) },
    { name: "Mobile", value: Math.round((mobile / divider) * 100) },
    { name: "Tablet", value: Math.round((tablet / divider) * 100) },
  ].filter((d) => d.value > 0);
  const finalDeviceData = deviceData;

  // Referrer/source counts using detectSource
  const sourceCounts = {};
  allFilteredLogs.forEach((log) => {
    const src = detectSource(log);
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const referrerData = Object.entries(sourceCounts)
    .map(([source, visits]) => ({
      source,
      visits,
      color: "#4F46E5",
    }))
    .sort((a, b) => b.visits - a.visits);

  const geoDataMap = {};
  allFilteredLogs.forEach((log) => {
    const countryName = log.country || "Unknown";
    const countryCode = log.countryCode || "unknown";
    if (!geoDataMap[countryName]) {
      geoDataMap[countryName] = {
        country: countryName,
        countryCode,
        clicks: 0,
      };
    }
    geoDataMap[countryName].clicks += 1;
  });

  const getFlagEmoji = (code) => {
    if (!code || code.toLowerCase() === "unknown") return "🌐";
    try {
      const codePoints = code
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return "🌐";
    }
  };

  const geoData = Object.values(geoDataMap)
    .sort((a, b) => b.clicks - a.clicks)
    .map((g) => ({
      country: g.country,
      flag: getFlagEmoji(g.countryCode),
      clicks: g.clicks,
    }));

  const finalGeoData = geoData;



  const topLinks = [...links].sort((a, b) => new Date(b.rawCreatedAt || b.createdAt) - new Date(a.rawCreatedAt || a.createdAt));

  const isDefaultDateRange = startDate === defaultStartDate && endDate === defaultEndDate;

  let dateBadgeText = "Last 7 Days";
  let dateDescriptionText = <>Total clicks recorded across all links in the <strong className="text-slate-900">last 7 days</strong></>;

  if (!isDefaultDateRange && startDate && endDate) {
    const formattedStart = new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    dateBadgeText = `${formattedStart} - ${formattedEnd}`;
    dateDescriptionText = <>Total clicks recorded across all links from <strong className="text-slate-900">{formattedStart}</strong> to <strong className="text-slate-900">{formattedEnd}</strong></>;
  } else if (!isDefaultDateRange && startDate) {
    const formattedStart = new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    dateBadgeText = `From ${formattedStart}`;
    dateDescriptionText = <>Total clicks recorded across all links since <strong className="text-slate-900">{formattedStart}</strong></>;
  } else if (!isDefaultDateRange && endDate) {
    const formattedEnd = new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    dateBadgeText = `Until ${formattedEnd}`;
    dateDescriptionText = <>Total clicks recorded across all links up to <strong className="text-slate-900">{formattedEnd}</strong></>;
  }

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
              } catch { }
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
          onSuccess={() => fetchUrls()}
        />
      )}

      <div className="flex min-h-screen">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          linksCount={links.length}
          FREE_LIMIT={FREE_LIMIT}
          isPremium={isPremium}
        />

        {/* ── Main Content Area ── */}
        <main className="flex-1 min-w-0 md:ml-60 lg:ml-80 px-1.5 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
          {/* Top Header */}
          <main className="flex items-center justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 md:gap-3">
                <button
                  className="md:hidden p-2 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 hover:bg-slate-50 shrink-0"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={18} />
                </button>

                <div className="min-w-0">
                  <h1 className="text-sm md:text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 truncate">
                    Redirected Link Dashboard
                  </h1>
                  <p className="text-slate-500 text-xs text-xs mt-0.5">
                    Understand user engagement and link performance globally.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">

              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`px-3 py-2 border rounded-xl shadow-sm cursor-pointer flex items-center gap-2 transition-colors ${filterOpen ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Funnel size={18} />
                <span className="text-sm font-medium hidden sm:inline">
                  Filters
                </span>
              </button>
            </div>
          </main>

          {/* Filters Card */}
          {filterOpen && (
            <Filter
              startDate={pendingStartDate}
              endDate={pendingEndDate}
              setStartDate={setPendingStartDate}
              setEndDate={setPendingEndDate}
              calendarYear={calendarYear}
              calendarMonth={calendarMonth}
              prevMonth={prevMonth}
              nextMonth={nextMonth}
              firstDayOfWeek={firstDayOfWeek}
              daysInMonth={daysInMonth}
              handleDateClick={handleDateClick}
              finalGeoData={finalGeoData}
              finalDeviceData={finalDeviceData}
              referrerData={referrerData}
              selectedCountry={pendingCountry}
              setSelectedCountry={setPendingCountry}
              selectedDevice={pendingDevice}
              setSelectedDevice={setPendingDevice}
              selectedSource={pendingSource}
              setSelectedSource={setPendingSource}
              onClear={() => {
                setPendingStartDate("");
                setPendingEndDate("");
                setPendingCountry("");
                setPendingDevice("");
                setPendingSource("");
                setStartDate("");
                setEndDate("");
                setSelectedCountry("");
                setSelectedDevice("");
                setSelectedSource("");
              }}
              onApply={() => {
                setStartDate(pendingStartDate);
                setEndDate(pendingEndDate);
                setSelectedCountry(pendingCountry);
                setSelectedDevice(pendingDevice);
                setSelectedSource(pendingSource);
                setFilterOpen(false);
              }}
              setFilterOpen={setFilterOpen}
            />
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-800">Error</div>
                <div className="text-xs text-red-700 mt-0.5 break-words">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${canViewPreClicks ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-2.5 sm:gap-4`}>
            <Link to="/dashboard">
              <StatCard
                icon={<LinkIcon size={18} className="text-indigo-600" />}
                label="Total Links"
                value={totalUrls.toLocaleString()}
                sub="Created URLs"
              />
            </Link>

            <StatCard
              icon={<MousePointerClick size={18} className="text-orange-500" />}
              label="Redirected Clicks"
              value={totalClicks.toLocaleString()}
              sub="All time traffic"
            />
            {canViewPreClicks && <Link to="/dashboard/preclick">
              <StatCard
                icon={<MousePointerClick size={18} className="text-orange-500" />}
                label="Non-Redirected Clicks"
                value={totalPreClicks.toLocaleString()}
                sub="All time traffic"
              />
            </Link>}

            <Link to="/dashboard" state={{ filter: "Active" }}><StatCard
              icon={<Activity size={18} className="text-green-500" />}
              label="Active Links"
              value={activeLinks.toLocaleString()}
              sub="Currently redirecting"
            />
            </Link>
            <Link to="/dashboard" state={{ filter: "Inactive" }}><StatCard
              icon={<ToggleLeft size={18} className="text-slate-400" />}
              label="Inactive Links"
              value={inactiveLinks.toLocaleString()}
              sub="Disabled links"
            />
            </Link>
          </div>

          {/* Clicks Over Time Aggregated Chart */}
          <Card className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 xl:mb-5 mb-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Aggregate Traffic Trend
                </h2>
                <p className="text-xs text-slate-400">
                  {dateDescriptionText}
                </p>
              </div>
              {isDefaultDateRange && (
                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full w-max">
                  {dateBadgeText}
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={clickHistory}
                margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="globalClickGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fill="url(#globalClickGrad)"
                  dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Referrers + Devices Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Referrer Breakdown */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Browser Breakdown
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Hits per browser — Chrome, Edge, Safari and more
              </p>
              {referrerData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={referrerData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 24 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F5F9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="source"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={({ x, y, payload }) => {
                        const Icon = platformIconMap[payload.value] || Globe;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <Icon x={-8} y={8} size={16} color="#94A3B8" />
                          </g>
                        );
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(v, name, props) => [
                        v.toLocaleString() + " hits",
                        props.payload.source,
                      ]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                      cursor={{ fill: "#F1F5F9" }}
                    />
                    <Bar dataKey="visits" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {referrerData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Globe size={28} className="text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    No referrer data yet
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Data will appear once your links get clicks
                  </p>
                </div>
              )}
            </Card>

            {/* Device Breakdown */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Device Breakdown
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Distribution of user device types across all clicks
              </p>
              {finalDeviceData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={180} className="max-w-[220px]">
                    <PieChart>
                      <Pie
                        data={finalDeviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {finalDeviceData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${v}%`, ""]}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E2E8F0",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 w-full sm:w-auto flex-1">
                    {finalDeviceData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-xs text-slate-600 truncate">
                          {d.name}
                        </span>
                        <span className="text-xs font-bold text-slate-800 ml-auto pl-2">
                          {d.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-center">
                  <Smartphone size={28} className="text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    No device data yet
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Device stats will show once your links get clicks
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Geographic Breakdown & Top Links Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Country Share */}
            <Card className="p-4 sm:p-6 lg:col-span-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Geographic Share
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Estimated visitor origins based on click patterns
              </p>
              {finalGeoData.length > 0 ? (
                <div className="space-y-3">
                  {finalGeoData.map((geo, i) => {
                    const max = finalGeoData[0]?.clicks || 1;
                    const pct = Math.round((geo.clicks / max) * 100);
                    return (
                      <div
                        key={geo.country}
                        className="flex items-center gap-3"
                      >
                        <span className="text-lg sm:text-xl w-6 text-center shrink-0">
                          {geo.flag}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-700 font-semibold truncate">
                              {geo.country}
                            </span>

                            <span className="text-xs font-bold text-slate-800 ml-2 shrink-0">
                              {geo.clicks.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background:
                                  i === 0
                                    ? "#4F46E5"
                                    : i === 1
                                      ? "#6366F1"
                                      : i === 2
                                        ? "#818CF8"
                                        : "#A5B4FC",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Globe size={28} className="text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    No geographic data yet
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Country stats appear after clicks
                  </p>
                </div>
              )}
            </Card>

            {/* Top Performing Links */}
            <Card className="p-4 sm:p-6 lg:col-span-2 overflow-hidden min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-slate-900">
                  Top Performing Links
                </h2>
                <div className="text-xs font-medium text-slate-400">
                  Sorted by clicks
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Your most popular shortened URLs and their settings
              </p>

              <div className="overflow-x-auto">
                <table
                  className="w-full text-left border-collapse"
                  style={{ minWidth: "700px" }}
                >
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 pr-3">Short Link</th>
                      <th className="py-2.5 px-3 text-right">Clicks</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Labels</th>
                      <th className="py-2.5 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLinks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-slate-400 text-sm"
                        >
                          No links created yet.
                        </td>
                      </tr>
                    ) : (
                      topLinks.map((link) => {
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
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm"
                        >
                          <td className="py-3 pr-3 font-semibold text-indigo-600 max-w-[220px]">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="truncate">{link.short}</div>
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
                              <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                {link.original}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800">
                            {link.clicks.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggle(link.id, link.slug)}
                              className="focus:outline-none inline-flex items-center justify-center cursor-pointer"
                            >
                              {link.active ? (
                                <ToggleRight
                                  size={20}
                                  className="text-indigo-500"
                                />
                              ) : (
                                <ToggleLeft
                                  size={20}
                                  className="text-slate-300"
                                />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center" style={{ minWidth: "120px" }}>
                            <LabelCell
                              link={link}
                              accountLabels={accountLabels}
                              onLabelsChanged={fetchUrls}
                            />
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setCampaignModalLink(link)}
                                title="Add to Campaign"
                                className="p-1 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                <Target size={13} />
                              </button>
                              <button
                                onClick={() => setShareLink(link)}
                                title="Share on WhatsApp"
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-green-600 transition-colors cursor-pointer"
                              >
                                <FaWhatsapp size={13} />
                              </button>
                              <button
                                onClick={() => handleCopy(link.id, link.short)}
                                title="Copy Link"
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                {copied === link.id ? (
                                  <Check size={13} className="text-green-500" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                              <button
                                onClick={() => setQrLink(link)}
                                title="QR Code"
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                <QrCode size={13} />
                              </button>
                              <Link
                                to={`/analytics/${link.id}`}
                                title="Detailed Analytics"
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <BarChart2 size={13} />
                              </Link>
                              <button
                                onClick={() => handleDelete(link.id, link.slug)}
                                title="Delete"
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
