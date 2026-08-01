// Builds the one-line summary shown above the result cards. It replaces the
// old hardcoded "Here are some discourses where you can start learning about the
// topic:" with a line that reflects what the search actually did — so the user
// sees how their question was interpreted and can refine it if the reading was off.
//
// Results are called SOURCES here, not discourses. What comes back is evidence
// the user is being asked to check for themselves, and "source" says that; it
// also stays true for the parts of the corpus that are not discourses (chapters
// of the Vahinis, org documents). The corpus itself is still described as
// Sai Baba's discourses where that is what is being talked about — see
// traceCopy.js, which describes the LIBRARY rather than a result set.
//
// `trace` is the pipeline transparency trace (may be null: old cached/persisted
// messages, or an older backend). When it's absent we fall back to the exact
// legacy line so nothing regresses.

const LEGACY_LINE =
  "Here are some sources where you can start learning about the topic:";

// "source" / "sources" — the counts here are small and user-facing.
function pluralizeSources(n) {
  return n === 1 ? "1 source" : `${n} sources`;
}

// Subject-verb agreement for the sentences below, which all read
// "<n> source(s) that ... address(es) ...". Without this a single result reads
// "1 source that directly address it".
function addressVerb(n) {
  return n === 1 ? "addresses" : "address";
}

export function buildSummaryLine(trace, citations = []) {
  const count = citations.length;

  // No trace → preserve today's wording exactly.
  if (!trace) return LEGACY_LINE;

  // Infrastructure failure — not an empty result. Say so before anything else.
  if (trace.service_error || trace.quality === "error") {
    return "The search engine ran into a temporary problem reaching the search service.";
  }

  // Phase 1 of a two-phase search: these sources matched, but none has been
  // checked against the question yet. Promise nothing until the grader answers —
  // some of these will be dropped.
  if (trace.deferred || trace.quality === "pending") {
    return count === 1
      ? "1 source looks related — checking whether it answers your question…"
      : `${count} sources look related — checking which of them answer your question…`;
  }

  // Structured (knowledge-lookup) route with a canonical hit — a direct answer,
  // not a thematic search, so say so instead of reading the question as a topic.
  const entity = (trace.entities || [])[0];
  if (trace.route === "structured" && count > 0 && !trace.kb_gap) {
    return entity
      ? `Here ${count === 1 ? "is the source" : "are the sources"} about ${entity}.`
      : `${pluralizeSources(count)} directly ${addressVerb(count)} this.`;
  }

  // Listing route: an ordered enumeration of a collection's chapters. State the
  // outcome as a list, not as a reading of the question (it wasn't a search).
  if (trace.route === "listing") {
    const lst = trace.listing || {};
    if (lst.not_found || count === 0) {
      return lst.collection
        ? `No collection called "${lst.collection}" was found.`
        : "The collection you asked to list wasn't found.";
    }
    const order = lst.order === "last" ? "last " : lst.order === "all" ? "" : "first ";
    const where = lst.order === "all" ? `all ${count} chapters` : `the ${order}${count} chapter${count === 1 ? "" : "s"}`;
    return `Here ${count === 1 ? "is" : "are"} ${where} of ${lst.collection || "the collection"}, in reading order.`;
  }

  // Keyword route: the user typed a bare topic word, so we matched the WORD
  // rather than searching for its meaning. Say which word — it's the whole
  // difference between this and every other route, and it's what tells the user
  // that asking a full question would search differently. Placed above the facet
  // branches because a keyword trace has no facets and would otherwise fall
  // through to the generic line.
  if (trace.route === "keyword" && count > 0) {
    const term = trace.keyword?.term;
    return term
      ? `You searched a single term, so the search engine looked for the word "${term}" itself — here ${
          count === 1 ? "is" : "are"
        } ${pluralizeSources(count)} that use it.`
      : `Your search term was matched literally in ${pluralizeSources(count)}.`;
  }

  const facets = trace.planning?.facets || [];
  const exact = trace.exact_phrase || {};

  // Nothing directly answered the question. The guidance callout below carries
  // the "how to refine" tips; this line just states the outcome plainly.
  if (count === 0) {
    return "No sources directly answer this.";
  }

  // Exact-phrase shortcut succeeded.
  if (exact.matched && exact.phrase) {
    return `Your exact phrase "${exact.phrase}" appears in ${pluralizeSources(count)}.`;
  }

  // Single search angle.
  if (facets.length === 1) {
    return `The search engine read your question as "${facets[0]}" and found ${pluralizeSources(
      count
    )} that directly ${addressVerb(count)} it.`;
  }

  // Multiple search angles — show the first couple so the user sees how their
  // question was split (facets are search strings, so they're quoted).
  if (facets.length > 1) {
    const shown = facets.slice(0, 2).map((f) => `"${f}"`).join(", ");
    const more = facets.length > 2 ? ", and more" : "";
    return `The search engine explored ${facets.length} angles of your question — ${shown}${more} — and found ${pluralizeSources(
      count
    )} that ${addressVerb(count)} them.`;
  }

  // Trace present but no facets recorded (unusual) → generic but honest.
  return `${pluralizeSources(count)} ${addressVerb(count)} your question.`;
}
