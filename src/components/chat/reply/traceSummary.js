// Builds the one-line summary shown above the discourse cards. It replaces the
// old hardcoded "Here are some discourses where you can start learning about the
// topic:" with a line that reflects what the search actually did — so the user
// sees how their question was interpreted and can refine it if the reading was off.
//
// `trace` is the pipeline transparency trace (may be null: old cached/persisted
// messages, or an older backend). When it's absent we fall back to the exact
// legacy line so nothing regresses.

const LEGACY_LINE =
  "Here are some discourses where you can start learning about the topic:";

// "discourse" / "discourses" — the counts here are small and user-facing.
function pluralizeDiscourses(n) {
  return n === 1 ? "1 discourse" : `${n} discourses`;
}

export function buildSummaryLine(trace, citations = []) {
  const count = citations.length;

  // No trace → preserve today's wording exactly.
  if (!trace) return LEGACY_LINE;

  // Infrastructure failure — not an empty result. Say so before anything else.
  if (trace.service_error || trace.quality === "error") {
    return "I ran into a temporary problem reaching the search service.";
  }

  const facets = trace.planning?.facets || [];
  const exact = trace.exact_phrase || {};

  // Nothing directly answered the question. The guidance callout below carries
  // the "how to refine" tips; this line just states the outcome plainly.
  if (count === 0) {
    return "I searched but couldn't find discourses that directly answer this.";
  }

  // Exact-phrase shortcut succeeded.
  if (exact.matched && exact.phrase) {
    return `I found your exact phrase "${exact.phrase}" in ${pluralizeDiscourses(count)}.`;
  }

  // Single search angle.
  if (facets.length === 1) {
    return `I read your question as "${facets[0]}" and found ${pluralizeDiscourses(
      count
    )} that directly address it.`;
  }

  // Multiple search angles — show the first couple so the user sees how their
  // question was split (facets are search strings, so they're quoted).
  if (facets.length > 1) {
    const shown = facets.slice(0, 2).map((f) => `"${f}"`).join(", ");
    const more = facets.length > 2 ? ", and more" : "";
    return `I explored ${facets.length} angles of your question — ${shown}${more} — and found ${pluralizeDiscourses(
      count
    )} that address them.`;
  }

  // Trace present but no facets recorded (unusual) → generic but honest.
  return `I found ${pluralizeDiscourses(count)} that address your question.`;
}
