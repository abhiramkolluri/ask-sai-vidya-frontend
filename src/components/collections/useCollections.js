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
