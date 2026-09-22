// Same swirl-and-dot dragon mark as the favicon (src/app/icon.svg) and the
// login page's emblem — used wherever the app shows a "logo" instead of the
// old "DC" initials, so the mark is consistent everywhere it appears.
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Dragon City">
      <defs>
        <linearGradient id="brand-mark-bg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#173447" />
          <stop offset="1" stopColor="#0e2230" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#brand-mark-bg)" />
      <path
        d="M32 14c9 3 15 10 15 18 0 6-4 10-9 10-5 0-8-3-8-7 0-3 2-5 5-5 2 0 4 1 4 4"
        stroke="#2dd4bf"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="32" r="3.4" fill="#2dd4bf" />
    </svg>
  );
}
