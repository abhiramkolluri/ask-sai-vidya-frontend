/**
 * Smooth-scroll an element into view, then fall back to an instant scroll if
 * nothing actually moved. Some Chrome setups silently no-op `behavior:"smooth"`
 * (no error, prefers-reduced-motion still off) — this catches that case.
 */
export function scrollIntoViewSafely(el, options = { block: "center", inline: "nearest" }) {
  if (!el || typeof el.scrollIntoView !== "function") return;

  const beforeY = window.scrollY;
  const beforeX = window.scrollX;
  el.scrollIntoView({ ...options, behavior: "smooth" });

  window.setTimeout(() => {
    const moved =
      Math.abs(window.scrollY - beforeY) > 1 ||
      Math.abs(window.scrollX - beforeX) > 1;
    if (!moved) {
      el.scrollIntoView({ ...options, behavior: "auto" });
    }
  }, 120);
}
