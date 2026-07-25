import React from "react";
import { reasonsToTips, REASON_COPY } from "./traceCopy";

// Contextual notes shown under an answer, driven by the pipeline's reason codes:
//   1. Service error  → a "temporary problem, try again" callout (quality "error").
//   2. Factual note   → shown even on STRONG results, because a biographical/who
//                       question ("Who was Swami's mother?") returns theme-matched
//                       discourses, not a factual answer.
//   3. Refinement tips → weak/empty results only ("ask one topic at a time", etc.).
//
// Codes 1 and 2 are handled explicitly so they don't read as "you did something
// wrong" — they're honest context. Everything else is a refinement tip.
export default function SearchGuidance({ trace }) {
  if (!trace) return null;
  const quality = trace.quality;
  const reasons = trace.reasons || [];

  // (1) Infrastructure failure — a distinct, non-orange callout. The existing
  // reload control on the answer is the retry affordance.
  if (quality === "error" || trace.service_error) {
    return (
      <div className="mx-2 mt-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">{REASON_COPY.SERVICE_UNAVAILABLE()}</p>
      </div>
    );
  }

  // (2) Factual-question note — independent of quality.
  const factualNote = reasons.some((r) => r.code === "FACTUAL_QUESTION")
    ? REASON_COPY.FACTUAL_QUESTION()
    : null;

  // (3) Refinement tips — weak/empty only, excluding the notes handled above.
  const refineReasons = reasons.filter(
    (r) => r.code !== "FACTUAL_QUESTION" && r.code !== "SERVICE_UNAVAILABLE"
  );
  const tips =
    quality === "partial" || quality === "none"
      ? reasonsToTips(refineReasons, 3)
      : [];

  if (!factualNote && tips.length === 0) return null;

  return (
    <>
      {factualNote && (
        <p className="mx-2 mt-2 text-sm text-gray-500">
          <span className="font-medium text-[#BC5B01]">Note:</span> {factualNote}
        </p>
      )}

      {/* Partial results: quiet one-liner. No results: full callout. */}
      {tips.length > 0 && quality === "partial" && (
        <p className="mx-2 mt-2 text-sm text-gray-500">
          <span className="font-medium text-[#BC5B01]">Tip:</span> {tips[0]}
        </p>
      )}
      {tips.length > 0 && quality === "none" && (
        <div className="mx-2 mt-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="mb-2 text-sm font-semibold text-[#BC5B01]">
            Tips to refine your search
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
