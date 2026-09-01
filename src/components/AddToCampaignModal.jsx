import { useState } from "react";
import { Plus, Target, X, Check, FolderOpen, Pencil } from "lucide-react";
import env from "../../Config/env";

/**
 * AddToCampaignModal — Reusable modal to assign a link to one or more campaigns.
 *
 * Props:
 *   link              — The link object (must have .original, .short, .slug, .campaigns)
 *                        campaigns is [{name, source, medium}, ...] from the backend
 *   existingCampaigns — Array of { name, linksCount } for existing campaigns
 *   onClose           — Called when modal is dismissed
 *   onSuccess         — Called after save completes (caller should re-fetch links)
 *   token             — Bearer token for API requests
 */
export default function AddToCampaignModal({
  link,
  existingCampaigns = [],
  onClose,
  onSuccess,
  token,
}) {
  // Build initial selected map: campaignName -> { source, medium }
  const getInitialSelected = () => {
    const map = new Map();
    // From link.campaigns array (array of {name, source, medium} objects)
    if (link.campaigns && Array.isArray(link.campaigns)) {
      link.campaigns.forEach((c) => {
        if (typeof c === "string") {
          map.set(c, { source: "", medium: "" });
        } else if (c && c.name) {
          map.set(c.name, {
            source: c.source || "",
            medium: c.medium || "",
          });
        }
      });
    }
    // From utm_campaign in the original URL
    try {
      const urlObj = new URL(link.original);
      const cParam = urlObj.searchParams.get("utm_campaign");
      const sParam = urlObj.searchParams.get("utm_source");
      const mParam = urlObj.searchParams.get("utm_medium");
      if (cParam && cParam.trim() && !map.has(cParam.trim())) {
        map.set(cParam.trim(), {
          source: (sParam || "").trim(),
          medium: (mParam || "").trim(),
        });
      }
    } catch (e) {}
    return map;
  };

  // ── State ──
  // selected: Map<campaignName, { source, medium }>
  const [selected, setSelected] = useState(getInitialSelected());
  const [showNewForm, setShowNewForm] = useState(existingCampaigns.length === 0);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newUtmSource, setNewUtmSource] = useState("");
  const [newUtmMedium, setNewUtmMedium] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [localCampaigns, setLocalCampaigns] = useState(existingCampaigns);

  // Edit existing campaign state: { oldName, newName, renaming: bool }
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editNameInput, setEditNameInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleCampaign(name) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        // Source and medium default to empty string (optional)
        next.set(name, { source: "", medium: "" });
      }
      return next;
    });
  }

  function updateCampaignDetails(name, field, val) {
    setSelected((prev) => {
      const next = new Map(prev);
      const existing = next.get(name) || { source: "", medium: "" };
      next.set(name, { ...existing, [field]: val });
      return next;
    });
  }

  // ── Create a new campaign name (adds to the local list & selects it) ──
  async function handleCreateCampaign(e) {
    e.preventDefault();
    const name = newCampaignName.trim().replace(/[^a-z0-9_-]/gi, "");
    if (!name) return;

    // Check for duplicate
    if (localCampaigns.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError("A campaign with this name already exists.");
      return;
    }

    setCreatingCampaign(true);
    setError("");

    await new Promise((r) => setTimeout(r, 200));

    const source = newUtmSource.trim();
    const medium = newUtmMedium.trim();
    setLocalCampaigns((prev) => [
      ...prev,
      { name, linksCount: 0, isNew: true },
    ]);
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(name, { source, medium });
      return next;
    });
    setNewCampaignName("");
    setNewUtmSource("");
    setNewUtmMedium("");
    setCreatingCampaign(false);
    setShowNewForm(false);
  }

  // ── Rename existing campaign ──
  async function handleRenameCampaign(oldName) {
    const freshName = editNameInput.trim().replace(/[^a-z0-9_-]/gi, "");
    if (!freshName) {
      setError("Campaign name is required.");
      return;
    }
    if (freshName.toLowerCase() !== oldName.toLowerCase() && localCampaigns.some((c) => c.name.toLowerCase() === freshName.toLowerCase())) {
      setError("A campaign with this name already exists.");
      return;
    }

    setError("");
    if (freshName === oldName) {
      setEditingCampaign(null);
      return;
    }

    const apiBase = env.BACKEND_URL;
    try {
      const res = await fetch(`${apiBase}/urls/campaign/${encodeURIComponent(oldName)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newName: freshName }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalCampaigns((prev) =>
          prev.map((c) => (c.name === oldName ? { ...c, name: freshName } : c))
        );
        setSelected((prev) => {
          const next = new Map();
          prev.forEach((val, key) => {
            if (key === oldName) {
              next.set(freshName, val);
            } else {
              next.set(key, val);
            }
          });
          return next;
        });
        setEditingCampaign(null);
      } else {
        setError(data.message || "Failed to rename campaign.");
      }
    } catch {
      setError("Network error. Could not rename campaign.");
    }
  }

  // ── Save: Update campaigns for this existing link ──
  async function handleSave() {
    setSaving(true);
    setError("");

    const apiBase = env.BACKEND_URL;
    // Build {name, source, medium} array from the selected map
    const campaignsList = Array.from(selected.entries()).map(([name, details]) => ({
      name,
      source: details.source || "",
      medium: details.medium || "",
    }));

    try {
      const res = await fetch(`${apiBase}/urls/${link.slug}/campaigns`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ campaigns: campaignsList }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      } else {
        setError(data.message || "Failed to update link campaigns.");
        setSaving(false);
      }
    } catch {
      setError("Network error. Could not update link campaigns.");
      setSaving(false);
    }
  }

  const selectedSize = selected.size;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Add to Campaign
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-[260px] truncate">
                {link.short}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Success state */}
        {saved ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-green-500" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Updated campaign assignments!
            </p>
          </div>
        ) : saving ? (
          /* Saving indicator */
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-700">
              Saving campaign assignments...
            </p>
          </div>
        ) : (
          <>
            {/* Campaign list with checkboxes, rename, source & medium inputs */}
            {localCampaigns.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Existing Campaigns
                </p>
                <div className="max-h-[300px] overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2">
                  {localCampaigns.map((c) => {
                    const isChecked = selected.has(c.name);
                    const isEditingThis = editingCampaign === c.name;
                    const details = selected.get(c.name) || { source: "", medium: "" };

                    return (
                      <div key={c.name} className="border border-slate-100 rounded-lg p-2 bg-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCampaign(c.name)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />

                          {isEditingThis ? (
                            <div className="flex-1 flex items-center gap-1.5 min-w-0">
                              <input
                                type="text"
                                value={editNameInput}
                                onChange={(e) => setEditNameInput(e.target.value.replace(/[^a-z0-9_-]/gi, ""))}
                                className="flex-1 border border-indigo-300 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameCampaign(c.name)}
                                className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-1 rounded hover:bg-indigo-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCampaign(null)}
                                className="text-[10px] text-slate-500 hover:text-slate-700 px-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {c.name}
                                  </span>
                                  {c.isNew && (
                                    <span className="text-[8px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
                                      New
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block">
                                  {c.linksCount} link{c.linksCount !== 1 ? "s" : ""}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCampaign(c.name);
                                  setEditNameInput(c.name);
                                }}
                                title="Rename Campaign"
                                className="text-slate-400 cursor-pointer hover:text-indigo-600 p-1 rounded hover:bg-slate-50 transition-colors shrink-0"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Source and Medium inputs — shown when campaign is selected */}
                        {isChecked && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 pl-6 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] font-semibold text-slate-400 uppercase w-12 shrink-0">
                                Source
                              </label>
                              <input
                                type="text"
                                value={details.source}
                                onChange={(e) =>
                                  updateCampaignDetails(c.name, "source", e.target.value)
                                }
                                placeholder="e.g. facebook, newsletter (optional)"
                                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] font-semibold text-slate-400 uppercase w-12 shrink-0">
                                Medium
                              </label>
                              <input
                                type="text"
                                value={details.medium}
                                onChange={(e) =>
                                  updateCampaignDetails(c.name, "medium", e.target.value)
                                }
                                placeholder="e.g. email, cpc (optional)"
                                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No campaigns empty state */}
            {localCampaigns.length === 0 && !showNewForm && (
              <div className="text-center py-6 mb-4">
                <FolderOpen
                  size={32}
                  className="text-slate-200 mx-auto mb-2"
                />
                <p className="text-sm text-slate-500 font-medium">
                  No campaigns yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Create your first campaign below
                </p>
              </div>
            )}

            {/* Create new campaign section */}
            {showNewForm ? (
              <div className="border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50">
                <p className="text-xs font-bold text-slate-700 mb-3">
                  Create New Campaign
                </p>
                <form onSubmit={handleCreateCampaign} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={newCampaignName}
                      onChange={(e) =>
                        setNewCampaignName(
                          e.target.value.replace(/[^a-z0-9_-]/gi, "")
                        )
                      }
                      required
                      placeholder="e.g. summer_2026"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                      Source (utm_source - optional)
                    </label>
                    <input
                      type="text"
                      value={newUtmSource}
                      onChange={(e) => setNewUtmSource(e.target.value)}
                      placeholder="e.g. facebook, newsletter"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                      Medium (utm_medium - optional)
                    </label>
                    <input
                      type="text"
                      value={newUtmMedium}
                      onChange={(e) => setNewUtmMedium(e.target.value)}
                      placeholder="e.g. email, cpc"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={creatingCampaign || !newCampaignName.trim()}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {creatingCampaign ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus size={12} /> Create
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-medium px-3 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowNewForm(true);
                  setError("");
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-4 cursor-pointer"
              >
                <Plus size={14} />
                Create New Campaign
              </button>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {selectedSize === 0
                  ? "Remove from All Campaigns"
                  : `Save (${selectedSize} Campaign${selectedSize !== 1 ? "s" : ""})`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
