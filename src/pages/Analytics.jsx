import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
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
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  MousePointerClick,
  TrendingUp,
  Globe,
  Smartphone,
  Zap,
  Activity,
  Target,
} from "lucide-react";
import Filter from "../components/filter";
import {
  FaBots,
  FaConfluence,
  FaMountainSun,
  FaSignalMessenger,
  FaSlack,
  FaTrello,
  FaTwitch,
  FaYahoo,
} from "react-icons/fa6";
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaLine,
  FaLinkedin,
  FaPinterest,
  FaReddit,
  FaSignal,
  FaSnapchat,
  FaTelegramPlane,
  FaTiktok,
  FaTwitter,
  FaViber,
  FaWhatsapp,
  FaFacebookMessenger,
  FaYoutube,
  FaChrome,
  FaFirefox,
  FaSafari,
  FaEdge,
  FaOpera,
  FaInternetExplorer,
} from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { IoIosMail } from "react-icons/io";
import { PiMicrosoftOutlookLogoDuotone } from "react-icons/pi";
import { BiLogoMicrosoftTeams } from "react-icons/bi";
import {
  SiAsana,
  SiGmail,
  SiGooglemeet,
  SiKik,
  SiNotion,
  SiThunderbird,
  SiZoom,
  SiTorbrowser,
  SiBrave,
} from "react-icons/si";
import { SHORTENER_DOMAIN } from "../components/Shortner";
import ShareModal from "../components/LinkShareModal";
import LabelCell from "../components/LabelCell";
import { isOwner } from "../ownerAccess";
import AddToCampaignModal from "../components/AddToCampaignModal";
import useSocket from "../socket/useSocket";
import env from "../../Config/env";

const COLORS = ["#4F46E5", "#F97316", "#22C55E", "#EAB308", "#EC4899"];

import {
  REFERER_RULES,
  BROWSER_RULES,
  detectSource,
  ALL_RULES,
  platformIconMap,
} from "../lib/sourceDetection";

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-100 rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, metricName = "clicks" }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
        <div className="font-semibold mb-0.5">{label}</div>
        <div>{payload[0].value.toLocaleString()} {metricName}</div>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("apiToken");
  const canViewPreClicks = isOwner();
  const isPreClickView = canViewPreClicks && searchParams.get("view") === "preclick";
  const metricLabel = isPreClickView ? "Non-Redirected Clicks" : "Redirected Clicks";

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

  const [filterOpen, setFilterOpen] = useState(false);
  const [shareLink, setShareLink] = useState(null);
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [link, setLink] = useState(null);
  const [accountLabels, setAccountLabels] = useState({});
  const [copied, setCopied] = useState(false);
  const [allLinks, setAllLinks] = useState([]);
  const [campaignModalLink, setCampaignModalLink] = useState(null);

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

  useEffect(() => {
    async function fetchAnalytics(background = false) {
      try {
        if (!background) setLoading(true);
        const baseUrl = env.BACKEND_URL;
        const res = await fetch(`${baseUrl}/urls`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
          if (data.urls) {
            setAllLinks(data.urls);
          }
          if (data.labels) {
            setAccountLabels(data.labels);
          }
          const match = data.urls.find((u) => u._id === id);
          if (match) {
            setLink({
              ...match,
              clickLogs: isPreClickView
                ? match.preClickLogs || []
                : match.clickLogs || [],
              short: `${SHORTENER_DOMAIN}/${match.shortCode}`,
              original: match.originalUrl,
              labels: match.labels || [],
            });
          } else {
            if (!background) setError("Link not found or not owned by you.");
          }
        } else {
          if (!background)
            setError(data.message || "Failed to fetch analytics.");
        }
      } catch (err) {
        if (!background)
          setError("Network error. Could not connect to server.");
      } finally {
        if (!background) setLoading(false);
      }
    }

    if (!token || !id) {
      setLoading(false);
      setError("Authentication token is missing. Please log in.");
      return;
    }

    fetchAnalytics();
  }, [token, id, isPreClickView]);

  // ── Real-time Socket.IO listener (replaces polling) ──────────
  useSocket("analytics:updated", (updatedUrl) => {
    if (!updatedUrl) return;

    // Update the allLinks array
    setAllLinks((prev) =>
      prev.map((u) => (u._id === updatedUrl._id ? updatedUrl : u))
    );

    // If this is the URL we're currently viewing, patch detail state
    if (updatedUrl._id === id) {
      setLink((prev) => ({
        ...prev,
        ...updatedUrl,
        clickLogs: isPreClickView
          ? updatedUrl.preClickLogs || []
          : updatedUrl.clickLogs || [],
        short: `${SHORTENER_DOMAIN}/${updatedUrl.shortCode}`,
        original: updatedUrl.originalUrl,
        labels: updatedUrl.labels || [],
      }));
    }
  });

  function handleCopy() {
    if (link) {
      navigator.clipboard.writeText(link.short);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-semibold text-sm">
          Loading {isPreClickView ? "pre-click" : "click"} logs...
        </p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full shadow-lg text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 font-extrabold text-2xl mx-auto mb-4">
            ⚠️
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">
            Analytics Unavailable
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {error || "Could not retrieve link logs."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredLogs = (link.clickLogs || []).filter((log) => {
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
  });

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

  filteredLogs.forEach((log) => {
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

  let mobile = 0,
    desktop = 0,
    tablet = 0;
  filteredLogs.forEach((log) => {
    const ua = (log.userAgent || "").toLowerCase();
    if (/mobile|android|iphone|phone/i.test(ua)) mobile++;
    else if (/tablet|ipad|playbook|silk/i.test(ua)) tablet++;
    else desktop++;
  });
  const divider = filteredLogs.length || 1;
  const deviceData = [
    { name: "Desktop", value: Math.round((desktop / divider) * 100) },
    { name: "Mobile", value: Math.round((mobile / divider) * 100) },
    { name: "Tablet", value: Math.round((tablet / divider) * 100) },
  ].filter((d) => d.value > 0);
  const finalDeviceData = deviceData;

  const sourceCounts = {};
  filteredLogs.forEach((log) => {
    const src = detectSource(log);
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const referrerData = Object.entries(sourceCounts)
    .map(([source, visits]) => ({
      source,
      visits,
      icon: platformIconMap[source] || Globe,
    }))
    .sort((a, b) => b.visits - a.visits);

  const geoDataMap = {};
  filteredLogs.forEach((log) => {
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

  const finalGeoData = Object.values(geoDataMap)
    .sort((a, b) => b.clicks - a.clicks)
    .map((g) => ({
      country: g.country,
      flag: getFlagEmoji(g.countryCode),
      clicks: g.clicks,
    }));

  return (
    <div className="min-h-screen bg-slate-50">
      {shareLink && <ShareModal link={shareLink} onClose={() => setShareLink(null)} />}
      {campaignModalLink && (
        <AddToCampaignModal
          link={campaignModalLink}
          existingCampaigns={(() => {
            const campaignsMap = {};
            allLinks.forEach((l) => {
              const linkCampaigns = new Set();
              try {
                const urlObj = new URL(l.originalUrl);
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
          onSuccess={() => {}}
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-auto min-h-[4rem] py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium shrink-0"
            >
              <ArrowLeft size={16} />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <Zap size={13} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-slate-900 text-sm truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {link.short}
              </span>
              {link.labels && link.labels.length > 0 && (
                <div className="ml-1 pl-2 border-l border-slate-200 flex items-center shrink-0">
                  <LabelCell link={link} accountLabels={accountLabels} readOnly={true} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-green-500" /> <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} /> <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
            <button
              onClick={() => setCampaignModalLink(link)}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Target size={13} /> <span className="hidden md:inline">Add to Campaign</span>
            </button>
            <button
              onClick={() => setShareLink(link)}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-green-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FaWhatsapp size={13} /> <span className="hidden sm:inline">Share</span>
            </button>
            <a
              href={link.original}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ExternalLink size={13} /> <span className="hidden sm:inline">Open</span>
            </a>
            <button
              onClick={() => setFilterOpen((s) => !s)}
              className={`px-2.5 sm:px-3 py-1.5 border rounded-lg text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${filterOpen ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
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
              <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                Filters
              </span>
            </button>
            {canViewPreClicks && (
              <Link
                to={`/analytics/${link._id || id}${isPreClickView ? "" : "?view=preclick"}`}
                className={`px-2.5 sm:px-3 py-1.5 border rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
                  isPreClickView
                    ? "bg-amber-500 text-white border-amber-500 font-semibold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                title="View Non-Redirected Pre-clicks"
              >
                <Activity size={14} />
                <span className="hidden sm:inline">
                  {isPreClickView ? "Pre-Clicks View" : "Pre-Clicks"}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
        {/* Prominent Mode Header Banner */}
        {canViewPreClicks && (
          <div className="sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {isPreClickView ? "Non-Redirected Link Analytics" : "Redirected Link Analytics"}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isPreClickView ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"}`}>
                    {isPreClickView ? "Non-Redirected" : "Redirected"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPreClickView
                    ? "Showing visitors who opened the non-redirect link."
                    : "Showing visitors who completed the countdown and were redirected to the target URL."}
                </p>
              </div>
            </div>

            {/* Toggle for Redirect & Non-Redirect Clicks */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner shrink-0">
              <Link
                to={`/analytics/${id}`}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!isPreClickView
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-900 hover:text-indigo-600"
                  }`}
              >
                Redirected Clicks
              </Link>
              <Link
                to={`/analytics/${id}?view=preclick`}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isPreClickView
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-900 hover:text-indigo-600"
                  }`}
              >
                Non-Redirected Clicks
              </Link>
            </div>
          </div>
        )}


        {/* Stats pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">

          {canViewPreClicks ? (
            <Link
              to={isPreClickView ? `/analytics/${id}` : `/analytics/${id}?view=preclick`}
              className="flex items-center gap-3 bg-white border border-l-2 border-l-indigo-600 rounded-2xl border-y-slate-100 border-r-slate-100 p-3 sm:p-5 shadow-sm hover:border-2 hover:border-indigo-600 hover:shadow-indigo-100 transition-all min-w-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <Activity size={18} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                  {isPreClickView ? "Redirected Clicks" : "Non-Redirected Clicks"}
                </div>
                <div className="text-xs sm:text-sm font-bold text-indigo-600 mt-0.5 sm:mt-1 truncate">
                  Same Link Analytics
                </div>
              </div>
            </Link>
          ) : (
            <StatPill
              icon={<TrendingUp size={18} className="text-orange-500" />}
              label="In Range"
              value={filteredLogs.length.toLocaleString()}
            />
          )}
          <StatPill
            icon={<MousePointerClick size={18} className="text-indigo-600" />}
            label={`Total ${metricLabel}`}
            value={filteredLogs.length.toLocaleString()}
          />
          <StatPill
            icon={<Globe size={18} className="text-indigo-600" />}
            label="Country Share"
            value={finalGeoData.length}
          />
          <StatPill
            icon={<Smartphone size={18} className="text-orange-500" />}
            label="Mobile Breakdown"
            value={`${Math.round((mobile / divider) * 100)}%`}
          />
        </div>
        {/* Link info */}
        <div className="bg-white border border-slate-100 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
            Destination
          </div>
          <a
            href={link.original}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 text-xs sm:text-sm hover:text-indigo-600 transition-colors break-all line-clamp-2"
          >
            {link.original}
          </a>
        </div>

        {/* Click history chart */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-5">
            {metricLabel} Over Time
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={clickHistory}
              margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomTooltip metricName={metricLabel.toLowerCase()} />} />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fill="url(#clickGrad)"
                dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Referrers + Devices row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Referrers bar chart */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-5">
              Top Browsers
            </h2>
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
                  formatter={(v) => [v.toLocaleString(), "visits"]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "#F1F5F9" }}
                />
                <Bar
                  dataKey="visits"
                  fill="#4F46E5"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Device pie chart */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-5">
              Device Breakdown
            </h2>
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
                    <span className="text-xs text-slate-600">{d.name}</span>
                    <span className="text-xs font-bold text-slate-800 ml-auto pl-4">
                      {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Top countries */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">
            Top Countries
          </h2>
          <div className="space-y-3">
            {finalGeoData.map((geo, i) => {
              const max = finalGeoData[0].clicks || 1;
              const pct = Math.round((geo.clicks / max) * 100);
              return (
                <div key={geo.country} className="flex items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl w-6 sm:w-7 text-center shrink-0">{geo.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm text-slate-700 font-medium truncate">
                        {geo.country}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 ml-2 shrink-0">
                        {geo.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background:
                            i === 0
                              ? "#4F46E5"
                              : i === 1
                                ? "#6366F1"
                                : "#818CF8",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
