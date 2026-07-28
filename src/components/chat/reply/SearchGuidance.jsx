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

  // (2) Kind-of-question notes — shown regardless of quality (not "you did
  // something wrong", just honest context about how this question was handled).
  const NOTE_CODES = ["FACTUAL_QUESTION", "COMPARISON_BOTH_SIDES", "META_REQUEST", "KB_KNOWN_GAP", "LISTING_NOT_FOUND", "UNANSWERABLE", "KEYWORD_MATCH", "KEYWORD_FELL_BACK"];
  const noteReason = reasons.find((r) => NOTE_CODES.includes(r.code));
  const note = noteReason ? REASON_COPY[noteReason.code](noteReason) : null;

  // (3) Refinement tips — weak/empty only, excluding the notes handled above.
  const refineReasons = reasons.filter(
    (r) => !NOTE_CODES.includes(r.code) && r.code !== "SERVICE_UNAVAILABLE"
  );
  const tips =
    quality === "partial" || quality === "none"
      ? reasonsToTips(refineReasons, 3)
      : [];

  if (!note && tips.length === 0) return null;

  return (
    <>
      {note && (
        <p className="mx-2 mt-2 text-sm text-gray-500">
          <span className="font-medium text-[#BC5B01]">Note:</span> {note}
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
