import React from "react";
import tree from "../../assets/illustrations/tree.svg";
import birds from "../../assets/illustrations/birds.svg";
import butterflies from "../../assets/illustrations/butterflies.svg";
import swami from "../../assets/illustrations/swami.svg";
import dove from "../../assets/illustrations/dove-filled.svg";

// Subtle, non-interactive illustration layer used behind page content.
// Sits at -z-10 inside an `isolate` parent so it never intercepts clicks
// and stays well behind text. Opacity is kept low for readability.
//
// `hideSwami` drops the left-hand swami for pages whose content sits on the
// left and would otherwise obscure it. `showDove` adds a dove in the upper-left.
export default function DecorativeBackground({ hideSwami = false, showDove = false }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {!hideSwami && (
        <img
          src={swami}
          alt=""
          className="absolute left-6 top-36 w-32 opacity-[0.25] md:w-44"
        />
      )}
      {showDove && (
        <img
          src={dove}
          alt=""
          className="absolute left-6 top-8 w-28 opacity-[0.3] md:w-36"
        />
      )}
      <img
        src={birds}
        alt=""
        className="absolute right-8 top-12 w-40 opacity-[0.25] md:w-60"
      />
      <img
        src={tree}
        alt=""
        className="absolute -right-4 bottom-0 w-52 opacity-[0.20] md:w-72"
      />
      <img
        src={butterflies}
        alt=""
        className="absolute left-6 bottom-20 w-36 opacity-[0.24] md:w-52"
      />
    </div>
  );
}
