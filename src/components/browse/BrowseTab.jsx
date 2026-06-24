import React from "react";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { GoArrowUpRight } from "react-icons/go";
import { BsBookmarkFill, BsTrash } from "react-icons/bs";
import DecorativeBackground from "../common/DecorativeBackground";
import { formatCollection } from "../../helpers/formatCollection";
import { useSavedDiscourses } from "../../contexts/SavedDiscoursesContext";

// Question-context strings that are placeholders rather than real questions.
const HIDDEN_CONTEXTS = new Set([
  "",
  "No question provided",
  "From blog page",
  "Browsing discourses",
]);

function isRealContext(ctx) {
  return ctx && !HIDDEN_CONTEXTS.has(ctx.trim());
}

// ─── Highlights & annotations (expanded by default) ─────────────────────────────

function Highlights({ highlights }) {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800">
        <span className="text-yellow-600">✨</span>
        Your Highlights &amp; Comments ({highlights.length})
      </h3>
      <div className="space-y-3">
        {highlights.map((highlight, idx) => (
          <div
            key={highlight.id || idx}
            className="rounded border border-yellow-300 bg-white p-3"
          >
            <div className="mb-2 inline-block rounded bg-yellow-200 px-2 py-1">
              <p className="text-base text-gray-800">"{highlight.text}"</p>
            </div>
            {highlight.comment && (
              <div className="mt-2 border-l-2 border-blue-400 pl-3">
                <p className="text-sm font-medium text-gray-800">Your comment:</p>
                <p className="mt-1 text-base italic text-blue-700">
                  💬 {highlight.comment}
                </p>
              </div>
            )}
            {highlight.timestamp && (
              <p className="mt-2 text-sm text-gray-800">
                {new Date(highlight.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Saved discourse card ───────────────────────────────────────────────────────

function SavedDiscourseCard({ saved, onRemove }) {
  const { discourse, question_context, saved_at } = saved;

  // Saved titles are stored as `Title of "Collection"`; split so we can show the
  // discourse title above and its source below, like the Questions tab.
  const titleMatch = (discourse.title || "").match(/^(.*?) of "(.*)"$/);
  const discTitle = titleMatch ? titleMatch[1] : discourse.title;
  const discSource = titleMatch ? titleMatch[2] : "";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900">{discTitle}</h2>
          {discSource && (
            <p className="text-lg text-gray-600">{formatCollection(discSource)}</p>
          )}
          {saved_at && (
            <p className="mt-1 text-sm text-gray-500">
              Saved {new Date(saved_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(saved.id)}
          title="Remove from saved"
          className="shrink-0 rounded p-2 text-red-600 transition-colors hover:bg-red-100"
        >
          <BsTrash size={18} />
        </button>
      </div>

      {isRealContext(question_context) && (
        <div className="mt-3 rounded bg-orange-50 p-3">
          <p className="text-base text-gray-800">
            <strong>You discovered this while asking:</strong>
          </p>
          <p className="mt-1 text-base italic text-gray-800">
            "{question_context}"
          </p>
        </div>
      )}

      <Highlights highlights={discourse.highlights} />

      {discourse.source_url && (
        <div className="mt-4">
          <Link
            to={discourse.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded bg-[#BC5B01] px-4 py-2 text-white transition-colors hover:bg-orange-600"
          >
            View Full Discourse
            <GoArrowUpRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main BrowseTab ─────────────────────────────────────────────────────────────

export default function BrowseTab() {
  const { savedDiscourses, loadingSaved, unsaveDiscourse } =
    useSavedDiscourses();

  return (
    <div className="relative isolate h-full overflow-hidden">
      <DecorativeBackground />
      <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mb-6 text-center">
        <h1
          className="text-3xl font-semibold text-gray-800"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          Browse Saved Discourses
        </h1>
        <p className="mt-1 text-base text-gray-800">
          Your saved discourses, with your highlights and comments.
        </p>
      </div>

      {loadingSaved && (
        <div className="flex justify-center py-16">
          <FaSpinner className="animate-spin text-orange-400" size={28} />
        </div>
      )}

      {!loadingSaved && savedDiscourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-800">
          <BsBookmarkFill size={40} className="mb-3 text-primary/40" />
          <p className="text-lg">No saved discourses yet</p>
          <p className="mt-1 text-base text-gray-800">
            Click the bookmark icon on any discourse to save it.
          </p>
        </div>
      )}

      {!loadingSaved && savedDiscourses.length > 0 && (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {savedDiscourses.map((saved) => (
            <SavedDiscourseCard
              key={saved.id}
              saved={saved}
              onRemove={unsaveDiscourse}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
