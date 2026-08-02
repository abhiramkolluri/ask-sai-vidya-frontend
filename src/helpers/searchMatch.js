// Title matching for the corpus, shared by every collection search box.
//
// Extracted from CollectionsSearch.jsx so the top-level Collections search and
// the within-collection search behave identically. `.cursor/rules/frontend.mdc`
// is explicit that the transliteration handling lives here and should be
// EXTENDED rather than worked around by renaming corpus data — a second, naive
// `includes()` matcher elsewhere would mean "Geeta" and "Gita" behave
// differently in two search boxes on adjacent screens.

export const norm = (s) => (s || "").toLowerCase();

// Consonant skeleton so transliteration variants match the corpus spelling:
// "gita" -> "gt" is contained in "geeta" -> "gt".
export const skeleton = (s) => norm(s).replace(/[aeiou]|[^a-z]/g, "");

// Rank: prefix match beats substring beats skeleton; 0 = no match.
export function matchScore(text, query, querySkeleton) {
  const t = norm(text);
  const q = norm(query);
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  if (querySkeleton.length > 2 && skeleton(text).includes(querySkeleton)) return 1;
  return 0;
}
