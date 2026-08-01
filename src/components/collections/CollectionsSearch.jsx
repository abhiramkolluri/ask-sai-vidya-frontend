import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { IoSearch, IoClose } from "react-icons/io5";
import { useDiscourseSearchIndex } from "./useCollections";

const MAX_DISCOURSE_RESULTS = 30;

const norm = (s) => (s || "").toLowerCase();
// Consonant skeleton so transliteration variants match the corpus spelling:
// "gita" -> "gt" is contained in "geeta" -> "gt".
const skeleton = (s) => norm(s).replace(/[aeiou]|[^a-z]/g, "");

// Rank: prefix match beats substring beats skeleton; 0 = no match.
function matchScore(text, query, querySkeleton) {
  const t = norm(text);
  const q = norm(query);
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  if (querySkeleton.length > 2 && skeleton(text).includes(querySkeleton)) return 1;
  return 0;
}

function discourseLabel(row) {
  if (row.volume) return `${row.book}, Vol ${row.volume}`;
  if (row.year && row.book !== row.collection) return `${row.book} ${row.year}`;
  return row.collection || row.book;
}

export default function CollectionsSearch({
  sections,
  onOpenCollection,
  onSearchingChange,
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  // Let the parent hide the section grid while results are showing.
  useEffect(() => {
    if (onSearchingChange) onSearchingChange(searching);
  }, [searching, onSearchingChange]);

  const { data: indexData, isLoading } = useDiscourseSearchIndex(searching);

  const allCollections = useMemo(
    () => Object.values(sections || {}).flat(),
    [sections]
  );

  const results = useMemo(() => {
    if (!searching) return { collections: [], discourses: [] };
    const qSkel = skeleton(trimmed);

    const collections = allCollections
      .map((entry) => ({ entry, score: matchScore(entry.title, trimmed, qSkel) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.entry);

    const discourses = (indexData?.chapters || [])
      .map((row) => ({
        row,
        score: Math.max(
          matchScore(row.title, trimmed, qSkel),
          // Also match on the collection label so "summer 1976" style
          // queries surface discourses, not just the collection card.
          matchScore(discourseLabel(row), trimmed, qSkel) - 0.5
        ),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_DISCOURSE_RESULTS)
      .map((r) => r.row);

    return { collections, discourses };
  }, [searching, trimmed, allCollections, indexData]);

  const readerLink = (row) => {
    const params = new URLSearchParams({ book: row.book });
    if (row.volume) params.set("volume", row.volume);
    if (row.year) params.set("year", row.year);
    return `/blog/${row.id}?${params.toString()}`;
  };

  return (
    <div className="mx-auto mb-8 w-full max-w-2xl">
      <div className="relative">
        <IoSearch
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections and discourses by title…"
          className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-10 text-base text-gray-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
        {searching && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-[#BC5B01]"
            title="Clear search"
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      {searching && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          {results.collections.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Collections
              </p>
              <div className="flex flex-col gap-1">
                {results.collections.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => onOpenCollection(entry)}
                    className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-orange-50"
                  >
                    <span
                      className="truncate text-base text-gray-900"
                      style={{ fontFamily: "'EB Garamond', serif" }}
                    >
                      {entry.title}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-[#BC5B01]">
                      {entry.count} discourses
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Discourses
          </p>
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
              <FaSpinner className="animate-spin text-orange-400" size={14} />
              Loading discourse titles…
            </div>
          )}
          {!isLoading && results.discourses.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">
              {results.collections.length === 0
                ? "No matches by title — for topic search, ask in the Questions tab."
                : "No individual discourses match."}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {results.discourses.map((row) => (
              <Link
                key={row.id}
                to={readerLink(row)}
                className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-orange-50"
              >
                <span
                  className="truncate text-base text-gray-900"
                  style={{ fontFamily: "'EB Garamond', serif" }}
                >
                  {row.title}
                </span>
                <span className="shrink-0 text-xs text-gray-500">
                  {discourseLabel(row)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
