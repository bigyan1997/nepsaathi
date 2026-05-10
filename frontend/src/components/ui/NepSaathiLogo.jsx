/**
 * NepSaathiLogo
 *
 * Props:
 *   size     — circle diameter in px (default 22). Wordmark scales with it.
 *   dark     — true on dark backgrounds (white "Saathi", lighter indigo)
 *   animated — play entrance animation (circles slide in and meet)
 *   style    — extra container styles
 */

const ORANGE = "#E87722";
const INDIGO = "#534AB7";
const DARK_TEXT = "#26215C";

const KEYFRAMES = `
@keyframes nep-left-in {
  from { transform: translateX(8px); opacity: 0; }
  to   { transform: translateX(0);   opacity: 1; }
}
@keyframes nep-right-in {
  from { transform: translateX(-8px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes nep-word-in {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0);   }
}
`;

let styleInjected = false;
function ensureKeyframes() {
  if (styleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = KEYFRAMES;
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

  const r = size / 2;
  const overlap = size * 0.48; // how far right circle is offset — matches the actual logo
  const markW = size + overlap;
  const markH = size;

  const indigoFill = dark ? "#AFA9EC" : INDIGO;
  const saathiColor = dark ? "#ffffff" : DARK_TEXT;

  const leftAnim = animated
    ? { animation: "nep-left-in 0.45s cubic-bezier(.22,.68,0,1.2) both" }
    : {};
  const rightAnim = animated
    ? { animation: "nep-right-in 0.45s cubic-bezier(.22,.68,0,1.2) 0.05s both" }
    : {};
  const wordAnim = animated
    ? { animation: "nep-word-in 0.35s ease 0.3s both" }
    : {};

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(size * 0.36),
        cursor: "default",
        ...style,
      }}
    >
      {/* Mark */}
      <svg
        width={markW}
        height={markH}
        viewBox={`0 0 ${markW} ${markH}`}
        style={{ flexShrink: 0, overflow: "visible" }}
        aria-hidden="true"
      >
        <circle cx={r} cy={r} r={r} fill={ORANGE} style={leftAnim} />
        <circle
          cx={r + overlap}
          cy={r}
          r={r}
          fill={indigoFill}
          fillOpacity={0.88}
          style={rightAnim}
        />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontSize: Math.round(size * 0.82),
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          ...wordAnim,
        }}
      >
        <span style={{ color: ORANGE }}>Nep</span>
        <span style={{ color: saathiColor }}>Saathi</span>
      </span>
    </div>
  );
}
