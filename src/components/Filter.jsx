import React from "react";
import { ChevronLeft, ChevronRight, X, Funnel } from "lucide-react";

export default function Filter({
  startDate = "",
  endDate = "",
  setStartDate = () => { },
  setEndDate = () => { },
  calendarYear = new Date().getFullYear(),
  calendarMonth = new Date().getMonth(),
  prevMonth = () => { },
  nextMonth = () => { },
  firstDayOfWeek = 0,
  daysInMonth = 31,
  handleDateClick = () => { },
  finalGeoData = [],
  finalDeviceData = [],
  referrerData = [],
  onApply = () => { },
  onClear = () => { },
  setFilterOpen = () => { },
  selectedCountry = "",
  setSelectedCountry = () => { },
  selectedDevice = "",
  setSelectedDevice = () => { },
  selectedSource = "",
  setSelectedSource = () => { },
}) {
  const handleClose = () => setFilterOpen(false);

  const normalizeList = (value) => {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return [];
  };

  const selectedCountryList = normalizeList(selectedCountry);
  const selectedDeviceList = normalizeList(selectedDevice);
  const selectedSourceList = normalizeList(selectedSource);

  const addSelection = (value, selected, setter) => {
    if (!value) return;
    if (Array.isArray(selected)) {
      if (!selected.includes(value)) setter([...selected, value]);
    } else if (selected) {
      if (selected !== value) setter([selected, value]);
    } else {
      setter(value);
    }
  };

  const removeSelection = (value, selected, setter) => {
    if (Array.isArray(selected)) {
      setter(selected.filter((item) => item !== value));
    } else {
      setter("");
    }
  };

  return (
    <div
      className="fixed mb-0 inset-0 z-50 flex md:items-center sm:items-start justify-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
    >
      {/* Blue tinted backdrop */}
      <div
        className="absolute inset-0 bg-white/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full  md:w-full lg:max-w-5xl  md:max-h-[100vh] sm:max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-indigo-100 shrink-0">
          <div className="flex items-center md:gap-2.5 min-w-0 px-2">
            <div className="md:block hidden w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Funnel size={18} className="text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2
                id="filter-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900"
              >
                Filters
              </h2>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                Refine analytics by date, country, device, and source
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {/* Date Filter */}
            <div className="md:col-span-2 xl:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Date Range
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setStartDate(todayStr);
                    setEndDate(todayStr);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
                <span className="text-slate-400 text-sm font-medium text-center sm:px-1">
                  to
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>

              <div className="mt-4">
                <div className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="w-8 h-8 flex items-center border border-slate-200 justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-bold text-slate-800">
                      {new Date(calendarYear, calendarMonth).toLocaleString(
                        "default",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="w-8 h-8 flex items-center border border-slate-200 justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div
                        key={d}
                        className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider pb-2"
                      >
                        {d}
                      </div>
                    ))}

                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => {
                        const dStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const isStart = startDate === dStr;
                        const isEnd = endDate === dStr;
                        const isBetween =
                          startDate &&
                          endDate &&
                          dStr > startDate &&
                          dStr < endDate;

                        let wrapperClass = "relative z-0";
                        if (isStart && isEnd) {
                          // single-day
                        } else if (isStart && endDate) {
                          wrapperClass +=
                            " after:absolute after:inset-y-0 after:right-0 after:left-1/2 after:bg-indigo-100 after:-z-10 ";
                        } else if (isEnd && startDate) {
                          wrapperClass +=
                            " before:absolute before:inset-y-0 before:left-0 before:right-1/2 before:bg-indigo-100 before:-z-10 ";
                        } else if (isBetween) {
                          wrapperClass += " bg-indigo-100 ";
                        }

                        let btnClass =
                          "text-slate-700  rounded-full ";
                        if (isStart || isEnd) {
                          btnClass =
                            "bg-indigo-700 text-white rounded-full font-bold shadow-md relative z-10";
                        } else if (isBetween) {
                          btnClass =
                            "text-indigo-900 font-semibold relative z-10";
                        }

                        return (
                          <div key={day} className={`py-0.5 sm:py-1 ${wrapperClass}`}>
                            <button
                              type="button"
                              onClick={() => handleDateClick(dStr)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto flex items-center justify-center text-xs transition-colors cursor-pointer ${btnClass}`}
                            >
                              {day}
                            </button>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Country
              </label>
              <select
                value={Array.isArray(selectedCountry) ? "" : selectedCountry}
                onChange={(e) =>
                  addSelection(
                    e.target.value,
                    selectedCountry,
                    setSelectedCountry,
                  )
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
              >
                <option value="">All Countries</option>
                {finalGeoData.map((g) => (
                  <option key={g.country} value={g.country}>
                    {g.flag} {g.country}
                  </option>
                ))}
              </select>
              {selectedCountryList.length > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-wrap gap-2 p-3">
                  {selectedCountryList.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() =>
                        removeSelection(
                          country,
                          selectedCountry,
                          setSelectedCountry,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <span>{country}</span>
                      <X size={14} className="text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Device Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Device
              </label>
              <select
                value={Array.isArray(selectedDevice) ? "" : selectedDevice}
                onChange={(e) =>
                  addSelection(
                    e.target.value,
                    selectedDevice,
                    setSelectedDevice,
                  )
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
              >
                <option value="">All Devices</option>
                {finalDeviceData?.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              {selectedDeviceList.length > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-wrap gap-2 p-3">
                  {selectedDeviceList.map((device) => (
                    <button
                      key={device}
                      type="button"
                      onClick={() =>
                        removeSelection(
                          device,
                          selectedDevice,
                          setSelectedDevice,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <span>{device}</span>
                      <X size={14} className="text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Source Filter */}
            <div className="md:col-span-2 xl:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Source
              </label>
              <select
                value={Array.isArray(selectedSource) ? "" : selectedSource}
                onChange={(e) =>
                  addSelection(
                    e.target.value,
                    selectedSource,
                    setSelectedSource,
                  )
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
              >
                <option value="">All Sources</option>
                {referrerData.map((r) => (
                  <option key={r.source} value={r.source}>
                    {r.source}
                  </option>
                ))}
              </select>
              {selectedSourceList.length > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-wrap gap-2 p-3">
                  {selectedSourceList.map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() =>
                        removeSelection(
                          source,
                          selectedSource,
                          setSelectedSource,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <span>{source}</span>
                      <X size={14} className="text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-indigo-100 bg-slate-50/80">
          <button
            type="button"
            onClick={() => {
              onClear();
              setFilterOpen(false);
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => {
              onApply();
              setFilterOpen(false);
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
