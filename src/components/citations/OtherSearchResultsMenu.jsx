import React, { useEffect, useRef, useState } from "react";
import { IoCalendar, IoChevronDown } from "react-icons/io5";
import { IoMdList } from "react-icons/io";
import { MdClose, MdOutlineAutoStories } from "react-icons/md";
import { Link } from "react-router-dom";

function OtherSearchResultsToggleButton({ isOpen, onClick, totalCount }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all border-[1.5px] text-left ${
        isOpen
          ? "bg-orange-50 border-orange-300"
          : "bg-white border-orange-200/80 hover:bg-orange-50"
      }`}
      aria-label={isOpen ? "Hide other search results" : "Show other search results"}
      aria-expanded={isOpen}
    >
      <svg
        className="w-[18px] h-[18px] text-orange-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
        Other Search Results
      </span>
      <IoChevronDown
        size={16}
        className={`text-orange-400 transition-transform duration-200 flex-shrink-0 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
      {!isOpen && totalCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-orange-400 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
          {totalCount}
        </span>
      )}
    </button>
  );
}

// The other discourses that matched the reader's search, as a dropdown anchored
// to the hero header. Deliberately built as a twin of HighlightsSidebar — same
// pill trigger, same cream panel — so the two reader tools read as one system.
export default function OtherSearchResultsMenu({
  citations = [],
  activeId,
  linkState,
  getSavedDiscourseByTitle,
  user,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  if (citations.length === 0) return null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <OtherSearchResultsToggleButton
        isOpen={isOpen}
        onClick={toggle}
        totalCount={citations.length}
      />

      <div
        className={`absolute right-0 top-full mt-2 w-[min(380px,calc(100vw-2rem))] z-50 origin-top transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-1 scale-[0.98] pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col bg-[#FEF4EB] border border-orange-200/60 rounded-xl shadow-lg overflow-hidden max-h-[min(70vh,520px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200/50 bg-gradient-to-r from-orange-50 to-[#FEF4EB] flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MdOutlineAutoStories size={18} className="text-orange-400" />
              Other Search Results ({citations.length})
            </h3>
            <button
              type="button"
              onClick={toggle}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Close panel"
            >
              <MdClose size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
            {citations.map((c, i) => {
              const lookupTitle = `${c.title} of "${c.collection}"`;
              const savedDiscourse = getSavedDiscourseByTitle?.(lookupTitle);
              const recentHighlights = user && savedDiscourse?.discourse?.highlights
                ? [...savedDiscourse.discourse.highlights]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 3)
                : [];
              const isActive = activeId === c._id;

              return (
                <Link
                  key={i}
                  to={`/blog/${c._id}`}
                  state={{
                    citations,
                    questionContext: linkState?.questionContext,
                    // Rebuilt state drops anything it doesn't name, so the
                    // keyword term has to be carried explicitly or jumping
                    // between citations loses the highlighting.
                    keywordTerm: linkState?.keywordTerm,
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                      isActive
                        ? "border-orange-400 bg-orange-50"
                        : "border-orange-200/60 bg-white hover:bg-orange-50/50"
                    }`}
                  >
                    <p className={`font-medium text-sm ${isActive ? "text-orange-600" : "text-gray-800"}`}>
                      {c.title}
                    </p>

                    <div className="flex flex-col gap-1">
                      {c.collection && (
                        <div className="flex gap-2 items-center text-xs text-gray-500">
                          <IoMdList size={14} className="text-orange-400 shrink-0" />
                          <span>{c.collection.replace(/(\d)(Disc\.)/g, "$1 $2")}</span>
                        </div>
                      )}
                      {c.date && (
                        <div className="flex gap-2 items-center text-xs text-gray-500">
                          <IoCalendar size={14} className="text-orange-400 shrink-0" />
                          <span>{c.date}</span>
                        </div>
                      )}
                    </div>

                    {/* Highlights & comments */}
                    {recentHighlights.length > 0 && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-orange-200/50">
                        <p className="text-xs font-semibold text-gray-500">
                          Your highlights{" "}
                          {savedDiscourse.discourse.highlights.length > 3
                            ? `(showing 3 of ${savedDiscourse.discourse.highlights.length})`
                            : ""}
                        </p>
                        {recentHighlights.map((h) => (
                          <div key={h.id} className="flex flex-col gap-1">
                            <div className="bg-yellow-100 rounded px-2 py-1">
                              <p className="text-xs text-gray-700 line-clamp-2">
                                "{h.text.substring(0, 80)}{h.text.length > 80 ? "…" : ""}"
                              </p>
                            </div>
                            {h.comment && (
                              <p className="text-xs text-blue-600 italic pl-2 border-l-2 border-blue-300">
                                {h.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
