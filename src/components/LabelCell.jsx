import { useState } from "react";
import { X, Search, Plus, ArrowLeft, Trash2, Check, Zap, MousePointerClick, Palette } from "lucide-react";
import { updateUrlLabels } from "@/api/urls";
import { updateAccountLabels } from "@/api/auth";

export default function LabelCell({ link, accountLabels = {}, onLabelsChanged, readOnly = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  // Draft State for batch editing
  const [draftAccountLabels, setDraftAccountLabels] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Generate random hex color
  const generateRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

  const [newLabelColor, setNewLabelColor] = useState(generateRandomColor());
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem("apiToken");

  // Selected labels on this specific link
  const selectedLabelKeys = link?.labels || [];

  // Toggle label on/off for this link
  const handleToggleLabel = async (labelKey) => {
    if (updating || readOnly) return;
    setUpdating(true);

    let newKeys;
    if (selectedLabelKeys.includes(labelKey)) {
      newKeys = selectedLabelKeys.filter(k => k !== labelKey);
    } else {
      newKeys = [...selectedLabelKeys, labelKey];
    }

    try {
      const data = await updateUrlLabels(link.slug, newKeys, { token });
      if (data.success) {
        if (onLabelsChanged) onLabelsChanged();
      }
    } catch (err) {
      console.error("Error toggling label:", err);
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = () => {
    setDraftAccountLabels(accountLabels);
    setHasUnsavedChanges(false);
    setIsEditing(true);
  };

  // Add a new label to DRAFT state
  const handleDraftCreateLabel = (e) => {
    e.preventDefault();
    const trimmedName = newLabelName.trim();
    if (!trimmedName || readOnly) return;

    // Use the label's name as its exact unique ID
    const nextKey = trimmedName;

    setDraftAccountLabels({
      ...draftAccountLabels,
      [nextKey]: {
        name: newLabelName.trim(),
        color: newLabelColor
      }
    });
    setHasUnsavedChanges(true);
    setNewLabelName("");
    setNewLabelColor(generateRandomColor());
  };

  // Delete label from DRAFT state
  const handleDraftDeleteLabel = (labelKey) => {
    if (readOnly) return;
    const updatedLabels = { ...draftAccountLabels };
    delete updatedLabels[labelKey];
    setDraftAccountLabels(updatedLabels);
    setHasUnsavedChanges(true);
  };

  // Save changes to API
  const handleSaveChanges = async () => {
    if (updating || readOnly || !hasUnsavedChanges) return;
    setUpdating(true);

    try {
      const data = await updateAccountLabels(draftAccountLabels, { token });
      if (data.success) {
        setHasUnsavedChanges(false);
        if (onLabelsChanged) onLabelsChanged();
        setIsEditing(false); // return to view mode on save
        setSearchTerm("");
      }
    } catch (err) {
      console.error("Error saving labels:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Filter labels based on search term
  const filteredLabels = Object.entries(accountLabels).filter(([_, value]) => {
    return value.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Color options for creation
  const colorOptions = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#6366f1", "#a855f7",
    "#ec4899", "#64748b", "#334155"
  ];

  return (
    <div className={`relative inline-block text-left ${readOnly ? "" : "w-full"}`}>
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>

      {/* Table Cell Render */}
      <div
        onClick={() => !readOnly && setIsOpen(true)}
        className={`flex items-center justify-center gap-1 flex-wrap min-h-[32px] px-2 py-1 rounded transition-all ${readOnly ? "" : "cursor-pointer hover:bg-slate-100/80 border border-dashed border-slate-200 hover:border-indigo-400"}`}
        style={{ minWidth: readOnly ? "auto" : "120px" }}
      >
        {(() => {
          // Resolve only keys that exist in accountLabels (filter out orphaned/stale keys)
          const validLabels = selectedLabelKeys
            .map(key => ({ key, lbl: accountLabels[key] }))
            .filter(({ lbl }) => !!lbl);

          if (validLabels.length === 0) {
            // No valid labels — show "+ Add Label" prompt
            return !readOnly && (
              <span className="text-slate-400 text-[10px] font-medium cursor-pointer">+ Add Label</span>
            );
          }

          return validLabels.map(({ key, lbl }) => (
            <span
              key={key}
              className="text-[9px] font-bold px-2 py-0.5 rounded text-white shadow-sm flex items-center gap-1 cursor-pointer"
              style={{ backgroundColor: lbl.color }}
            >
              {lbl.name}
            </span>
          ));
        })()}
      </div>

      {/* Popover / Modal Dropdown */}
      {isOpen && !readOnly && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            setIsEditing(false);
            setSearchTerm("");
          }}
        >
          {/* Light Theme Modal Panel */}
          <div
            className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "85vh" }}
          >
            {/* Modal Header: Link Context */}
            <div className="bg-slate-50 border-b border-slate-100 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={14} className="text-indigo-600" fill="currentColor" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                      {link.short}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">
                      {link.original}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <MousePointerClick size={10} className="text-indigo-400" />
                      <span>{(link.clicks || 0).toLocaleString()} clicks</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 overflow-y-auto custom-scroll">
              {!isEditing ? (
                /* View 1: Select & Search Labels */
                <div className="space-y-1">
                  {/* Selected Labels */}
                  {selectedLabelKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100 mb-3">
                      {selectedLabelKeys.map(key => {
                        const lbl = accountLabels[key];
                        if (!lbl) return null;
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-lg text-white shadow-sm cursor-pointer"
                            style={{ backgroundColor: lbl.color }}
                          >
                            {lbl.name}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLabel(key);
                              }}
                              className="hover:bg-black/20 rounded-full p-0.5 transition-colors cursor-pointer"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search Box */}
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search labels..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none"
                    />
                  </div>

                  {/* Labels List (Solid Colors) */}
                  <div
                    className="space-y-1 max-h-[140px] overflow-y-auto pr-1 custom-scroll"
                  >
                    {filteredLabels.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        No labels found.
                      </div>
                    ) : (
                      filteredLabels.map(([key, lbl]) => {
                        const isSelected = selectedLabelKeys.includes(key);
                        return (
                          <div
                            key={key}
                            onClick={() => handleToggleLabel(key)}
                            className="relative flex items-center justify-center w-full py-2 rounded-sm cursor-pointer shadow-sm hover:brightness-105 transition-all"
                            style={{ backgroundColor: lbl.color }}
                          >
                            <span className="text-white font-semibold text-xs sm:text-sm drop-shadow-md">{lbl.name}</span>
                            {isSelected && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/20 p-0.5 rounded-full">
                                <Check size={12} className="text-white font-bold" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Edit Labels Button */}
                  <button
                    onClick={startEditing}
                    className="w-full mt-3 text-center text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Manage Account Labels
                  </button>
                </div>
              ) : (
                /* View 2: Edit Custom Labels (Account Level) */
                <div className="space-y-2">
                  {/* Header Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">Manage Labels</h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setSearchTerm("");
                        }}
                        className="flex items-center text-[10px] sm:text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        disabled={!hasUnsavedChanges || updating}
                        className="flex items-center text-[10px] sm:text-xs bg-indigo-600 disabled:opacity-50 text-white hover:bg-indigo-700 px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        {updating ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Labels List with Delete (Cards with Dots) */}
                  <div
                    className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 mb-4 custom-scroll"
                  >
                    {Object.entries(draftAccountLabels).map(([key, lbl]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between shadow-sm px-3 py-2 rounded-sm text-xs sm:text-sm"
                        style={{ backgroundColor: lbl.color }}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <span className="font-semibold text-white drop-shadow-md truncate">{lbl.name}</span>
                        </div>
                        <button
                          onClick={() => handleDraftDeleteLabel(key)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-black/10 text-white/80 hover:text-white hover:bg-black/30 transition-colors shrink-0 cursor-pointer ml-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {Object.keys(draftAccountLabels).length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400">
                        No custom labels yet.
                      </div>
                    )}
                  </div>

                  {/* Create Label Form */}
                  <form onSubmit={handleDraftCreateLabel} className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Create New Label
                    </div>
                    <input
                      type="text"
                      required
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name (e.g. Marketing)"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                    />

                    {/* Colors Selector */}
                    <div className="flex flex-wrap items-center gap-1.5 py-1">
                      {colorOptions.map(c => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setNewLabelColor(c)}
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-sm transition-all shrink-0 border-2 cursor-pointer ${newLabelColor === c ? "border-indigo-600 scale-110" : "border-transparent hover:scale-110"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      {/* Custom Palette Color Picker */}
                      <div className="relative w-5 h-5 sm:w-6 sm:h-6 ml-1 bg-white rounded-md shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group" title="Pick any color">
                        <Palette size={12} className="text-slate-500 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          className="absolute inset-0 w-[200%] h-[200%] -left-1/2 -top-1/2 opacity-0 cursor-pointer z-20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!newLabelName.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 mt-1 cursor-pointer shadow-sm"
                    >
                      <Plus size={12} /> Add Label
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
