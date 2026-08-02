import { useQuery } from "react-query";
import { apiRoute } from "../../helpers/apiRoute";

// Both endpoints are public and change only on re-ingestion, so cache
// aggressively (matches the backend's own 6h in-process cache).
const STALE_MS = 6 * 60 * 60 * 1000;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
}

export function useCollectionsIndex() {
  return useQuery(["collections"], () => fetchJson(apiRoute("collections")), {
    staleTime: STALE_MS,
    retry: 1,
  });
}

// The whole corpus as lean title rows (~1,350) for the Collections search
// bar. Lazy: only fetched once the user starts typing (`enabled`), then
// cached for the session.
export function useDiscourseSearchIndex(enabled) {
  return useQuery(
    ["discourseSearchIndex"],
    () => fetchJson(apiRoute("collections/chapters")),
    { staleTime: STALE_MS, retry: 1, enabled: Boolean(enabled) }
  );
}

// Full-text search restricted to one collection. The backend applies the
// `filters` object as a hard scope (search/pipeline.py) — it will return an
// empty result rather than widening to the rest of the corpus, so an empty
// response here genuinely means "not in this collection".
//
// Not cached like the catalog hooks: this is a live search, and the 6h
// staleTime used for the collections index would be wrong for it.
export function useScopedCollectionSearch(query, { book, volume, year }) {
  const trimmed = (query || "").trim();
  const filters = { book };
  if (volume) filters.volume = Number(volume);
  if (year) filters.year_start = Number(year);

  return useQuery(
    ["scopedCollectionSearch", book, volume, year, trimmed],
    async () => {
      const response = await fetch(apiRoute("search"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, include_trace: true, filters }),
      });
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    },
    // Only fires once there is something to search for, keeping this off the
    // initial render path the same way useDiscourseSearchIndex does.
    { enabled: Boolean(book && trimmed), retry: 1, keepPreviousData: true }
  );
}

export function useCollectionChapters(book, volume, year, undated) {
  // Query string (never path segments) so book names with spaces/apostrophes
  // survive the API Gateway proxy unmangled.
  const params = new URLSearchParams({ book: book || "" });
  if (volume) params.set("volume", volume);
  if (year) params.set("year", year);
  if (undated) params.set("undated", "1");

  return useQuery(
    ["collectionChapters", book, volume, year, Boolean(undated)],
    () => fetchJson(apiRoute(`collections/chapters?${params.toString()}`)),
    // retry: false — a 404 (unknown book in the URL) should show the error
    // state immediately, not after react-query's default retry backoff.
    { enabled: Boolean(book), staleTime: STALE_MS, retry: false }
  );
}
