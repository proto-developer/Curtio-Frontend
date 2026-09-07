import { ArrowRight } from "lucide-react";

export default function Shortener({ loading = false }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
        >
            {loading
                ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                : <>Shorten <ArrowRight size={15} /></>
            }
        </button>
    );
}
