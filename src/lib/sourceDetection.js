/**
 * Shared source/browser detection logic and icon mapping.
 * Single source of truth — imported by AnalyticsDashboard, Analytics, PreClick, and Campaigns.
 */

import {
  FaUpwork,
  FaConfluence,
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
import { PiMicrosoftOutlookLogoDuotone } from "react-icons/pi";
import { BiLogoMicrosoftTeams } from "react-icons/bi";
import {
  SiAsana,
  SiGmail,
  SiGooglemeet,
  SiNotion,
  SiZoom,
  SiTorbrowser,
  SiBrave,
  SiClickup,
} from "react-icons/si";
import { Globe } from "lucide-react";

// ── Platform / Referrer rules ─────────────────────────────────
export const REFERER_RULES = [
  { source: "WhatsApp", pattern: /whatsapp/i, color: "#4F46E5", icon: FaWhatsapp },
  { source: "Messenger", pattern: /messenger/i, color: "#4F46E5", icon: FaFacebookMessenger },
  { source: "Facebook", pattern: /facebook|fbav|fban|fb_iab/i, color: "#4F46E5", icon: FaFacebook },
  { source: "Instagram", pattern: /instagram/i, color: "#4F46E5", icon: FaInstagram },
  { source: "TikTok", pattern: /tiktok|bytedance/i, color: "#4F46E5", icon: FaTiktok },
  { source: "YouTube", pattern: /youtube|youtu\.be/i, color: "#4F46E5", icon: FaYoutube },
  { source: "LinkedIn", pattern: /linkedin/i, color: "#4F46E5", icon: FaLinkedin },
  { source: "Twitter", pattern: /twitter|t\.co/i, color: "#4F46E5", icon: FaTwitter },
  { source: "Reddit", pattern: /reddit/i, color: "#4F46E5", icon: FaReddit },
  { source: "Pinterest", pattern: /pinterest/i, color: "#4F46E5", icon: FaPinterest },
  { source: "Snapchat", pattern: /snapchat/i, color: "#4F46E5", icon: FaSnapchat },
  { source: "Discord", pattern: /discord/i, color: "#4F46E5", icon: FaDiscord },
  { source: "Telegram", pattern: /telegram|t\.me/i, color: "#4F46E5", icon: FaTelegramPlane },
  { source: "Teams", pattern: /teams\.microsoft|teams\.cdn\.office|onecdn\.static\.microsoft/i, color: "#4F46E5", icon: BiLogoMicrosoftTeams },
  { source: "Slack", pattern: /slack/i, color: "#4F46E5", icon: FaSlack },
  { source: "Gmail", pattern: /mail\.google/i, color: "#4F46E5", icon: SiGmail },
  { source: "Outlook", pattern: /outlook/i, color: "#4F46E5", icon: PiMicrosoftOutlookLogoDuotone },
  { source: "WeChat", pattern: /wechat|micromessenger/i, color: "#4F46E5", icon: IoLogoWechat },
  { source: "Line", pattern: /line/i, color: "#4F46E5", icon: FaLine },
  { source: "Viber", pattern: /viber/i, color: "#4F46E5", icon: FaViber },
  { source: "Asana", pattern: /asana/i, color: "#4F46E5", icon: SiAsana },
  { source: "Trello", pattern: /trello/i, color: "#4F46E5", icon: FaTrello },
  { source: "ClickUp", pattern: /clickup/i, color: "#4F46E5", icon: SiClickup },
  { source: "Confluence", pattern: /atlassian|confluence/i, color: "#4F46E5", icon: FaConfluence },
  { source: "Upwork", pattern: /upwork/i, color: "#4F46E5", icon: FaUpwork },
  { source: "Zoom", pattern: /zoom\.us/i, color: "#4F46E5", icon: SiZoom },
  { source: "Google Meet", pattern: /meet\.google/i, color: "#4F46E5", icon: SiGooglemeet },
  { source: "Notion", pattern: /notion\.so/i, color: "#4F46E5", icon: SiNotion },
  { source: "Twitch", pattern: /twitch/i, color: "#4F46E5", icon: FaTwitch },
  { source: "Yahoo", pattern: /yahoo/i, color: "#4F46E5", icon: FaYahoo },
  { source: "Signal", pattern: /signal/i, color: "#4F46E5", icon: FaSignal },
];

// ── Browser rules (order matters — specific first, generic last) ──
export const BROWSER_RULES = [
  { source: "Hola Browser", pattern: /Hola/i, color: "#4F46E5", icon: Globe },
  { source: "Opera", pattern: /Opera|OPR\//i, color: "#4F46E5", icon: FaOpera },
  { source: "Edge", pattern: /Edg\//i, color: "#4F46E5", icon: FaEdge },
  { source: "Brave", pattern: /Brave/i, color: "#4F46E5", icon: SiBrave },
  { source: "Tor", pattern: /TorBrowser/i, color: "#4F46E5", icon: SiTorbrowser },
  { source: "Firefox", pattern: /Firefox|FxiOS/i, color: "#4F46E5", icon: FaFirefox },
  { source: "Internet Explorer", pattern: /Trident|MSIE/i, color: "#4F46E5", icon: FaInternetExplorer },
  { source: "Chrome", pattern: /Chrome|CriOS/i, color: "#4F46E5", icon: FaChrome },
  { source: "iOS Safari", pattern: /Mobile.*Safari/i, color: "#4F46E5", icon: FaSafari },
  { source: "Safari", pattern: /Safari/i, color: "#4F46E5", icon: FaSafari },
];

// ── Source detection ──────────────────────────────────────────
export function detectSource(log) {
  const ref = log.referer || "";
  const ua = log.userAgent || "";

  // 1. Try to identify a real platform from referer
  for (const rule of REFERER_RULES) {
    if (rule.pattern.test(ref)) return rule.source;
  }

  // 2. Some apps leave a signature in the User-Agent instead of a referer
  for (const rule of REFERER_RULES) {
    if (rule.pattern.test(ua)) return rule.source;
  }

  // 3. If backend already tagged a real platform (not a browser fallback), trust it
  const isBrowserLabel = BROWSER_RULES.some((r) => r.source === log.source);
  if (log.source && log.source !== "unknown" && log.source !== "Direct" && !isBrowserLabel) {
    return log.source;
  }

  // 4. Otherwise fall back to browser detection
  for (const rule of BROWSER_RULES) {
    if (rule.pattern.test(ua)) return rule.source;
  }

  return "Direct";
}

// ── Combined icon map (source name → icon component) ──────────
export const ALL_RULES = [...REFERER_RULES, ...BROWSER_RULES];
export const platformIconMap = Object.fromEntries(
  ALL_RULES.map((r) => [r.source, r.icon]),
);
