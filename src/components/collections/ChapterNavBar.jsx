import React from "react";
import { Link } from "react-router-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// Prev / collection-breadcrumb / next bar shown on the Blog reader when a
// discourse was opened from the Collections tab (?book=... present). Prev/next
// are positional neighbours in the chapter list, so gaps and duplicate
// chapter_index values in the corpus are harmless.
export default function ChapterNavBar({
  book,
  volume,
  year,
  undated,
  prevChapter,
  nextChapter,
  chaptersQS,
}) {
  const label = `${book}${volume ? `, Vol ${volume}` : ""}${year ? ` ${year}` : ""}${undated ? " — Undated" : ""}`;
  const backParams = new URLSearchParams({ tab: "collections", book });
  if (volume) backParams.set("volume", volume);
  if (year) backParams.set("year", year);
  if (undated) backParams.set("undated", "1");

  return (
    <div className="flex w-full max-w-[800px] flex-col items-center gap-2 px-4 py-2 sm:flex-row">
      <div className="flex min-w-0 flex-1 justify-center sm:justify-start">
        {prevChapter && (
          <Link
            to={`/blog/${prevChapter.id}?${chaptersQS}`}
            className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-[#BC5B01] transition-colors hover:bg-orange-50"
            title={prevChapter.title}
          >
            <IoChevronBack size={14} className="shrink-0" />
            <span className="truncate">{prevChapter.title}</span>
          </Link>
        )}
      </div>
      <Link
        to={`/home?${backParams.toString()}`}
        className="shrink-0 rounded-md px-3 py-1 text-sm font-semibold text-gray-600 transition-colors hover:bg-orange-50 hover:text-[#BC5B01]"
      >
        {label}
      </Link>
      <div className="flex min-w-0 flex-1 justify-center sm:justify-end">
        {nextChapter && (
          <Link
            to={`/blog/${nextChapter.id}?${chaptersQS}`}
            className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-[#BC5B01] transition-colors hover:bg-orange-50"
            title={nextChapter.title}
          >
            <span className="truncate">{nextChapter.title}</span>
            <IoChevronForward size={14} className="shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
