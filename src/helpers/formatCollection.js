// Display-only formatting for discourse `collection` strings, which are stored
// abbreviated/malformed in the data source:
//   1. The discourse marker is a terse "Disc." that often runs straight into the
//      preceding token — e.g. "SSS, Vol 14Disc. 44" or "Bhagavatha VahiniDisc. 5".
//      We render it as ", Discourse N" so the volume/series is comma-separated
//      from the discourse number: "... Vol 14, Discourse 44".
//   2. "SSS" is the abbreviation for the "Sathya Sai Speaks" series and we want
//      to show the full title.
//
// Both transforms are narrow and safe to apply to any title string, including
// composite saved-discourse titles like `… of "SSS, Vol 14Disc. 44"`.
// Do NOT use this on identity keys that must match stored values byte-for-byte.
export const formatCollection = (value) => {
  if (typeof value !== "string") return value;
  return value
    // Normalize "<token>Disc. N" / "<token>, Disc. N" -> "<token>, Discourse N"
    .replace(/[\s,]*Disc\.\s*/g, ", Discourse ")
    .replace(/\bSSS\b/g, "Sathya Sai Speaks")
    .trim();
};
