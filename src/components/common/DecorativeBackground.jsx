import React from "react";
import tree from "../../assets/illustrations/tree.svg";
import birds from "../../assets/illustrations/birds.svg";
import butterflies from "../../assets/illustrations/butterflies.svg";
import doveOutline from "../../assets/illustrations/dove-outline.svg";

// Subtle, non-interactive illustration layer used behind page content.
// Sits at -z-10 inside an `isolate` parent so it never intercepts clicks
// and stays well behind text. Opacity is kept low for readability.
export default function DecorativeBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <img
        src={doveOutline}
        alt=""
        className="absolute left-6 top-10 w-24 opacity-[0.22] md:w-32"
      />
      <img
        src={birds}
        alt=""
        className="absolute right-8 top-12 w-40 opacity-[0.25] md:w-60"
      />
      <img
        src={tree}
        alt=""
        className="absolute -left-4 bottom-0 w-52 opacity-[0.20] md:w-72"
      />
      <img
        src={butterflies}
        alt=""
        className="absolute right-6 bottom-20 w-36 opacity-[0.24] md:w-52"
      />
    </div>
  );
}
