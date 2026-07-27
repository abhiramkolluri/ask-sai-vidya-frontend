import React, { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

// "How I searched" — a window into the search pipeline for a given answer. It
// renders the real trace the backend returned (search/transparency.py), not a
// simulation, so the user can see how their question was interpreted and why
// certain discourses surfaced. Two levels of depth:
//   Level 1: a plain-language narrative of the stages (default).
//   Level 2: "Show details" — the underlying facets, counts, scores, and verdicts
//            for users who want to diagnose a ranking.
// Renders nothing when there's no trace (old messages / older backend).

// Sum of passages retrieved across all facets (each facet over-fetches).
function totalRetrieved(trace) {
  return (trace.retrieval?.facet_results || []).reduce(
    (sum, f) => sum + (f.retrieved || 0),
    0
  );
}

// Build the ordered narrative sentences from whatever sections the trace has.
// Exact-match and grader-fallback paths produce partial traces, so every step is
// guarded on the data it needs.
function buildNarrative(trace) {
  const steps = [];
  const exact = trace.exact_phrase || {};
  const facets = trace.planning?.facets || [];
  const grading = trace.grading || {};

  const entity = (trace.entities || [])[0];

  // Exact-phrase shortcut: a different, shorter path — narrate it directly.
  if (exact.matched && exact.phrase) {
    steps.push(`You asked for the exact phrase "${exact.phrase}", so I looked it up directly in the discourses.`);
    return steps;
  }

  // Router v2 non-semantic routes take a different path than a passage search, so
  // narrate what actually happened — never claim a search that didn't run.
  if (trace.route === "structured") {
    if (trace.kb_gap) {
      steps.push(
        entity
          ? `I recognized this as asking about ${entity}. It isn't covered in the discourse index, so I'm not showing loosely related sources as if they answered it.`
          : "I recognized this as a specific factual/named-text question the discourse index doesn't cover, so I abstained rather than show loosely related matches."
      );
    } else {
      steps.push(
        entity
          ? `I recognized ${entity} and pulled up the source${(trace.results?.discourses || 0) === 1 ? "" : "s"} about it directly, rather than searching by theme.`
          : "I looked this up directly in the knowledge index rather than searching by theme."
      );
    }
    const totalMs0 = trace.timings_ms?.total;
    if (totalMs0) steps.push(`That took ${(totalMs0 / 1000).toFixed(1)}s.`);
    return steps;
  }
  if (trace.route === "guidance") {
    steps.push(
      trace.intent === "meta"
        ? "This looked like a request to the app rather than the discourses, so I didn't search the corpus."
        : "This doesn't match the discourse library, so I didn't return any sources."
    );
    return steps;
  }
  // Listing route: an ordered enumeration of a collection's chapters, NOT a
  // relevance search — narrate that honestly so the ordering makes sense.
  if (trace.route === "listing") {
    const lst = trace.listing || {};
    if (lst.not_found) {
      steps.push(
        lst.collection
          ? `You asked for the chapters of "${lst.collection}", but I couldn't find a collection by that name, so I didn't guess with a thematic search.`
          : "You asked to list a collection's chapters, but I couldn't tell which collection, so I didn't guess with a thematic search."
      );
    } else {
      const order = lst.order === "last" ? "last" : lst.order === "all" ? "all" : "first";
      const n = lst.count || 0;
      const where = order === "all" ? "all of them" : `the ${order} ${n}`;
      steps.push(
        `You asked for chapters of ${lst.collection || "the collection"}, so I listed ${where} in reading order — not ranked by relevance.`
      );
    }
    return steps;
  }

  // --- Semantic route (the default passage search) ---

  // 0. What kind of question the router judged this to be (only when it's a
  // notable, non-default intent — plain conceptual questions need no preamble).
  const INTENT_PHRASE = {
    scenario: "I read this as a personal-guidance question",
    aspect: "I noticed you asked about a specific aspect of the topic",
    comparative: "I read this as a comparison between ideas",
  };
  if (INTENT_PHRASE[trace.intent]) {
    steps.push(`${INTENT_PHRASE[trace.intent]}.`);
  }
  // Comparison note: we search each side but don't compose a comparison.
  if (trace.is_comparison) {
    steps.push("Because you're comparing ideas, I searched for each side and show sources on both.");
  }

  // 1. How the question was rephrased into search terms.
  if (facets.length === 1) {
    steps.push(`I rephrased your question into a search: "${facets[0]}".`);
  } else if (facets.length > 1) {
    const list = facets.map((f) => `"${f}"`).join(", ");
    steps.push(`I split your question into ${facets.length} searches: ${list}.`);
  }

  // 1b. Occasion routing: when the question asked for a specific occasion
  // (e.g. Dasara), the backend filters on discourse metadata — or says so
  // honestly when the filter found nothing and it searched everything instead.
  const mf = trace.metadata_filter;
  if (mf?.applied) {
    steps.push(`I limited the search to discourses given during ${mf.occasion}.`);
  } else if (mf?.fell_back) {
    steps.push(
      `I tried limiting the search to "${mf.occasion}" discourses, but found none labeled that way — so I searched everything instead.`
    );
  }

  // 2. Retrieval breadth.
  const retrieved = totalRetrieved(trace);
  if (retrieved > 0) {
    steps.push(`I searched all 1,630 discourses and gathered the ${retrieved} closest passages.`);
  }

  // 3. Narrowing to the strongest candidates (note if reranking fell back).
  const merged = trace.retrieval?.merged_candidates || 0;
  if (merged > 0) {
    const usedFallback = (trace.retrieval?.facet_results || []).some(
      (f) => f.reranker === "hybrid_score"
    );
    steps.push(
      `I compared them and kept the ${merged} strongest${
        usedFallback ? " (using keyword+meaning ranking)" : ""
      }.`
    );
  }

  // 4. The grader's verdict — or a note when it couldn't run per-passage.
  if (grading.fallback) {
    steps.push("I couldn't verify each quote individually this time, so I kept the closest matches.");
  } else if (grading.kept || grading.rejected) {
    const rejectedNote =
      grading.rejected > 0
        ? `, setting aside ${grading.rejected} that only mention the topic`
        : "";
    steps.push(`I read each one and kept the ${grading.kept} that truly answer your question${rejectedNote}.`);
  }

  // 5. Outcome + timing.
  const count = trace.results?.discourses || 0;
  const totalMs = trace.timings_ms?.total;
  const timing = totalMs ? ` in ${(totalMs / 1000).toFixed(1)}s` : "";
  if (count > 0) {
    steps.push(`That gave ${count} source${count === 1 ? "" : "s"}${timing}.`);
  }

  return steps;
}

// Human-readable label for a grader rejection reason code.
const REJECT_REASON_LABEL = {
  not_answering: "doesn't directly answer",
  low_relevance: "only loosely related",
  quote_not_verbatim: "no exact supporting quote",
};

function TraceDetails({ trace }) {
  const facetResults = trace.retrieval?.facet_results || [];
  const grading = trace.grading || {};
  const timings = trace.timings_ms || {};

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
      {/* Routing — explains why the facet/score table below may be empty on a
          structured (knowledge lookup) or guidance route. */}
      {(trace.intent || trace.route) && (
        <div className="mb-3">
          <p className="mb-1 font-semibold text-gray-800">Routing</p>
          <p className="text-gray-600">
            intent: {trace.intent || "—"} · route: {trace.route || "—"}
            {(trace.entities || []).length > 0 && ` · entity: ${trace.entities.join(", ")}`}
            {trace.is_comparison && " · comparison"}
          </p>
        </div>
      )}

      {/* Per-facet retrieval */}
      {facetResults.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-semibold text-gray-800">Searches run</p>
          <ul className="space-y-1">
            {facetResults.map((f, i) => (
              <li key={i} className="text-gray-600">
                “{f.facet}” — {f.retrieved} passages found, kept {f.kept_after_rerank} (
                {f.reranker === "cohere" ? "AI reranker" : f.reranker === "hybrid_score" ? "keyword+meaning" : "n/a"})
                {/* facets run concurrently, so each carries its own duration */}
                {f.ms != null && ` in ${(f.ms / 1000).toFixed(1)}s`}
              </li>
            ))}
          </ul>
          {trace.retrieval?.merged_candidates > 0 && (
            <p className="mt-1 text-gray-500">
              Merged to {trace.retrieval.merged_candidates} candidates.
            </p>
          )}
        </div>
      )}

      {/* Kept passages with relevance scores */}
      {(grading.kept_passages || []).length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-semibold text-gray-800">Passages that answered</p>
          <ul className="space-y-1">
            {grading.kept_passages.map((p, i) => (
              <li key={i} className="text-gray-600">
                <span className="text-[#BC5B01]">{p.relevance.toFixed(2)}</span> — {p.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejected passages with reasons */}
      {(grading.rejected_passages || []).length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-semibold text-gray-800">Set aside</p>
          <ul className="space-y-1">
            {grading.rejected_passages.map((p, i) => (
              <li key={i} className="text-gray-500">
                {p.title} — {REJECT_REASON_LABEL[p.reason] || p.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stage timings */}
      {Object.keys(timings).length > 0 && (
        <div>
          <p className="mb-1 font-semibold text-gray-800">Timing</p>
          <p className="text-gray-500">
            {["planning", "retrieval", "rerank", "grading", "total"]
              .filter((k) => timings[k] != null)
              .map((k) => `${k} ${timings[k]}ms`)
              .join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchTracePanel({ trace }) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!trace) return null;
  const steps = buildNarrative(trace);
  if (steps.length === 0) return null;

  return (
    <div className="mx-2 mt-1">
      {/* Level 1 header — collapsed by default, no card chrome (it's a quiet aside). */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 py-1 text-sm text-gray-500 transition-colors hover:text-[#BC5B01]"
      >
        <span>How I searched</span>
        {open ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
      </button>

      {open && (
        <div className="asv-fade-in pl-1">
          {/* Level 1 — plain-language narrative */}
          <ol className="space-y-1 border-l border-gray-200 pl-4 text-sm text-gray-600">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {/* Level 2 — technical details on demand */}
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="mt-2 text-xs text-gray-400 underline transition-colors hover:text-[#BC5B01]"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
          {showDetails && <TraceDetails trace={trace} />}
        </div>
      )}
    </div>
  );
}
