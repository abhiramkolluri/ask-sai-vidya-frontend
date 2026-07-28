import React, { useEffect, useState } from "react";
import LotusLoader from "./LotusLoader";

// Plain-language narration of the search pipeline, shown while a query is in
// flight. The backend does NOT stream progress (it sits behind API Gateway REST,
// which buffers responses), so these steps are paced on the client to roughly
// match the real stage timings — planning ~1s, retrieval+rerank ~1-2s, gpt-4o
// grading ~2-5s, ~5-10s total. The point isn't exact progress; it's teaching the
// user what the system is actually doing under the hood so an opaque wait becomes
// a legible one. The last stage holds until results arrive (the loader unmounts).
const STAGES = [
  // The first two stages are route-agnostic on purpose: a structured (knowledge
  // lookup) or guidance (meta/out-of-domain) response returns in ~1-2s and
  // unmounts the loader before the semantic-specific stages, so nothing false is
  // ever shown. The later stages describe the semantic passage search.
  { at: 0, message: "Reading your question…" },
  { at: 1200, message: "Working out how to search…" },
  { at: 3000, message: "Searching 1,630 discourses…" },
  { at: 5000, message: "Comparing the closest passages…" },
  { at: 7000, message: "Checking which passages truly answer your question…" },
];

// When the user asked for an exact phrase (quoted text), the pipeline takes the
// exact-match shortcut, so narrate that instead of the semantic-search step.
const EXACT_PHRASE_STAGE_MESSAGE = "Looking for your exact phrase…";

// A bare 1-2 word query takes the keyword route: no planner, no grading, ~1s.
// Its own two stages, because the shared ones would describe work that is not
// happening — "Working out how to search…" at 1200ms is a planner call this
// route deliberately skips. The second stage holds until results arrive.
const KEYWORD_STAGES = [
  { at: 0, message: "Reading your search…" },
  { at: 1200, message: "Looking for discourses that use that word…" },
];

// Staged version of LotusLoader: keeps the blooming-lotus animation but steps the
// caption through STAGES on timers. `hasExactPhrase` swaps the search-stage copy;
// `isKeyword` swaps the whole sequence for the lexical route's shorter one.
export default function StagedLotusLoader({ hasExactPhrase = false, isKeyword = false }) {
  const [stageIndex, setStageIndex] = useState(0);
  const stages = isKeyword ? KEYWORD_STAGES : STAGES;

  useEffect(() => {
    // Schedule each stage after the first (stage 0 shows immediately). Timers are
    // relative to mount; the final stage simply never advances, so it holds until
    // this component unmounts when the answer replaces it.
    const timers = stages.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.at)
    );
    return () => timers.forEach(clearTimeout);
  }, [stages]);

  let message = stages[stageIndex].message;
  if (!isKeyword && hasExactPhrase && stageIndex === 2) {
    message = EXACT_PHRASE_STAGE_MESSAGE;
  }

  // Key on stageIndex so each new caption re-triggers the fade-in (defined in
  // LotusLoader's wrapper) rather than swapping abruptly.
  return <LotusLoader key={stageIndex} message={message} />;
}
