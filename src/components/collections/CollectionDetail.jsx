import React from "react";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { getCollectionDescription } from "../../constants/collectionDescriptions";
import { useCollectionChapters } from "./useCollections";

function collectionTitle(book, volume, year, undated) {
  if (volume) return `${book}, Vol ${volume}`;
  if (year) return `${book} ${year}`;
  if (undated) return `${book} — Undated`;
  return book;
}

function ChapterRow({ chapter, readerQS }) {
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

      {data && (
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
    </div>
  );
}
