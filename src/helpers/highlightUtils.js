/** Normalize whitespace from mobile text selections (handles newlines / nbsp). */
export function normalizeSelectionText(text) {
  return (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Read the current in-container selection. Uses Range#toString() which is more
 * reliable than Selection#toString() for multi-paragraph mobile selections.
 */
export function getSelectionTextInContainer(container) {
  if (!container || typeof window === "undefined") return "";

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  if (!container.contains(ancestor)) return "";

  return normalizeSelectionText(range.toString());
}

export function hasHighlightComment(highlight) {
  return typeof highlight?.comment === "string" && highlight.comment.trim().length > 0;
}

export function getHighlightPreviewText(highlight, maxLength = 100) {
  const text = normalizeSelectionText(highlight?.text);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/** Merge remote + local highlight arrays; never drop items the server hasn't caught up with yet. */
export function mergeHighlightsArrays(local = [], remote = []) {
  const byId = new Map();

  const add = (item) => {
    if (!item) return;
    const key = item.id || `${item.timestamp || ""}:${item.text || ""}:${item.comment || ""}`;
    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, item);
      return;
    }
    const existingTs = existing.timestamp ? Date.parse(existing.timestamp) : 0;
    const itemTs = item.timestamp ? Date.parse(item.timestamp) : 0;
    if (itemTs >= existingTs) {
      byId.set(key, item);
    }
  };

  remote.forEach(add);
  local.forEach(add);

  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(a.timestamp || 0) - Date.parse(b.timestamp || 0)
  );
}

export function buildDiscourseTitle(title, collection) {
  return `${title} of "${collection}"`;
}

export function findSavedDiscourseForPost(data, savedDiscourses, getByTitle) {
  if (!data) return null;
  const discourseTitle = buildDiscourseTitle(data.title, data.collection);
  const sourceUrl = `/blog/${data._id}`;

  const matches = savedDiscourses.filter(
    (s) =>
      s.discourse?.title === discourseTitle || s.discourse?.source_url === sourceUrl
  );
  if (matches.length === 0) {
    return getByTitle(discourseTitle) || null;
  }
  if (matches.length === 1) return matches[0];

  // Prefer the record with the most annotations (handles stale duplicate rows).
  return [...matches].sort((a, b) => {
    const aCount = a.discourse?.highlights?.length || 0;
    const bCount = b.discourse?.highlights?.length || 0;
    if (bCount !== aCount) return bCount - aCount;
    return Date.parse(b.saved_at || 0) - Date.parse(a.saved_at || 0);
  })[0];
}

/** Strip non-JSON-safe fields (e.g. DOM range snapshots) before persisting. */
export function serializeHighlightsForSave(highlights = []) {
  return highlights.map((item) => ({
    id: item.id,
    text: normalizeSelectionText(item.text),
    comment:
      typeof item.comment === "string" && item.comment.trim()
        ? item.comment.trim()
        : null,
    timestamp: item.timestamp || new Date().toISOString(),
  }));
}
