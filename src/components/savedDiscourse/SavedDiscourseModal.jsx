import React from "react";
import { Link } from "react-router-dom";
import { MdClose, MdOutlineAutoStories } from "react-icons/md";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { GoArrowUpRight } from "react-icons/go";
import { BsBookmarkFill } from "react-icons/bs";
import { HighlightsTabbedPanel } from "../highlights/HighlightsSidebar";

const VALID_QUESTION_CONTEXTS = new Set([
  "",
  "No question provided",
  "From blog page",
  "Browsing discourses",
]);

function hasValidQuestionContext(context) {
  return context && context.trim() !== "" && !VALID_QUESTION_CONTEXTS.has(context);
}

export default function SavedDiscourseModal({
  discourse,
  variant = "saved",
  onClose,
  onRemove,
}) {
  if (!discourse) return null;

  const highlights = discourse.discourse?.highlights || [];
  const highlightCount = highlights.filter((h) => !h.comment).length;
  const commentCount = highlights.filter((h) => h.comment).length;
  const isAnnotations = variant === "annotations";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 font-ui">
      <div className="bg-white rounded-2xl max-w-xl w-full min-h-[520px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-orange-100 animate-fadeIn">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-[#FEF4EB] flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-white rounded-lg border border-orange-200/60 shadow-sm flex-shrink-0">
              {isAnnotations ? (
                <MdOutlineAutoStories size={18} className="text-orange-400" />
              ) : (
                <BsBookmarkFill size={18} className="text-orange-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 mb-0.5">
                {isAnnotations ? "Highlights & Comments" : "Saved Discourse"}
              </p>
              <h2 className="text-base font-semibold text-gray-800 leading-snug break-words">
                {discourse.discourse.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {!isAnnotations && hasValidQuestionContext(discourse.question_context) && (
            <div className="mx-5 mt-4 mb-1 rounded-lg bg-[#FEF4EB] border border-orange-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                <IoChatbubbleEllipsesOutline size={12} className="text-orange-400" />
                Discovered while asking
              </p>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                "{discourse.question_context}"
              </p>
            </div>
          )}

          {highlights.length > 0 ? (
            <div className="mx-5 my-4 rounded-xl border border-orange-200/60 bg-[#FEF4EB] overflow-hidden flex flex-col max-h-[460px] min-h-[280px]">
              <HighlightsTabbedPanel
                highlights={highlights}
                readOnly
                showHeader={isAnnotations}
                listClassName="overflow-y-auto p-3 space-y-2.5 flex-1 min-h-0 max-h-[380px]"
              />
            </div>
          ) : (
            !isAnnotations && (
              <div className="mx-5 my-4 rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-8 text-center">
                <MdOutlineAutoStories size={28} className="text-orange-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  No highlights or comments on this saved discourse yet.
                </p>
              </div>
            )
          )}

          {discourse.discourse.source_url && (
            <div className="px-5 pb-4">
              <Link
                to={discourse.discourse.source_url}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-orange-400 text-white text-sm font-medium rounded-lg hover:bg-orange-500 transition-colors shadow-sm"
                onClick={onClose}
              >
                View Full Discourse
                <GoArrowUpRight size={16} />
              </Link>
            </div>
          )}

          <div className="px-5 pb-4 flex items-center gap-3 text-[11px] text-gray-400">
            <span>
              {isAnnotations ? "Annotated" : "Saved"}{" "}
              {new Date(discourse.saved_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {highlights.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>
                  {highlightCount} highlight{highlightCount !== 1 ? "s" : ""}
                  {commentCount > 0 && ` · ${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
                </span>
              </>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-3 px-5 py-4 border-t border-orange-100 bg-gray-50/80 flex-shrink-0 ${isAnnotations ? "justify-end" : "justify-between"}`}>
          {!isAnnotations && (
            <button
              type="button"
              onClick={() => onRemove(discourse.id)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
            >
              Remove from Saved
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
