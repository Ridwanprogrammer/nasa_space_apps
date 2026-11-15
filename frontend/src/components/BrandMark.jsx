export default function BrandMark({ className = '', size = 40 }) {
  return (
    <span
      className={`relative inline-grid place-items-center rounded-xl border border-line bg-raised text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(0,0,0,0.9)] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none" className="h-[72%] w-[72%]">
        <circle cx="24" cy="24" r="17.5" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
        <ellipse cx="24" cy="24" rx="8" ry="17.5" stroke="currentColor" strokeWidth="1.2" opacity="0.42" />
        <path d="M6.8 20h34.4M6.8 28h34.4" stroke="currentColor" strokeWidth="1.2" opacity="0.42" />
        <path
          d="M11 33.5l7-7.5 5.5 2.5L35 15.5"
          stroke="var(--color-accent)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="35" cy="15.5" r="3" fill="var(--color-accent)" stroke="var(--color-base)" strokeWidth="1.6" />
      </svg>
    </span>
  );
}
