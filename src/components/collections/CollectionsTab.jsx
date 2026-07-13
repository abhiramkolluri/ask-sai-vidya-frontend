import React from "react";
import { useSearchParams } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import DecorativeBackground from "../common/DecorativeBackground";
import { getCollectionDescription } from "../../constants/collectionDescriptions";
import { useCollectionsIndex } from "./useCollections";
import CollectionDetail from "./CollectionDetail";
import CollectionsSearch from "./CollectionsSearch";

// Section order + display titles for the grouped index the backend returns.
// The `series` bucket is expanded at render time into one section per series
// (Summer Showers, Sai Echoes from Kodai Hills, ...) with compact year cards.
const SECTIONS = [
  { key: "vahinis", title: "Vahinis" },
  { key: "sathya_sai_speaks", title: "Sathya Sai Speaks" },
  { key: "series", title: null },
  { key: "chinna_katha", title: "Chinna Katha" },
];

// Entries arrive sorted by (book, year), so insertion order keeps the
// series alphabetical and their years ascending.
function groupSeriesByBook(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.book)) groups.set(entry.book, []);
    groups.get(entry.book).push(entry);
  }
  return [...groups.entries()];
}

function CollectionCard({ entry, onOpen, displayTitle, compact }) {
  const description = compact ? "" : getCollectionDescription(entry);
  return (
    <button
      onClick={() => onOpen(entry)}
      className="flex h-full flex-col rounded-lg border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      <h3
        className="text-xl font-semibold text-gray-900"
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        {displayTitle || entry.title}
      </h3>
      <p className="mt-1 text-sm font-medium text-[#BC5B01]">
        {entry.count} {entry.count === 1 ? "discourse" : "discourses"}
      </p>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-3">
          {description}
        </p>
      )}
    </button>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-4 border-b border-orange-100 pb-2">
      <h2
        className="text-2xl font-semibold text-gray-800"
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
}

function CollectionsIndex({ data, isLoading, isError, onOpen }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <FaSpinner className="animate-spin text-orange-400" size={28} />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="py-16 text-center text-gray-600">
        Collections are temporarily unavailable. Please try again shortly.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {SECTIONS.map(({ key, title }) => {
        const entries = data.sections?.[key] || [];
        if (entries.length === 0) return null;

        // Discourse series and Sathya Sai Speaks are year-organized: each
        // book gets its own section with the description once under the
        // header and compact year-only cards below (SSS also gets an
        // "Undated" card for discourses without a known date).
        if (key === "series" || key === "sathya_sai_speaks") {
          return groupSeriesByBook(entries).map(([book, seriesEntries]) => (
            <section key={book} className="mb-10">
              <SectionHeading
                title={book}
                description={getCollectionDescription({ book })}
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {seriesEntries.map((entry) => (
                  <CollectionCard
                    key={entry.key}
                    entry={entry}
                    onOpen={onOpen}
                    displayTitle={entry.year ? String(entry.year) : "Undated"}
                    compact
                  />
                ))}
              </div>
            </section>
          ));
        }

        return (
          <section key={key} className="mb-10">
            <SectionHeading title={title} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <CollectionCard key={entry.key} entry={entry} onOpen={onOpen} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function CollectionsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const book = searchParams.get("book");
  const volume = searchParams.get("volume");
  const year = searchParams.get("year");
  const undated = searchParams.get("undated") === "1";
  const [searching, setSearching] = React.useState(false);
  const { data, isLoading, isError } = useCollectionsIndex();

  const openCollection = (entry) => {
    setSearchParams({
      tab: "collections",
      book: entry.book,
      ...(entry.volume != null && { volume: String(entry.volume) }),
      ...(entry.year != null && { year: String(entry.year) }),
      ...(entry.undated && { undated: "1" }),
    });
  };

  const backToIndex = () => setSearchParams({ tab: "collections" });

  return (
    <div className="relative isolate h-full overflow-hidden">
      <DecorativeBackground />
      <div className="h-full overflow-y-auto px-6 py-6">
        {book ? (
          <CollectionDetail
            book={book}
            volume={volume}
            year={year}
            undated={undated}
            onBack={backToIndex}
          />
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1
                className="text-3xl font-semibold text-gray-800"
                style={{ fontFamily: "'EB Garamond', serif" }}
              >
                Collections
              </h1>
              <p className="mt-1 text-base text-gray-800">
                Read through Swami's discourses — highlight and annotate as
                you go.
              </p>
            </div>
            <CollectionsSearch
              sections={data?.sections}
              onOpenCollection={openCollection}
              onSearchingChange={setSearching}
            />
            {!searching && (
              <CollectionsIndex
                data={data}
                isLoading={isLoading}
                isError={isError}
                onOpen={openCollection}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
