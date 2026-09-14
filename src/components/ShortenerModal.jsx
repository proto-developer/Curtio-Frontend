import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ShortenerModal({ open, onClose, onReactivate }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
          <Zap size={32} className="text-indigo-600 animate-bounce" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
          One Free Link Limit Reached
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Guests can only generate one short link. Create a free account in 30 seconds to get unlimited links, real‑time analytics and keep your links active.
        </p>

        {/* CTA Buttons */}
        <div className="w-full flex flex-col gap-3">
          <Link
            to="/register"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center transition-shadow shadow-sm shadow-indigo-100"
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            className="w-full py-3 bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 font-medium rounded-xl text-center transition"
          >
            Sign In
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-400 mt-4">
          Your pending link will be saved automatically after signup!
        </p>
      </div>
    </div>
  );
}
