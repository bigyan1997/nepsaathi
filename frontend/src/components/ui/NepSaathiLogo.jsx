/**
 * NepSaathiLogo
 *
 * Props:
 *   size     — circle diameter in px (default 22). Logo scales with it.
 *   dark     — true on dark backgrounds (uses logo-dark.svg — white "Saathi")
 *   animated — play a fade-in entrance animation
 *   style    — extra styles applied to the <img>
 */

const FADE_IN = `@keyframes nep-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}`;

let styleInjected = false;
function ensureKeyframes() {
  if (styleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = FADE_IN;
  document.head.appendChild(el);
  styleInjected = true;
}

export default function NepSaathiLogo({
  size = 22,
  dark = false,
  animated = false,
  style = {},
}) {
  if (animated) ensureKeyframes();

  // SVG viewBox is 200×44; circles are r=20 (40px diameter).
  // height = size * (44/40) keeps the full logo proportional to the requested circle size.
  const height = Math.round(size * 1.1);

  return (
    <img
      src={dark ? "/logo-dark.svg" : "/logo.svg"}
      alt="NepSaathi"
      style={{
        display: "block",
        height: `${height}px`,
        width: "auto",
        ...(animated ? { animation: "nep-fade-in 0.4s ease both" } : {}),
        ...style,
      }}
    />
  );
}
