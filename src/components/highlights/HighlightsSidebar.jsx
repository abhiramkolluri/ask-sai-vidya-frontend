import React, { useEffect, useRef, useState } from "react";
import { MdClose, MdOutlineAutoStories, MdOutlineHighlight } from "react-icons/md";
import { IoChatbubbleEllipsesOutline, IoChevronDown } from "react-icons/io5";

const PREVIEW_LENGTH = 100;

function HighlightCard({
  highlight,
  activeHighlightId,
  onHighlightClick,
  onRemoveHighlight,
  variant = "highlight",
  readOnly = false,
}) {
  const isActive = activeHighlightId === highlight.id;
  const preview =
    highlight.text.length > PREVIEW_LENGTH
      ? `${highlight.text.substring(0, PREVIEW_LENGTH)}...`
      : highlight.text;
  const isClickable = !readOnly && onHighlightClick;

  return (
    <div
      className={`font-ui bg-white p-3.5 rounded-lg border transition-all duration-200 ${
        isClickable ? "cursor-pointer" : ""
      } ${
        isActive
          ? "border-orange-400 shadow-md ring-2 ring-orange-100"
          : "border-orange-100" + (isClickable ? " hover:border-orange-200 hover:shadow-sm" : "")
      }`}
      onClick={isClickable ? () => onHighlightClick(highlight) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {variant === "comment" ? (
            <>
              <p className="text-[13px] text-gray-600 leading-relaxed break-words flex items-start gap-1.5 mb-2">
                <IoChatbubbleEllipsesOutline
                  size={15}
                  className="text-orange-400 flex-shrink-0 mt-0.5"
                />
                <span>{highlight.comment}</span>
              </p>
              <blockquote className="border-l-2 border-orange-200 bg-orange-50/50 pl-2.5 py-1.5 rounded-r-md">
                <p className="text-[11px] leading-relaxed text-gray-500 break-words italic">
                  "{preview}"
                </p>
              </blockquote>
            </>
          ) : (
            <blockquote className="border-l-[3px] border-orange-400 bg-orange-50/70 pl-3 py-2 rounded-r-md">
              <p className="text-[13px] leading-relaxed text-gray-700 break-words">
                {preview}
              </p>
            </blockquote>
          )}

          {highlight.timestamp && (
            <p className="text-[11px] text-gray-400 mt-2.5 tabular-nums">
              {new Date(highlight.timestamp).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {onRemoveHighlight && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveHighlight(highlight.id);
            }}
            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5 rounded"
            title="Remove"
            type="button"
          >
            <MdClose size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function TabBar({ activeTab, onTabChange, highlightCount, commentCount }) {
  return (
    <div className="flex border-b border-orange-200/50 bg-white/40">
      <button
        type="button"
        onClick={() => onTabChange("highlights")}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
          activeTab === "highlights"
            ? "border-orange-400 text-orange-600 bg-orange-50/60"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-orange-50/30"
        }`}
      >
        <MdOutlineHighlight size={14} />
        Highlights
        {highlightCount > 0 && (
          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
            {highlightCount}
          </span>
        )}
      </button>
      <div className="w-px bg-orange-200/60 self-stretch my-2" aria-hidden="true" />
      <button
        type="button"
        onClick={() => onTabChange("comments")}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
          activeTab === "comments"
            ? "border-orange-400 text-orange-600 bg-orange-50/60"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-orange-50/30"
        }`}
      >
        <IoChatbubbleEllipsesOutline size={14} />
        Comments
        {commentCount > 0 && (
          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
            {commentCount}
          </span>
        )}
      </button>
    </div>
  );
}

export function HighlightsTabbedPanel({
  highlights = [],
  onHighlightClick,
  onRemoveHighlight,
  activeHighlightId = null,
  readOnly = false,
  showHeader = true,
  listClassName = "overflow-y-auto p-3 space-y-2.5 flex-1 min-h-0",
  defaultTab = "highlights",
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const highlightOnlyItems = highlights.filter((h) => !h.comment);
  const commentItems = highlights.filter((h) => h.comment);
  const visibleItems = activeTab === "comments" ? commentItems : highlightOnlyItems;

  const emptyMessage =
    activeTab === "comments"
      ? "No comments on this discourse yet."
      : "No highlights on this discourse yet.";

  return (
    <>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200/50 bg-gradient-to-r from-orange-50 to-[#FEF4EB] flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <MdOutlineAutoStories size={18} className="text-orange-400" />
            Highlights & Comments
          </h3>
        </div>
      )}

      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        highlightCount={highlightOnlyItems.length}
        commentCount={commentItems.length}
      />

      <div className={listClassName}>
        {visibleItems.length > 0 ? (
          visibleItems.map((highlight) => (
            <HighlightCard
              key={highlight.id || highlight.timestamp}
              highlight={highlight}
              activeHighlightId={activeHighlightId}
              onHighlightClick={onHighlightClick}
              onRemoveHighlight={onRemoveHighlight}
              variant={activeTab === "comments" ? "comment" : "highlight"}
              readOnly={readOnly}
            />
          ))
        ) : (
          <p className="text-[13px] text-gray-500 text-center py-6 px-3 leading-relaxed">
            {highlights.length === 0
              ? "Select text in the discourse to add a highlight or comment."
              : emptyMessage}
          </p>
        )}
      </div>
    </>
  );
}

function HighlightsToggleButton({ isOpen, onClick, totalCount }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-ui relative flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm transition-all border text-left ${
        isOpen
          ? "bg-orange-50 border-orange-300"
          : "bg-white border-orange-200/80 hover:bg-orange-50"
      }`}
      aria-label={isOpen ? "Hide highlights and comments" : "Show highlights and comments"}
      aria-expanded={isOpen}
    >
      <svg
        className="w-4 h-4 text-orange-500 flex-shrink-0"
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
      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
        Highlights & Comments
      </span>
      <IoChevronDown
        size={14}
        className={`text-orange-400 transition-transform duration-200 flex-shrink-0 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
      {!isOpen && totalCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-orange-400 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
          {totalCount}
        </span>
      )}
    </button>
  );
}

export default function HighlightsSidebar({
  highlights = [],
  onHighlightClick,
  onRemoveHighlight,
  activeHighlightId = null,
  defaultOpen = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prevCountRef = useRef(highlights.length);
  const prevCommentCountRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const commentCount = highlights.filter((h) => h.comment).length;
    const added = highlights.length > prevCountRef.current;

    if (added) {
      setIsOpen(true);
    } else if (commentCount > prevCommentCountRef.current) {
      setIsOpen(true);
    }

    prevCountRef.current = highlights.length;
    prevCommentCountRef.current = commentCount;
  }, [highlights]);

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <HighlightsToggleButton
        isOpen={isOpen}
        onClick={toggle}
        totalCount={highlights.length}
      />

      <div
        className={`absolute left-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] z-50 origin-top transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-1 scale-[0.98] pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="font-ui flex flex-col bg-[#FEF4EB] border border-orange-200/60 rounded-xl shadow-lg overflow-hidden max-h-[min(70vh,520px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200/50 bg-gradient-to-r from-orange-50 to-[#FEF4EB] flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MdOutlineAutoStories size={18} className="text-orange-400" />
              Highlights & Comments
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

          <HighlightsTabbedPanel
            highlights={highlights}
            onHighlightClick={onHighlightClick}
            onRemoveHighlight={onRemoveHighlight}
            activeHighlightId={activeHighlightId}
            showHeader={false}
          />
        </div>
      </div>
    </div>
  );
}

export function HighlightsList({
  highlights = [],
  onHighlightClick,
  onRemoveHighlight,
  activeHighlightId = null,
  maxHeight = "max-h-64",
  title = "Your Highlights & Comments",
}) {
  if (highlights.length === 0) return null;

  return (
    <div
      className={`font-ui bg-[#FEF4EB] p-4 rounded-xl border border-orange-200/60 ${maxHeight} flex flex-col`}
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2 flex-shrink-0">
        <MdOutlineAutoStories size={16} className="text-orange-400" />
        {title}
        <span className="text-xs font-medium text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full">
          {highlights.length}
        </span>
      </h3>
      <div className="space-y-2.5 overflow-y-auto flex-1 min-h-0">
        {highlights.map((highlight) => (
          <HighlightCard
            key={highlight.id}
            highlight={highlight}
            activeHighlightId={activeHighlightId}
            onHighlightClick={onHighlightClick}
            onRemoveHighlight={onRemoveHighlight}
            variant={highlight.comment ? "comment" : "highlight"}
          />
        ))}
      </div>
    </div>
  );
}
