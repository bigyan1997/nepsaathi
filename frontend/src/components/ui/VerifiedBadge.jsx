export default function VerifiedBadge({ size = 16, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      title="Verified user"
      aria-label="Verified user"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <circle cx="8" cy="8" r="8" fill="#1A8CD8" />
      <path
        d="M5 8.2l2 2L11 6"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
