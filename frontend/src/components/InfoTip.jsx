import { useId } from 'react';
import { Info } from 'lucide-react';

export default function InfoTip({ label, children, align = 'left' }) {
  const id = useId();
  const alignment = align === 'right' ? 'right-0' : 'left-0';

  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={id}
        className="inline-grid h-5 w-5 place-items-center rounded-full text-muted transition hover:text-accent focus-visible:text-accent"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-50 mb-2 w-64 rounded-lg border border-line bg-raised p-3 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-muted opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${alignment}`}
      >
        {children}
      </span>
    </span>
  );
}
