import { Check, X } from "lucide-react";

const comparisonData = [
  {
    feature: "Click counts",
    other: "Padded by bots and previews",
    curtio: "Counted once, real visitors only",
  },
  {
    feature: "Analytics on the free tier",
    other: "Limited or behind a paywall",
    curtio: "Full analytics on your free link",
  },
  {
    feature: "Credit card to start",
    other: "Often required",
    curtio: "Never",
  },
  {
    feature: "The redirect",
    other: "Sometimes shows an ad first",
    curtio: "Straight to the destination, fast",
  },
  {
    feature: "The feel",
    other: "Built like it is still 2015",
    curtio: "Clean, modern, made for you",
  },
];

const ComparisonSection = () => {
  return (
    <section className="py-14 sm:py-20 bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        {/* Heading */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-[-0.03em] text-slate-900 leading-tight">
            A Bitly and Cuttly alternative built on honest numbers
          </h2>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-slate-500 leading-relaxed sm:leading-8">
            People come to curtio after they stop trusting their old
            shortener. Here is what changes when you switch.
          </p>
        </div>

        {/* ── Mobile / small screens: stacked cards, no horizontal scroll ── */}
        <div className="md:hidden space-y-4">
          {comparisonData.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-sm">
                {item.feature}
              </div>

              <div className="flex items-start gap-3 px-5 py-3.5 border-b border-slate-100">
                <X
                  size={16}
                  strokeWidth={2.2}
                  className="text-slate-400 shrink-0 mt-0.5"
                />
                <div>
                  <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                    The usual shorteners
                  </div>
                  <div className="text-sm text-slate-500">{item.other}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 px-5 py-3.5 bg-indigo-50">
                <Check
                  size={16}
                  strokeWidth={2.5}
                  className="text-indigo-600 shrink-0 mt-0.5"
                />
                <div>
                  <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-indigo-500 mb-0.5">
                    curtio.
                  </div>
                  <div className="text-sm font-medium text-slate-900">{item.curtio}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tablet and up: full comparison table ── */}
        <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-3xl bg-white shadow-lg">
          <div className="min-w-[620px] divide-y divide-slate-200">
            {/* Header */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr]">
              <div className="p-6"></div>

              <div className="border-l border-slate-200 p-6 text-center font-semibold text-slate-500">
                The usual shorteners
              </div>

              <div className="border-l border-indigo-200 bg-indigo-50 p-6 font-bold text-indigo-700">
                curtio.
              </div>
            </div>

            {comparisonData.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.2fr_1fr_1fr]"
              >
                <div className="p-6 font-semibold text-slate-900 flex items-center">
                  {item.feature}
                </div>

                <div className="flex items-center gap-3 border-l border-slate-200 p-6 text-slate-500">
                  <X
                    size={18}
                    strokeWidth={2.2}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <span>{item.other}</span>
                </div>

                <div className="flex items-center gap-3 border-l border-indigo-200 bg-indigo-50 p-6 text-slate-900">
                  <Check
                    size={18}
                    strokeWidth={2.5}
                    className="text-indigo-600 flex-shrink-0"
                  />
                  <span>{item.curtio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
