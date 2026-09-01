import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSocket from "../socket/useSocket";
import {
  Zap,
  Copy,
  Check,
  BarChart2,
  Trash2,
  Link as LinkIcon,
  TrendingUp,
  MousePointerClick,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Lock,
  Clock,
  Menu,
  X,
  LogOut,
  Pencil,
  Info,
  AlertCircle,
  Smartphone,
  Globe,
  Plus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  ArrowLeft,
  Target,
  Activity,
} from "lucide-react";
import { isOwner } from "../ownerAccess";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { SHORTENER_DOMAIN } from "../components/Shortner";
import Sidebar from "../components/Sidebar";
import Filter from "../components/filter";
import ShareModal from "../components/LinkShareModal";
import LabelCell from "../components/LabelCell";
import env from "../../Config/env";
import { isLinkNew, markLinkAsViewed, addNewLinkId } from "../lib/newLinkTracker";

import { FaWhatsapp } from "react-icons/fa6";

import {
  REFERER_RULES,
  BROWSER_RULES,
  detectSource,
  ALL_RULES,
  platformIconMap,
} from "../lib/sourceDetection";
import QrModal from "../components/ui/QrModal";

const COLORS = ["#4F46E5", "#F97316", "#22C55E", "#EAB308", "#EC4899"];


function StatCard({ icon, label, value, sub, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-100 min-h-[5.5rem] md:min-h-[7.5rem] rounded-2xl p-3 xl:p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5 md:mb-3 gap-1">
        <span className="text-[11px] sm:text-xs xl:text-sm font-medium text-slate-500 truncate">{label}</span>
        <div className="w-6 h-6 xl:w-9 xl:h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="text-lg sm:text-xl xl:text-3xl font-extrabold text-slate-900 truncate">{value}</div>
      {sub && <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">{sub}</div>}
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
            className="flex-1 py-2.5 cursor-pointer rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

function DeleteCampaignModal({ campaignName, linksCount, onConfirm, onCancel, deleting }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-800 flex items-center justify-center p-4"
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
          Delete campaign "{campaignName}"?
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          Are you sure you want to delete this campaign? The {linksCount} link{linksCount !== 1 ? "s" : ""} in this campaign will remain active in your account, but will no longer be grouped under this campaign.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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

function RemoveFromCampaignConfirmationModal({ linkShort, campaignName, onConfirm, onCancel, processing }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80 flex items-center justify-center p-4"
      onClick={() => !processing && onCancel()}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <X size={22} className="text-amber-600" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg mb-1">
          Remove Link from Campaign?
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm mb-6">
          Are you sure you want to remove link <span className="font-mono font-semibold text-slate-800">{linkShort}</span> from campaign <strong className="text-slate-800 font-bold">"{campaignName}"</strong>? The short link will remain active.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {processing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              "Remove"
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

export default function Campaigns() {
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

  const [links, setLinks] = useState([]);
  const [accountLabels, setAccountLabels] = useState({});

  // Calculate total links across all campaigns to determine if atLimit
  const atLimit = !isPremium && links.length >= FREE_LIMIT;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteCampaignModal, setDeleteCampaignModal] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [removeLinkFromCampaignModal, setRemoveLinkFromCampaignModal] = useState(null); // { linkObj, campaignName }
  const [removingFromCampaign, setRemovingFromCampaign] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
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

  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

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

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

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

  // Campaign State
  const [selectedCampaign, setSelectedCampaign] = useState(null); // name of the campaign, or null for overview
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // New campaign URL creation form fields
  const [useExistingLink, setUseExistingLink] = useState(false);
  const [selectedExistingLinkId, setSelectedExistingLinkId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef(null);
  const [destUrl, setDestUrl] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  function getCampaignParam(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.searchParams.get("utm_campaign") || null;
    } catch (e) {
      const match = urlStr.match(/[?&]utm_campaign=([^&#]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }

  function getSourceParam(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.searchParams.get("utm_source") || null;
    } catch (e) {
      const match = urlStr.match(/[?&]utm_source=([^&#]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }

  function getMediumParam(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.searchParams.get("utm_medium") || null;
    } catch (e) {
      const match = urlStr.match(/[?&]utm_medium=([^&#]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }

  function logMatchesFilters(log) {
    const clickedAt = log.clickedAt
      ? new Date(log.clickedAt).toISOString().slice(0, 10)
      : null;
    if (startDate && clickedAt && clickedAt < startDate) return false;
    if (endDate && clickedAt && clickedAt > endDate) return false;
    const ua = (log.userAgent || "").toLowerCase();
    const detectDevice = () => {
      if (/mobile|android|iphone|phone/i.test(ua)) return "Mobile";
      if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
      return "Desktop";
    };
    if (selectedDevice && detectDevice() !== selectedDevice) return false;
    if (selectedCountry && (log.country || "") !== selectedCountry)
      return false;
    const matchedSource = detectSource(log);
    if (selectedSource && matchedSource !== selectedSource) return false;
    return true;
  }

  // Group links by campaigns (both utm_campaign parameter and campaigns array)
  // campaignSourceMap: key = `${linkId}::${campaignName}` → source
  // campaignMediumMap: key = `${linkId}::${campaignName}` → medium
  const campaignsMap = {};
  const campaignSourceMap = {};
  const campaignMediumMap = {};
  links.forEach((link) => {
    const linkCampaigns = new Map(); // name -> { source, medium }
    const urlCampaign = getCampaignParam(link.original);
    const urlSource = getSourceParam(link.original);
    const urlMedium = getMediumParam(link.original);
    if (urlCampaign && urlCampaign.trim()) {
      linkCampaigns.set(urlCampaign.trim(), {
        source: (urlSource || "").trim(),
        medium: (urlMedium || "").trim(),
      });
    }
    if (Array.isArray(link.campaigns)) {
      link.campaigns.forEach((c) => {
        if (typeof c === "string") {
          if (c && c.trim()) linkCampaigns.set(c.trim(), { source: "", medium: "" });
        } else if (c && c.name && c.name.trim()) {
          linkCampaigns.set(c.name.trim(), {
            source: (c.source || "").trim(),
            medium: (c.medium || "").trim(),
          });
        }
      });
    }

    linkCampaigns.forEach((details, name) => {
      if (!campaignsMap[name]) {
        campaignsMap[name] = { name, links: [], clicks: 0, preClicks: 0, activeCount: 0 };
      }
      campaignsMap[name].links.push(link);
      // Store source and medium for this link-campaign pair
      campaignSourceMap[`${link.id}::${name}`] = details.source;
      campaignMediumMap[`${link.id}::${name}`] = details.medium;
      const linkFilteredCount = (link.clickLogs || []).filter(
        logMatchesFilters,
      ).length;
      const linkFilteredPreCount = (link.preClickLogs || []).filter(
        logMatchesFilters,
      ).length;
      campaignsMap[name].clicks += linkFilteredCount;
      campaignsMap[name].preClicks += linkFilteredPreCount;
      if (link.active) campaignsMap[name].activeCount += 1;
    });
  });

  const campaignsList = Object.values(campaignsMap).sort(
    (a, b) => b.clicks - a.clicks,
  );
  const totalCampaigns = campaignsList.length;
  const totalCampaignClicks = campaignsList.reduce(
    (sum, c) => sum + c.clicks,
    0,
  );
  const totalCampaignPreClicks = campaignsList.reduce(
    (sum, c) => sum + c.preClicks,
    0,
  );

  // Dynamic calculations for selected campaign
  let campaignLinks = [];
  let selectedCampaignData = null;
  let clickHistory = [];
  let finalDeviceData = [];
  let referrerData = [];
  let finalGeoData = [];

  if (selectedCampaign) {
    selectedCampaignData = campaignsMap[selectedCampaign];
    if (selectedCampaignData) {
      campaignLinks = selectedCampaignData.links;

      const allFilteredLogs = [];
      campaignLinks.forEach((l) => {
        (l.clickLogs || []).forEach((log) => {
          if (logMatchesFilters(log)) {
            allFilteredLogs.push(log);
          }
        });
      });

      const parseDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      };

      const chartStart = parseDate(startDate);
      const chartEnd = parseDate(endDate);
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

      Object.keys(daysMap).forEach((date) => {
        clickHistory.push({ date, clicks: daysMap[date] });
      });

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
      finalDeviceData = [
        { name: "Desktop", value: Math.round((desktop / divider) * 100) },
        { name: "Mobile", value: Math.round((mobile / divider) * 100) },
        { name: "Tablet", value: Math.round((tablet / divider) * 100) },
      ].filter((d) => d.value > 0);

      const sourceCounts = {};
      allFilteredLogs.forEach((log) => {
        const src = detectSource(log);
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      referrerData = Object.entries(sourceCounts)
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

      finalGeoData = Object.values(geoDataMap)
        .sort((a, b) => b.clicks - a.clicks)
        .map((g) => ({
          country: g.country,
          flag: getFlagEmoji(g.countryCode),
          clicks: g.clicks,
        }));
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
        setDeleteModal(null);
        if (selectedCampaignData) {
          const updatedLinks = selectedCampaignData.links.filter(
            (l) => l.id !== id,
          );
          if (updatedLinks.length === 0) {
            setSelectedCampaign(null);
          }
        }
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

  async function performDeleteCampaign() {
    if (!deleteCampaignModal) return;
    const { name } = deleteCampaignModal;
    setDeletingCampaign(true);
    setError("");
    try {
      const baseUrl = env.BACKEND_URL;
      const res = await fetch(`${baseUrl}/urls/campaign/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchUrls();
        setDeleteCampaignModal(null);
        if (selectedCampaign === name) {
          setSelectedCampaign(null);
        }
      } else {
        setError(data.message || "Failed to delete campaign.");
        setDeleteCampaignModal(null);
      }
    } catch (err) {
      setError("Network error. Could not delete campaign.");
      setDeleteCampaignModal(null);
    } finally {
      setDeletingCampaign(false);
    }
  }

  async function performRemoveLinkFromCampaign() {
    if (!removeLinkFromCampaignModal) return;
    const { linkObj, campaignName: campaignNameToRemove } = removeLinkFromCampaignModal;
    setRemovingFromCampaign(true);
    setError("");
    try {
      const baseUrl = env.BACKEND_URL;
      const updatedCampaigns = (linkObj.campaigns || [])
        .filter((c) => {
          const name = typeof c === "string" ? c : c?.name;
          return name && name.trim().toLowerCase() !== campaignNameToRemove.trim().toLowerCase();
        })
        .map((c) => (typeof c === "string" ? { name: c, source: "", medium: "" } : { name: c.name, source: c.source || "", medium: c.medium || "" }));

      const res = await fetch(`${baseUrl}/urls/${linkObj.slug}/campaigns`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ campaigns: updatedCampaigns }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUrls();
        setRemoveLinkFromCampaignModal(null);
        if (selectedCampaignData) {
          const remainingLinks = selectedCampaignData.links.filter(
            (l) => l.id !== linkObj.id,
          );
          if (remainingLinks.length <= 1) {
            setSelectedCampaign(null);
          }
        }
      } else {
        setError(data.message || "Failed to remove link from campaign.");
        setRemoveLinkFromCampaignModal(null);
      }
    } catch (err) {
      setError("Network error. Could not remove link from campaign.");
      setRemoveLinkFromCampaignModal(null);
    } finally {
      setRemovingFromCampaign(false);
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
      } else {
        setError(data.message || "Failed to update link status.");
      }
    } catch (err) {
      setError("Network error. Could not update link status.");
    }
  }

  function buildFinalUrl(base, cName, sName, mName) {
    const params = [];
    if (cName) params.push(`utm_campaign=${encodeURIComponent(cName.trim())}`);
    if (sName) params.push(`utm_source=${encodeURIComponent(sName.trim())}`);
    if (mName) params.push(`utm_medium=${encodeURIComponent(mName.trim())}`);
    if (!params.length) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}${params.join("&")}`;
  }

  /**
   * Build a display URL for a link within a specific campaign context.
   * Sets utm_campaign and utm_source so the same link shows differently
   * per campaign view (e.g. utm_campaign=facebook&utm_source=facebook).
   */
  function getCampaignDisplayUrl(originalUrl, campaignName, source) {
    try {
      const urlObj = new URL(originalUrl);
      // Strip existing UTM params so we can set the campaign-specific ones
      urlObj.searchParams.delete("utm_campaign");
      urlObj.searchParams.delete("utm_source");
      urlObj.searchParams.set("utm_campaign", campaignName);
      if (source) urlObj.searchParams.set("utm_source", source);
      return urlObj.toString();
    } catch {
      // Fallback for non-standard URLs
      let cleaned = originalUrl
        .replace(/([?&])utm_campaign=[^&#]*/gi, "")
        .replace(/([?&])utm_source=[^&#]*/gi, "")
        .replace(/\?&/, "?")
        .replace(/\?$/, "");
      const sep = cleaned.includes("?") ? "&" : "?";
      let result = `${cleaned}${sep}utm_campaign=${encodeURIComponent(campaignName)}`;
      if (source) result += `&utm_source=${encodeURIComponent(source)}`;
      return result;
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const activeCampaign = selectedCampaign || campaignName;
      if (!activeCampaign || !activeCampaign.trim()) {
        throw new Error("Campaign Name is required.");
      }

      const baseUrl = env.BACKEND_URL;

      if (useExistingLink) {
        if (!selectedExistingLinkId) {
          throw new Error("Please select an existing link.");
        }
        const targetLink = links.find((l) => l.id === selectedExistingLinkId);
        if (!targetLink) {
          throw new Error("Selected link not found.");
        }
        const existingCampaigns = Array.isArray(targetLink.campaigns)
          ? targetLink.campaigns.map((c) =>
              typeof c === "string"
                ? { name: c, source: "", medium: "" }
                : { name: c.name, source: c.source || "", medium: c.medium || "" }
            )
          : [];

        // Check if already in campaign
        const existingIdx = existingCampaigns.findIndex(
          (c) => c.name.toLowerCase() === activeCampaign.trim().toLowerCase()
        );
        const newObj = {
          name: activeCampaign.trim(),
          source: utmSource.trim(),
          medium: utmMedium.trim(),
        };
        if (existingIdx >= 0) {
          existingCampaigns[existingIdx] = newObj;
        } else {
          existingCampaigns.push(newObj);
        }

        const res = await fetch(`${baseUrl}/urls/${targetLink.slug}/campaigns`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ campaigns: existingCampaigns }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchUrls();
          setDestUrl("");
          setCampaignName("");
          setUtmSource("");
          setUtmMedium("");
          setAlias("");
          setPassword("");
          setExpiresAt("");
          setUseExistingLink(false);
          setSelectedExistingLinkId("");
          setShowCreateForm(false);
          if (!selectedCampaign) {
            setSelectedCampaign(activeCampaign.trim());
          }
        } else {
          setError(data.message || "Failed to update link campaigns.");
        }
      } else {
        const finalUrl = buildFinalUrl(
          destUrl,
          activeCampaign,
          utmSource,
          utmMedium,
        );
        const res = await fetch(`${baseUrl}/urls`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            originalUrl: finalUrl,
            customAlias: alias,
            password: password || undefined,
            expiresAt: expiresAt || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.url?._id) {
            addNewLinkId(data.url._id);
          }
          await fetchUrls();
          setDestUrl("");
          setCampaignName("");
          setUtmSource("");
          setUtmMedium("");
          setAlias("");
          setPassword("");
          setExpiresAt("");
          setUseExistingLink(false);
          setSelectedExistingLinkId("");
          setShowCreateForm(false);
          if (!selectedCampaign) {
            setSelectedCampaign(activeCampaign.trim());
          }
        } else {
          setError(data.message || "Failed to create short URL.");
        }
      }
    } catch (err) {
      setError(err.message || "Network error. Could not save campaign link.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-semibold text-sm">
          Loading campaign manager...
        </p>
      </div>
    );
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
      {deleteCampaignModal && (
        <DeleteCampaignModal
          campaignName={deleteCampaignModal.name}
          linksCount={deleteCampaignModal.links.length}
          onConfirm={performDeleteCampaign}
          onCancel={() => setDeleteCampaignModal(null)}
          deleting={deletingCampaign}
        />
      )}
      {removeLinkFromCampaignModal && (
        <RemoveFromCampaignConfirmationModal
          linkShort={removeLinkFromCampaignModal.linkObj.short}
          campaignName={removeLinkFromCampaignModal.campaignName}
          onConfirm={performRemoveLinkFromCampaign}
          onCancel={() => setRemoveLinkFromCampaignModal(null)}
          processing={removingFromCampaign}
        />
      )}
      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}

      <div className="flex min-h-screen">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          linksCount={links.length}
          FREE_LIMIT={FREE_LIMIT}
          isPremium={isPremium}
        />

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 md:ml-60 lg:ml-80 px-2 lg:px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-3 lg:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="md:hidden p-2 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 hover:bg-slate-50 shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>

              {selectedCampaign ? (
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="p-2 rounded-xl cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shrink-0 transition-colors"
                  title="Back to Overview"
                >
                  <ArrowLeft size={16} />
                </button>
              ) : null}

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 truncate">
                  {selectedCampaign
                    ? `Campaign: ${selectedCampaign}`
                    : "Campaigns Manager"}
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">
                  {selectedCampaign
                    ? `Detailed analysis of marketing URLs tagged under "${selectedCampaign}"`
                    : "Track, compare, and manage aggregated performance of links grouped by UTM campaigns"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (atLimit) {
                    setShowLimitModal(true);
                  } else {
                    setShowCreateForm(!showCreateForm);
                  }
                }}
                className="flex items-center gap-2 font-semibold text-sm px-3 sm:px-4 py-2.5 rounded-xl transition-colors shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 cursor-pointer"
              >
                <Plus size={16} />
                <span className="hidden sm:inline text-xs md:text-md">
                  {selectedCampaign ? "New Link" : "New Campaign"}
                </span>
              </button>
              {selectedCampaign && (
                <>
                  <button
                    onClick={() => setFilterOpen((s) => !s)}
                    className={`ml-2 px-3 py-2 border rounded-xl shadow-sm cursor-pointer flex items-center gap-2 transition-colors ${filterOpen ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M22 3H2l7 9v7l6-4v-3l7-9z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium">
                      Filters
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setDeleteCampaignModal({
                        name: selectedCampaign,
                        links: campaignLinks,
                      })
                    }
                    className="ml-1 px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Delete </span>
                  </button>
                </>
              )}
            </div>
          </div>
          {selectedCampaign && filterOpen && (
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

          {/* New Campaign Link Creation Form */}
          {showCreateForm && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">
                Create Tracked Link for{" "}
                {selectedCampaign ? `"${selectedCampaign}"` : "a Campaign"}
              </h2>
              {/* Tab Selector: Create New Link vs Add Existing Link */}
              <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setUseExistingLink(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !useExistingLink
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Create New Link
                </button>
                <button
                  type="button"
                  onClick={() => setUseExistingLink(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    useExistingLink
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Select Existing Link ({links.length})
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {useExistingLink ? (
                    <div className="sm:col-span-2 relative" ref={dropdownRef}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Select Existing Link *
                      </label>
                      
                      {/* Dropdown trigger button */}
                      <button
                        type="button"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
                      >
                        <span className="truncate">
                          {selectedExistingLinkId ? (
                            (() => {
                              const match = links.find((l) => l.id === selectedExistingLinkId);
                              return match ? (
                                <span className="font-medium text-slate-800">
                                  <span className="font-mono text-indigo-600 mr-2">{match.short}</span>
                                  <span className="text-slate-400 text-xs truncate">({match.original})</span>
                                </span>
                              ) : (
                                "-- Choose a short link --"
                              );
                            })()
                          ) : (
                            <span className="text-slate-400">-- Choose a short link --</span>
                          )}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${dropdownOpen ? "rotate-180 text-indigo-600" : ""}`} />
                      </button>

                      {/* Dropdown menu */}
                      {dropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-hidden flex flex-col divide-y divide-slate-100">
                          {/* Search box inside dropdown */}
                          <div className="p-2 bg-slate-50 sticky top-0 z-10">
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-400">
                              <Search size={14} className="text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={dropdownSearch}
                                onChange={(e) => setDropdownSearch(e.target.value)}
                                placeholder="Search short link or original URL..."
                                className="w-full text-xs text-slate-800 outline-none placeholder-slate-400"
                              />
                              {dropdownSearch && (
                                <button
                                  type="button"
                                  onClick={() => setDropdownSearch("")}
                                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Options list */}
                          <div className="overflow-y-auto max-h-48 p-1">
                            {(() => {
                              const filtered = links.filter((l) => {
                                const q = dropdownSearch.toLowerCase().trim();
                                if (!q) return true;
                                return (
                                  l.short.toLowerCase().includes(q) ||
                                  l.original.toLowerCase().includes(q) ||
                                  (l.slug && l.slug.toLowerCase().includes(q))
                                );
                              });

                              if (filtered.length === 0) {
                                return (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    No matching links found
                                  </div>
                                );
                              }

                              return filtered.map((l) => {
                                const isSelected = l.id === selectedExistingLinkId;
                                return (
                                  <div
                                    key={l.id}
                                    onClick={() => {
                                      setSelectedExistingLinkId(l.id);
                                      setDropdownOpen(false);
                                      setDropdownSearch("");
                                    }}
                                    className={`px-3 py-2.5 rounded-lg cursor-pointer text-xs flex flex-col gap-0.5 transition-colors ${
                                      isSelected
                                        ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold"
                                        : "hover:bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-indigo-600 font-medium">
                                        {l.short}
                                      </span>
                                      {isSelected && <Check size={14} className="text-indigo-600" />}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-md">
                                      {l.original}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Destination URL *
                      </label>
                      <input
                        type="url"
                        value={destUrl}
                        onChange={(e) => setDestUrl(e.target.value)}
                        required
                        placeholder="https://example.com/promo-landing"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Campaign Name (utm_campaign) *
                    </label>
                    <input
                      type="text"
                      value={selectedCampaign ? selectedCampaign : campaignName}
                      onChange={(e) =>
                        setCampaignName(
                          e.target.value.replace(/[^a-z0-9_-]/gi, ""),
                        )
                      }
                      disabled={!!selectedCampaign}
                      required
                      placeholder="e.g. summer_2026"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>

                  {!useExistingLink && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Custom Alias (optional)
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                        <span className="text-slate-400 text-sm pl-4 pr-1">
                          redirect.curtio.io/
                        </span>
                        <input
                          type="text"
                          value={alias}
                          onChange={(e) =>
                            setAlias(e.target.value.replace(/[^a-z0-9-]/gi, ""))
                          }
                          placeholder="summer-promo"
                          className="flex-1 py-2.5 pr-4 text-sm text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Source (utm_source - optional)
                    </label>
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="e.g. newsletter, facebook"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Medium (utm_medium - optional)
                    </label>
                    <input
                      type="text"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="e.g. email, cpc"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {creating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : useExistingLink ? (
                      "Add Link to Campaign"
                    ) : (
                      "Create Link"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content Views: Overview OR Campaign Detail */}
          {!selectedCampaign ? (
            /* ── VIEW 1: CAMPAIGNS OVERVIEW ── */
            <>
              {/* Stats Cards */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isOwner() ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-2 xl:gap-4`}>
                <StatCard
                  icon={<Target size={18} className="text-indigo-600" />}
                  label="Total UTM Campaigns"
                  value={totalCampaigns.toLocaleString()}
                  sub="Active groups"
                />
                <StatCard
                  icon={
                    <MousePointerClick size={18} className="text-orange-500" />
                  }
                  label="Campaign Redirected Clicks"
                  value={totalCampaignClicks.toLocaleString()}
                  sub="Clicks on tagged links"
                />
                {isOwner() && (
                  <StatCard
                    icon={<Activity size={18} className="text-amber-500" />}
                    label="Campaign Non-Redirected Clicks"
                    value={totalCampaignPreClicks.toLocaleString()}
                    sub="Owner view pre-clicks"
                  />
                )}
                <StatCard
                  icon={<FolderOpen size={18} className="text-green-500" />}
                  label="Tagged URLs"
                  value={links
                    .filter((l) => getCampaignParam(l.original))
                    .length.toLocaleString()}
                  sub={`Out of ${links.length} total links`}
                />
              </div>

              {/* Campaigns list table */}
              <Card className=" p-3 lg:p-6">
                <h2 className="text-sm lg:text-base font-bold text-slate-900 mb-1">
                  Your Marketing Campaigns
                </h2>
                <p className="text-[10px] lg:text-sm text-slate-400 mb-5">
                  Click on a campaign to view details, trends, and manage its
                  links
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] lg:text-xs font-semibold lg:font-bold uppercase tracking-wider">
                        <th className="py-3 pr-4">Campaign Name</th>
                        <th className="py-3 px-4 text-right">Links Count</th>
                        <th className="py-3 px-4 text-right">Total Clicks</th>
                        <th className="py-3 px-4 text-center">Active Links</th>
                        <th className="py-3 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignsList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-12 text-slate-400 text-sm"
                          >
                            <FolderOpen
                              size={32}
                              className="mx-auto text-slate-200 mb-2"
                            />
                            No campaigns detected yet.
                            <br />
                            <span className="text-xs text-slate-400">
                              Create a new link with the `utm_campaign` field
                              filled to start a campaign.
                            </span>
                          </td>
                        </tr>
                      ) : (
                        campaignsList.map((c) => (
                          <tr
                            key={c.name}
                            onClick={() => setSelectedCampaign(c.name)}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group text-sm"
                          >
                            <td className="py-4 pr-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="w-4 lg:w-8 h-4 lg:h-8 bg-indigo-50 group-hover:bg-indigo-100 transition-colors rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                  <Target size={10} className="text-[10px] lg:text-sm" />
                                </div>
                                <span className="text-[10px] lg:text-sm truncate max-w-[200px]">
                                  {c.name}
                                </span>
                              </div>
                            </td>
                            <td className=" text-[10px] lg:text-sm py-4 px-4 text-right font-medium text-slate-500">
                              {c.links.length} URLs
                            </td>
                            <td className="text-[10px] lg:text-sm py-4 px-4 text-right font-extrabold text-slate-800">
                              {c.clicks.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex text-[10px] lg:text-sm items-center px-1 lg:px-2 lg:py-0.5 rounded-full font-semibold bg-green-50 text-green-700">
                                {c.activeCount} / {c.links.length} Active
                              </span>
                            </td>
                            <td className="py-4 pl-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setDeleteCampaignModal({
                                      name: c.name,
                                      links: c.links,
                                    })
                                  }
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                  title="Delete Campaign"
                                >
                                  <Trash2 size={15} />
                                </button>
                                <button
                                  onClick={() => setSelectedCampaign(c.name)}
                                  className="text-slate-400 hover:text-slate-800 transition-colors p-1 cursor-pointer"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            /* ── VIEW 2: CAMPAIGN DETAILS ── */
            <>
              {/* Stats Cards for Selected Campaign */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isOwner() ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-2 xl:gap-4`}>
                <StatCard
                  icon={<LinkIcon size={18} className="text-indigo-600" />}
                  label="Campaign Links"
                  value={campaignLinks.length}
                  sub="URLs in this group"
                />
                <StatCard
                  icon={
                    <MousePointerClick size={18} className="text-orange-500" />
                  }
                  label="Campaign Redirected Clicks"
                  value={selectedCampaignData.clicks.toLocaleString()}
                  sub="Accumulated visits"
                />
                {isOwner() && (
                  <StatCard
                    icon={<Activity size={18} className="text-amber-500" />}
                    label="Campaign Non-Redirected Clicks"
                    value={selectedCampaignData.preClicks.toLocaleString()}
                    sub="Owner view pre-clicks"
                  />
                )}
                <StatCard
                  icon={<Zap size={18} className="text-green-500" />}
                  label="Active Links"
                  value={selectedCampaignData.activeCount}
                  sub="Redirection status"
                />
                <StatCard
                  icon={<FolderOpen size={18} className="text-indigo-600" />}
                  label="UTM Parameters"
                  value={`${[...new Set(campaignLinks.map((l) => getSourceParam(l.original)).filter(Boolean))].length} Sources`}
                  sub="Click channels"
                />
              </div>
              {/* Campaign Links List */}
              <Card className="p-3  lg:p-6">
                <h2 className="text-sm lg:text-base font-bold text-slate-900 mb-1">
                  URLs Tagged in Campaign
                </h2>
                <p className="text-[10px] lg:text-sm text-slate-400 mb-5">
                  Click lists, status, and custom properties of shortened links
                  in this group
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" style={{ minWidth: "780px" }}>
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 pr-3">Short Link</th>
                        <th className="py-2.5 px-3">UTM Details</th>
                        <th className="py-2.5 px-3 text-right">Clicks</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Labels</th>
                        <th className="py-2.5 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...campaignLinks].sort((a, b) => new Date(b.rawCreatedAt || b.createdAt) - new Date(a.rawCreatedAt || a.createdAt)).map((link) => {
                        const isNew = isLinkNew(link);
                        const pairSource = campaignSourceMap[`${link.id}::${selectedCampaign}`] || getSourceParam(link.original);
                        const pairMedium = campaignMediumMap[`${link.id}::${selectedCampaign}`] || getMediumParam(link.original);
                        const displayUrl = getCampaignDisplayUrl(link.original, selectedCampaign, pairSource);

                        // Build the campaign short URL with tracking params
                        let campaignShortUrl = `${link.short}?utm_campaign=${encodeURIComponent(selectedCampaign)}`;
                        if (pairSource) campaignShortUrl += `&utm_source=${encodeURIComponent(pairSource)}`;
                        if (pairMedium) campaignShortUrl += `&utm_medium=${encodeURIComponent(pairMedium)}`;
                        const campaignLinkObj = { ...link, short: campaignShortUrl };

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
                            <td className="py-3 pr-3 font-semibold text-indigo-600 max-w-[260px]">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="truncate font-mono text-xs" title={campaignShortUrl}>
                                    {campaignShortUrl}
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
                                <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5" title={link.original}>
                                  {link.original}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-1.5 flex-wrap">
                                <span className="text-[9px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                                  campaign: {selectedCampaign}
                                </span>
                                {pairSource && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                                    src: {pairSource}
                                  </span>
                                )}
                                {pairMedium && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                                    med: {pairMedium}
                                  </span>
                                )}
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
                            <td className="py-3 px-3 text-center">
                              <LabelCell
                                link={link}
                                accountLabels={accountLabels}
                                onLabelsChanged={fetchUrls}
                              />
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setShareLink(campaignLinkObj)}
                                  title="Share on WhatsApp"
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-green-600 transition-colors cursor-pointer"
                                >
                                  <FaWhatsapp size={13} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleCopy(link.id, campaignShortUrl)
                                  }
                                  title="Copy Campaign Short Link"
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                >
                                  {copied === link.id ? (
                                    <Check
                                      size={13}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                                <button
                                  onClick={() => setQrLink(campaignLinkObj)}
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
                                  onClick={() =>
                                    setRemoveLinkFromCampaignModal({
                                      linkObj: link,
                                      campaignName: selectedCampaign,
                                    })
                                  }
                                  title="Remove from this Campaign"
                                  className="p-1 rounded hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(link.id, link.slug)
                                  }
                                  title="Delete Link"
                                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
              {/* Traffic trend over time */}
              <Card className=" p-3 lg:p-6">
                <div>
                  <h2 className="text-sm lg:text-base font-bold text-slate-900">
                    Campaign Clicks Trend
                  </h2>
                  <p className="text-[10px] lg:text-sm text-slate-400 mb-5">
                    Aggregated weekly traffic specifically for campaign "
                    {selectedCampaign}"
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={clickHistory}
                    margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="campClickGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#4F46E5"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#4F46E5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      fill="url(#campClickGrad)"
                      dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Referrers + Devices Breakdowns */}
              <div className="grid lg:grid-cols-3 xl:grid-cols-2 grid-cols-1 lg:gap-6 gap-2">
                {/* Referrers */}
                <Card className="p-3 lg:p-6">
                  <h2 className="text-sm font-bold text-slate-900 mb-1">
                    Referrers
                  </h2>
                  <p className="text-[10px] lg:text-sm text-slate-400 mb-4">
                    Hits per platform — WhatsApp, TikTok, Direct and more
                  </p>
                  {referrerData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
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
                            const Icon =
                              platformIconMap[payload.value] || Globe;
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <Icon x={-8} y={8} size={16} color="#94A3B8" />
                              </g>
                            );
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94A3B8" }}
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
                            fontSize: 11,
                          }}
                          cursor={{ fill: "#F1F5F9" }}
                        />
                        <Bar
                          dataKey="visits"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        >
                          {referrerData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[180px] text-center">
                      <Globe size={24} className="text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400 font-medium">
                        No referrer data yet
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Data will appear once links get clicks
                      </p>
                    </div>
                  )}
                </Card>

                {/* Device type breakdown */}
                <Card className="p-3 lg:p-6">
                  <h2 className="text-sm md:text-base font-bold text-slate-900 mb-1">
                    Devices Breakdown
                  </h2>
                  <p className="text-[10px] md:text-sm text-slate-400 mb-4">
                    Platforms used by campaign visitors
                  </p>
                  <div className="flex items-center xl:gap-4 flex-col lg:flex-row">
                    <ResponsiveContainer width="55%" height={160}>
                      <PieChart>
                        <Pie
                          data={finalDeviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
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
                            fontSize: 11,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {finalDeviceData.map((d, i) => (
                        <div
                          key={d.name}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                          <span className="text-slate-600 truncate">
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-800 ml-auto pl-2">
                            {d.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Geographic Breakdown */}
                <Card className="lg:p-6 p-3">
                  <h2 className="text-sm font-bold text-slate-900 mb-1">
                    Geographic Share
                  </h2>
                  <p className="text-[10px] text-slate-400 mb-4">
                    Estimated visitor origins for this campaign
                  </p>
                  <div className="space-y-3.5">
                    {finalGeoData.map((geo, i) => {
                      const max = finalGeoData[0]?.clicks || 1;
                      const pct = Math.round((geo.clicks / max) * 100);
                      return (
                        <div
                          key={geo.country}
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm md:text-xl w-6 text-center shrink-0">
                            {geo.flag}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] md:text-xs text-slate-700 font-semibold truncate">
                                {geo.country}
                              </span>
                              <span className="text-xs font-bold text-slate-800 ml-2">
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
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
