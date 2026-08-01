import React from "react";
import "./LotusLoader.css";

// One petal, drawn upright with its base at the flower center (60,100).
// `open` is the petal's final fan-out angle; the CSS animation blooms it
// from a closed bud to that angle and back, continuously and smoothly.
function Petal({ open, fill, opacity = 1 }) {
  return (
    <path
      className="lotus-petal"
      style={{ "--open": `${open}deg` }}
      d="M60 100 C 47 78, 48 46, 60 24 C 72 46, 73 78, 60 100 Z"
      fill={fill}
      opacity={opacity}
    />
  );
}

// Blooming-lotus loading indicator for discourse searches. The whole block
// fades in on mount (asv-fade-in) so the loading state never pops in abruptly.
export default function LotusLoader({ message = "Searching for discourses…" }) {
  return (
    <div className="asv-fade-in flex flex-col items-center justify-center">
      <svg
        width="144"
        height="96"
        viewBox="-12 14 144 92"
        role="img"
        aria-label="Loading"
      >
        {/* soft breathing glow behind the flower */}
        <circle className="lotus-glow" cx="60" cy="88" r="34" fill="#E8845E" />
        {/* back row — deeper tone, wider fan */}
        <Petal open={-64} fill="#BC5B01" opacity={0.85} />
        <Petal open={64} fill="#BC5B01" opacity={0.85} />
        <Petal open={-38} fill="#D4712B" opacity={0.9} />
        <Petal open={38} fill="#D4712B" opacity={0.9} />
        {/* front row — lighter tone */}
        <Petal open={-18} fill="#E8925A" />
        <Petal open={18} fill="#E8925A" />
        <Petal open={0} fill="#F2A96E" />
        {/* golden heart */}
        <circle cx="60" cy="94" r="6.5" fill="#F2C14E" />
      </svg>
      <p className="lotus-message mt-3 text-base text-gray-600">{message}</p>
    </div>
  );
}
