import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Check,
  BarChart2,
  ExternalLink,
  Trash2,
  QrCode,
  Lock,
  Clock,
  ToggleLeft,
  ToggleRight,
  Target,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import LabelCell from "./LabelCell";
import { isLinkNew, markLinkAsViewed } from "../lib/newLinkTracker";

/**
 * MobileLinkList — compact, scroll-free link list for small screens.
 *
 * Each row shows the short link + destination and a "View" button that opens a
 * bottom sheet with the full detail: clicks, status toggle, labels, and every
 * per-link action. Designed to replace a horizontally-scrolling table on mobile
 * while the desktop table stays as-is.
 *
 * Props (all data / behaviour is supplied by the parent page so this component
 * stays stateless about the app):
 *   links            — array of link objects ({ id, slug, short, original,
 *                       clicks, active, createdAt, password, expiresAt, labels, ... })
 *   accountLabels    — label dictionary passed straight to <LabelCell/>
 *   copiedId         — id of the link currently showing the "copied" checkmark
 *   onCopy(id, short)          — copy the short link
 *   onToggle(id, slug)         — flip active/inactive
 *   onDelete(id, slug)         — start the delete flow
 *   onShare(link)              — open the share modal
 *   onQr(link)                 — open the QR modal
 *   onAddToCampaign(link)      — open the add-to-campaign modal
 *   onLabelsChanged()          — re-fetch after labels change
 *   refresh()                  — force a re-render (used when a NEW badge is dismissed)
 *   analyticsPath(id)          — route for the analytics link (defaults to /analytics/:id)
 *   emptyText                  — text shown when links is empty
 *   className                  — wrapper class (e.g. "md:hidden")
 */
function ActionRow({
  link,
  copiedId,
  onCopy,
  onQr,
  onShare,
  onDelete,
  onAddToCampaign,
  onRemoveFromCampaign,
  showAddToCampaign = true,
  analyticsPath,
  onNavigate,
}) {
  const btn =
    "p-2 rounded-lg text-slate-400 transition-colors cursor-pointer";
  return (
    <div className="flex flex-wrap items-center gap-1">
      {showAddToCampaign && (
        <button
          onClick={() => onAddToCampaign(link)}
          title="Add to Campaign"
          className={`${btn} hover:bg-indigo-50 hover:text-indigo-600`}
        >
          <Target size={18} />
        </button>
      )}
      <button
        onClick={() => onShare(link)}
        title="Share on WhatsApp"
        className={`${btn} hover:bg-slate-100 hover:text-violet-600`}
      >
        <FaWhatsapp size={18} />
      </button>
      <button
        onClick={() => onCopy(link.id, link.short)}
        title="Copy link"
        className={`${btn} hover:bg-slate-100 hover:text-slate-700`}
      >
        {copiedId === link.id ? (
          <Check size={18} className="text-green-500" />
        ) : (
          <Copy size={18} />
        )}
      </button>
      <button
        onClick={() => onQr(link)}
        title="QR Code"
        className={`${btn} hover:bg-slate-100 hover:text-violet-600`}
      >
        <QrCode size={18} />
      </button>
      <Link
        to={analyticsPath(link.id)}
        onClick={onNavigate}
        title="Analytics"
        className={`${btn} hover:bg-slate-100 hover:text-slate-700`}
      >
        <BarChart2 size={18} />
      </Link>
      <a
        href={link.original}
        target="_blank"
        rel="noopener noreferrer"
        title="Open destination"
        className={`${btn} hover:bg-slate-100 hover:text-slate-700`}
      >
        <ExternalLink size={18} />
      </a>
      {onRemoveFromCampaign && (
        <button
          onClick={() => onRemoveFromCampaign(link)}
          title="Remove from this campaign"
          className={`${btn} hover:bg-amber-50 hover:text-amber-600`}
        >
          <X size={18} />
        </button>
      )}
      <button
        onClick={() => onDelete(link.id, link.slug)}
        title="Delete"
        className={`${btn} hover:bg-red-50 hover:text-red-500`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function MobileLinkList({
  links = [],
  accountLabels = {},
  copiedId = null,
  onCopy = () => {},
  onToggle = () => {},
  onDelete = () => {},
  onShare = () => {},
  onQr = () => {},
  onAddToCampaign = () => {},
  onRemoveFromCampaign,
  showAddToCampaign = true,
  onLabelsChanged = () => {},
  refresh = () => {},
  analyticsPath = (id) => `/analytics/${id}`,
  clicksKey = "clicks",
  clicksLabel = "clicks",
  renderMeta,
  emptyText = "No links yet.",
  className = "",
}) {
  const [openId, setOpenId] = useState(null);
  const openLink = links.find((l) => l.id === openId) || null;

  const dismissNew = (link) => {
    if (isLinkNew(link)) {
      markLinkAsViewed(link.id);
      refresh();
    }
  };

  const close = () => setOpenId(null);

  return (
    <div className={className}>
      {links.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">{emptyText}</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {links.map((link) => {
            const isNew = isLinkNew(link);
            return (
              <div key={link.id} className="flex items-center gap-3 p-4">
                <div
                  className="min-w-0 flex-1"
                  onClick={() => dismissNew(link)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-indigo-600 break-all">
                      {link.short}
                    </span>
                    {isNew && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          markLinkAsViewed(link.id);
                          refresh();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full cursor-pointer hover:bg-amber-600 transition-colors shadow-sm animate-pulse"
                        title="New link! Tap to dismiss"
                      >
                        NEW <X size={10} />
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[11px] text-slate-400 truncate mt-1"
                    title={link.original}
                  >
                    {link.original}
                  </div>
                </div>
                <button
                  onClick={() => {
                    dismissNew(link);
                    setOpenId(link.id);
                  }}
                  className="shrink-0 self-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail bottom sheet ── */}
      {openLink && (
        <div
          className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center sm:p-4"
          onClick={close}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-indigo-600 break-all">
                  {openLink.short}
                </div>
                <div className="text-[11px] text-slate-400 break-all mt-1">
                  {openLink.original}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">
                    {openLink.createdAt}
                  </span>
                  {openLink.password && (
                    <Lock
                      size={11}
                      className="text-amber-500"
                      title="Password protected"
                    />
                  )}
                  {openLink.expiresAt && (
                    <Clock
                      size={11}
                      className="text-orange-500"
                      title={`Expires ${openLink.expiresAt}`}
                    />
                  )}
                </div>
              </div>
              <button
                onClick={close}
                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {Number(openLink[clicksKey] || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">{clicksLabel}</div>
                </div>
                <button
                  onClick={() => onToggle(openLink.id, openLink.slug)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  {openLink.active ? (
                    <ToggleRight size={26} className="text-indigo-500" />
                  ) : (
                    <ToggleLeft size={26} className="text-slate-300" />
                  )}
                  {openLink.active ? "Active" : "Inactive"}
                </button>
              </div>

              {renderMeta && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                    UTM Details
                  </div>
                  {renderMeta(openLink)}
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Labels
                </div>
                <LabelCell
                  link={openLink}
                  accountLabels={accountLabels}
                  onLabelsChanged={onLabelsChanged}
                />
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Actions
                </div>
                <ActionRow
                  link={openLink}
                  copiedId={copiedId}
                  showAddToCampaign={showAddToCampaign}
                  onCopy={onCopy}
                  onQr={(l) => {
                    onQr(l);
                    close();
                  }}
                  onShare={(l) => {
                    onShare(l);
                    close();
                  }}
                  onAddToCampaign={(l) => {
                    onAddToCampaign(l);
                    close();
                  }}
                  onRemoveFromCampaign={
                    onRemoveFromCampaign
                      ? (l) => {
                          onRemoveFromCampaign(l);
                          close();
                        }
                      : undefined
                  }
                  onDelete={(id, slug) => {
                    onDelete(id, slug);
                    close();
                  }}
                  analyticsPath={analyticsPath}
                  onNavigate={close}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
