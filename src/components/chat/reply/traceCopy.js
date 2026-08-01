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
    return `Your question touched ${n} different topics. Asking about one at a time usually finds stronger sources.`;
  },

  ALL_REJECTED_BY_GRADER: () =>
    "Some passages mention these words, but none directly answer your question. Try rephrasing around the underlying teaching — for example “how to overcome jealousy” rather than a long personal story.",

  LOW_RELEVANCE: () =>
    "These sources are related to your question but may not answer it directly. A more specific question can help.",

  NO_MATCHES: () =>
    "No passages matched this. This library holds Sai Baba's discourses — try asking about a spiritual concept, practice, or teaching. Tip: put double quotes around a phrase to search for it exactly.",

  EXACT_PHRASE_MISS: (reason) => {
    const phrase = reason.data?.phrase;
    return phrase
      ? `The exact phrase “${phrase}” wasn't found, so the search engine matched on meaning instead. Check the wording, or remove the quotes to search more broadly.`
      : "That exact phrase wasn't found, so the search engine matched on meaning instead. Check the wording, or remove the quotes to search more broadly.";
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

  // The ONLY entry whose text comes from the backend rather than from this file.
  // The router writes one sentence about the specific question it refused, which
  // is far more useful than a category ("this asks which chapter is most
  // important, and no discourse ranks them" beats "this can't be answered").
  // Falls back to static copy whenever that sentence is missing or was rejected
  // as malformed, so a bad generation degrades the wording, never the refusal.
  UNANSWERABLE: (reason) => {
    const why = reason?.data?.reason;
    const suffix =
      " Better to say so than hand you a source that only looks like an answer. Try one of the questions below instead.";
    return why
      ? why.trim() + suffix
      : "This isn't something the discourses can answer — it asks for a judgement, an opinion, or a prediction that none of them state." + suffix;
  },

  RERANK_DEGRADED: () =>
    "The search engine's ranking step didn't run for this search, so these discourses are ordered by keyword and meaning overlap alone. They're genuine matches, but the most relevant one may not be first — searching again usually restores the better ordering.",

  FACTUAL_QUESTION: () =>
    "The search engine matches discourses by theme, not biographical facts — here are related discourses that may touch on it.",

  META_REQUEST: () =>
    "This looks like a request to the app rather than the discourses — to get follow-up questions, use the “Generate Follow-ups” button on an answer.",

  COMPARISON_BOTH_SIDES: () =>
    "You're comparing two ideas — the search engine looked for each and shows discourses on both, but it doesn't compose a side-by-side comparison.",

  KB_KNOWN_GAP: (reason) => {
    const entity = reason.data?.entity;
    return entity
      ? `The discourses don't directly cover “${entity}” — better to say so than show loosely related discourses as if they answered it.`
      : "The discourses don't directly cover this — better to say so than show loosely related discourses as if they answered it.";
  },

  LISTING_NOT_FOUND: (reason) => {
    const collection = reason.data?.collection;
    return collection
      ? `No collection called “${collection}” was found — check the name, or browse the Collections tab to see what's available.`
      : "The collection you asked to list wasn't found — check the name, or browse the Collections tab to see what's available.";
  },

  // Both keyword codes end by telling the user what a full question would do
  // differently. A single word is often typed out of habit rather than choice,
  // and the search they'd have preferred is one sentence away.
  KEYWORD_MATCH: (reason) => {
    const term = reason.data?.term;
    return term
      ? `You searched a single term, so the search engine matched the word “${term}” itself rather than its meaning — these are the discourses that use it most. Ask a full question to search by meaning instead.`
      : "You searched a single term, so the search engine matched the word itself rather than its meaning. Ask a full question to search by meaning instead.";
  },

  KEYWORD_FELL_BACK: (reason) => {
    const term = reason.data?.term;
    return term
      ? `Very few discourses use the word “${term}” literally, so the search engine matched on meaning instead. The corpus may use a different word for the same idea.`
      : "Very few discourses use your term literally, so the search engine matched on meaning instead. The corpus may use a different word for the same idea.";
  },

  // The literal matches WERE served, because searching by meaning found nothing.
  // Distinct from KEYWORD_FELL_BACK, whose copy promises a meaning search that in
  // this case came back empty — saying that here would describe the opposite of
  // what the user is looking at.
  KEYWORD_SERVED_THIN: (reason) => {
    const term = reason.data?.term;
    return term
      ? `Only these discourses use the word “${term}”, and searching by meaning found nothing further. This is everything the corpus has on that term.`
      : "Only these discourses use your term, and searching by meaning found nothing further. This is everything the corpus has on that term.";
  },
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
