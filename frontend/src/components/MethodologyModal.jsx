import { useEffect, useId, useRef } from 'react';
import { AlertCircle, Award, BookOpen, Calculator, Database, Layers, X } from 'lucide-react';

export default function MethodologyModal({ isOpen, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <BookOpen className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <h2 id={titleId} className="truncate text-[14px] font-semibold text-ink sm:text-base">
              Methodology &amp; analysis standards
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close methodology"
            className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-base text-muted transition hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4 text-[11px] leading-relaxed text-muted sm:px-6 sm:text-xs">
          <section className="rounded-lg border border-line bg-base/70 p-3.5">
            <h3 className="flex items-center gap-2 text-[12px] font-semibold text-ink">
              <Award className="h-4 w-4 text-accent" aria-hidden="true" />
              NASA Space Apps 2026 · Earth System Trend Detective
            </h3>
            <p className="mt-1.5">
              The challenge asks four questions. EarthScope answers each with real observations and
              statistical evidence, never synthetic data:
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 font-mono text-[10px] text-ink/90 sm:grid-cols-2">
              <p className="rounded border border-line bg-surface px-2.5 py-1.5">1. What is changing? · variable</p>
              <p className="rounded border border-line bg-surface px-2.5 py-1.5">2. Where? · coordinates</p>
              <p className="rounded border border-line bg-surface px-2.5 py-1.5">3. How much? · Sen rate</p>
              <p className="rounded border border-line bg-surface px-2.5 py-1.5">4. Is it significant? · p-value</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Calculator className="h-4 w-4 text-accent" aria-hidden="true" />
              Trend detection engine
            </h3>
            <div className="space-y-2">
              <div className="rounded-lg border border-line bg-base/60 p-3">
                <strong className="mb-1 block text-[11px] text-ink">1 · Mann–Kendall test</strong>
                <p>
                  A non-parametric rank test for a monotonic trend. It does not assume normally distributed
                  data. The app reports Kendall&apos;s τ, the standardized z statistic, and a two-sided
                  p-value at α = 0.05.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-base/60 p-3">
                <strong className="mb-1 block text-[11px] text-ink">2 · Sen&apos;s slope (Theil–Sen)</strong>
                <p>
                  The median of pairwise slopes between observations. It is robust to individual extreme
                  years, and the 95% confidence interval is derived from rank statistics.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-base/60 p-3">
                <strong className="mb-1 block text-[11px] text-ink">3 · Ordinary least squares</strong>
                <p>
                  A parametric complement used for an intuitive rate and R² goodness of fit. OLS is shown as
                  a secondary line and is not the primary significance test.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
              Aggregation &amp; completeness safeguards
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>NASA POWER fill values (-999.0) are excluded and never replaced with zeroes.</li>
              <li>
                An annual mean requires all 12 valid calendar months. Partial years are marked and excluded
                from the trend statistics.
              </li>
              <li>At least 5 complete annual means are required before any trend test runs.</li>
              <li>
                Data availability runs from 1981 to 2026 for most variables (solar irradiance from 1984).
                2026 is partial and is normally excluded by the completeness rule.
              </li>
              <li>
                Grid resolution is variable-specific: MERRA-2 variables are 0.5° × 0.625°, while
                ALLSKY_SFC_SW_DWN is 1° × 1°.
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-accent/25 bg-accent/[0.04] p-3.5">
            <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <AlertCircle className="h-4 w-4 text-accent" aria-hidden="true" />
              Scientific limitations
            </h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-ink/90">Source lineage:</strong> NASA POWER distributes modeled and
                satellite-derived products. MERRA-2 is a reanalysis, not a direct thermometer at every
                coordinate; solar irradiance blends FLASHFlux, CERES, and MERRA-2.
              </li>
              <li>
                <strong className="text-ink/90">Spatial footprint:</strong> each result is one native grid
                cell, not an area-weighted average for a country, state, or province.
              </li>
              <li>
                <strong className="text-ink/90">Absence of causation:</strong> a significant trend does not
                identify anthropogenic or natural drivers.
              </li>
              <li>
                <strong className="text-ink/90">Annual means:</strong> aggregation removes seasonal
                variability and does not capture changes in seasonality or daily extremes.
              </li>
            </ul>
          </section>

          <p className="flex items-start gap-1.5 rounded-lg border border-line bg-base/50 p-3 text-[10px]">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              Data are retrieved from the NASA POWER monthly point API with deterministic local caching.
              Each result exposes its endpoint, retrieval time, completeness counts, and source lineage in
              the provenance panel.
            </span>
          </p>
        </div>

        <div className="flex justify-end border-t border-line bg-base/60 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-[11px] font-semibold text-inverse transition hover:bg-accent-deep"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
