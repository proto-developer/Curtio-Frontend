import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { Copy, Check } from "lucide-react";

export default function ShareModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);

  // Append (or merge) utm_source=whatsapp onto the short link's destination tracking
  function buildWhatsappUrl(shortUrl) {
    try {
      const urlObj = new URL(shortUrl);
      urlObj.searchParams.set("utm_source", "whatsapp");
      return urlObj.toString();
    } catch (e) {
      const sep = shortUrl.includes("?") ? "&" : "?";
      return `${shortUrl}${sep}utm_source=whatsapp`;
    }
  }

  const shareUrl = buildWhatsappUrl(link.short);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleOpenWhatsapp() {
    const text = encodeURIComponent(shareUrl);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaWhatsapp size={22} className="text-green-500" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg mb-1">
          Share on WhatsApp
        </h3>
        <p className="text-slate-500 text-sm mb-5">
          This link is tagged with <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">utm_source=whatsapp</span> so its clicks show up separately in your analytics.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 text-left">
          <div className="text-xs text-slate-400 font-medium mb-1">Share link</div>
          <div className="text-sm text-slate-800 font-mono break-all">
            {shareUrl}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleOpenWhatsapp}
            className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FaWhatsapp size={15} /> Open in WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Link
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="block w-full cursor-pointer text-center text-slate-500 hover:text-slate-800 text-sm py-2 mt-1 hover:bg-gray-100 rounded-xl  transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}