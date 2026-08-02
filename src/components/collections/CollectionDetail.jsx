import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { IoArrowBack, IoSearch, IoClose } from "react-icons/io5";
import { getCollectionDescription } from "../../constants/collectionDescriptions";
import { useCollectionChapters, useScopedCollectionSearch } from "./useCollections";
import { skeleton, matchScore } from "../../helpers/searchMatch";

// Debounce before the full-text request fires. Title matches are filtered from
// already-loaded data and render on every keystroke regardless, so the box
// stays responsive while this waits.
const SEARCH_DEBOUNCE_MS = 300;

function collectionTitle(book, volume, year, undated) {
  if (volume) return `${book}, Vol ${volume}`;
  if (year) return `${book} ${year}`;
  if (undated) return `${book} — Undated`;
  return book;
}

function ChapterRow({ chapter, readerQS, quote }) {
  const number =
    chapter.chapter_index != null ? chapter.chapter_index + 1 : null;
  const meta = [chapter.date, chapter.occasion, chapter.location]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      to={`/blog/${chapter.id}?${readerQS}`}
      className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-[#BC5B01]">
        {number ?? "•"}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-lg text-gray-900"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          {chapter.title}
        </span>
        {meta && (
          <span className="block truncate text-sm text-gray-500">{meta}</span>
        )}
        {/* Only body matches carry a quote. A title match shows none, so it
            doesn't read as though its excerpt failed to load. */}
        {/* No `block` here — line-clamp needs display:-webkit-box and `block`
            would override it, letting a long passage run to a dozen lines. */}
        {quote && (
          <span
            className="mt-1 line-clamp-2 text-sm italic text-gray-600"
            style={{ fontFamily: "'EB Garamond', serif" }}
          >
            &ldquo;{quote}&rdquo;
          </span>
        )}
      </span>
    </Link>
  );
}

export default function CollectionDetail({ book, volume, year, undated, onBack }) {
  const { data, isLoading, isError } = useCollectionChapters(
    book,
    volume,
    year,
    undated
  );
  const description = getCollectionDescription({ book });

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmed]);

  // Reset when switching collections, or the previous collection's query would
  // be applied to the new one.
  useEffect(() => {
    setQuery("");
    setDebounced("");
  }, [book, volume, year, undated]);

  const scoped = useScopedCollectionSearch(debounced, { book, volume, year });

  // Title matches come from data already in memory, so they appear on the very
  // first keystroke — before the full-text request has even been sent.
  const titleMatches = useMemo(() => {
    if (!searching || !data?.chapters) return [];
    const qs = skeleton(trimmed);
    return data.chapters
      .map((c) => ({ chapter: c, score: matchScore(c.title, trimmed, qs) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.chapter);
  }, [searching, data, trimmed]);

  // Body matches, deduped against the title group: a chapter that matched both
  // is shown once, in the title group, without a quote.
  const bodyMatches = useMemo(() => {
    if (!searching) return [];
    const seen = new Set(titleMatches.map((c) => c.id));
    // /search results carry no chapter_index, so recover it from the chapter
    // list we already hold — otherwise body matches render a bullet while title
    // matches render a number, in the same list.
    const byId = new Map((data?.chapters || []).map((c) => [c.id, c]));
    return (scoped.data?.results || [])
      .filter((r) => !seen.has(r._id))
      .map((r) => {
        const known = byId.get(r._id);
        return {
          chapter: {
            id: r._id,
            title: known?.title || r.title,
            chapter_index: known?.chapter_index,
            date: known?.date || r.date,
            occasion: known?.occasion,
            location: known?.location,
          },
          quote: r.best_sentence || r.matched_passage || "",
        };
      });
  }, [searching, scoped.data, titleMatches, data]);

  const resultCount = titleMatches.length + bodyMatches.length;

  // Carried into the reader so Blog.jsx can render prev/next chapter
  // navigation and survive refresh (query params, not router state).
  const readerParams = new URLSearchParams({ book });
  if (volume) readerParams.set("volume", volume);
  if (year) readerParams.set("year", year);
  if (undated) readerParams.set("undated", "1");
  const readerQS = readerParams.toString();

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#BC5B01] transition-colors hover:bg-orange-50"
      >
        <IoArrowBack size={16} />
        All Collections
      </button>

      <div className="mb-6">
        <h1
          className="text-3xl font-semibold text-gray-900"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          {collectionTitle(book, volume, year, undated)}
        </h1>
        {description && (
          <p className="mt-2 text-base leading-relaxed text-gray-700">
            {description}
          </p>
        )}
        {data && (
          <p className="mt-1 text-sm font-medium text-[#BC5B01]">
            {data.count} {data.count === 1 ? "discourse" : "discourses"}
          </p>
        )}
      </div>

      <div className="relative mb-4">
        <IoSearch
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search within ${book}…`}
          aria-label={`Search within ${book}`}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-base text-gray-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <FaSpinner className="animate-spin text-orange-400" size={28} />
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-gray-600">
          Could not load this collection. Please try again shortly.
        </p>
      )}

      {data && !searching && (
        <div className="flex flex-col gap-2 pb-10">
          {data.chapters.map((chapter) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              readerQS={readerQS}
            />
          ))}
        </div>
      )}

      {data && searching && (
        <div className="flex flex-col gap-2 pb-10">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            {resultCount} {resultCount === 1 ? "match" : "matches"} in this collection
            {scoped.isFetching && (
              <FaSpinner className="animate-spin text-orange-400" size={12} />
            )}
          </p>

          {titleMatches.map((chapter) => (
            <ChapterRow key={chapter.id} chapter={chapter} readerQS={readerQS} />
          ))}
          {bodyMatches.map(({ chapter, quote }) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              readerQS={readerQS}
              quote={quote}
            />
          ))}

          {/* The backend enforces the scope rather than widening it, so an
              empty result really does mean "not in this collection". */}
          {resultCount === 0 && !scoped.isFetching && (
            <p className="py-10 text-center text-gray-600">
              Nothing in {book} matches &ldquo;{trimmed}&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
