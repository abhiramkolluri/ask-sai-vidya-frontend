// Maps the backend's machine-readable reason codes (search/transparency.py's
// assess_quality) to friendly, actionable copy for the refinement-guidance
// callout. Keeping the copy here — not in the backend — means wording can be
// tuned with a frontend-only deploy, and any code the frontend doesn't recognize
// is simply skipped (forward compatible with new backend codes).
//
// Each entry is (reason) => string. `reason` is { code, data? }; `data` carries
// parameters like the misspelled term or the facet list.

export const REASON_COPY = {
  MULTI_TOPIC_DILUTION: (reason) => {
    const n = reason.data?.count || (reason.data?.facets || []).length || "several";
    return `Your question touched ${n} different topics. Asking about one at a time usually finds stronger discourses.`;
  },

  ALL_REJECTED_BY_GRADER: () =>
    "I found passages that mention these words, but none that directly answer your question. Try rephrasing around the underlying teaching — for example “how to overcome jealousy” rather than a long personal story.",

  LOW_RELEVANCE: () =>
    "These discourses are related to your question but may not answer it directly. A more specific question can help.",

  NO_MATCHES: () =>
    "I couldn't find any passages matching this. This library holds Sai Baba's discourses — try asking about a spiritual concept, practice, or teaching. Tip: put double quotes around a phrase to search for it exactly.",

  EXACT_PHRASE_MISS: (reason) => {
    const phrase = reason.data?.phrase;
    return phrase
      ? `I couldn't find the exact phrase “${phrase}”, so I searched for its meaning instead. Check the wording, or remove the quotes to search more broadly.`
      : "I couldn't find that exact phrase, so I searched for its meaning instead. Check the wording, or remove the quotes to search more broadly.";
  },

  SPELLING_HINT: (reason) => {
    const user = reason.data?.user_term;
    const corpus = reason.data?.corpus_term;
    return user && corpus
      ? `The discourses spell this term “${corpus}” (you wrote “${user}”) — try that spelling.`
      : "Try an alternative spelling — the discourses use traditional transliterations.";
  },

  PLANNER_FALLBACK: () => "Try rephrasing your question in a different way.",

  SERVICE_UNAVAILABLE: () =>
    "This was a temporary problem reaching the search service, not an empty result — please try your question again.",

  FACTUAL_QUESTION: () =>
    "I search discourses by theme, not biographical facts — here are related discourses that may touch on it.",
};

// Generic fallback for any code we don't have specific copy for.
const GENERIC_TIP = "Try rephrasing your question in a different way.";

// Turn a trace's reasons[] into up to `max` display strings, de-duplicated and
// in the backend's priority order. Unknown codes fall back to a generic tip
// (and are de-duped, so several unknowns collapse to one).
export function reasonsToTips(reasons = [], max = 3) {
  const tips = [];
  for (const reason of reasons) {
    if (!reason || !reason.code) continue;
    const build = REASON_COPY[reason.code];
    const text = build ? build(reason) : GENERIC_TIP;
    if (!tips.includes(text)) tips.push(text);
    if (tips.length >= max) break;
  }
  return tips;
}
