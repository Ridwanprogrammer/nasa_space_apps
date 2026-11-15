import { AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { formatPValue, formatSigned } from '../utils/format';
import InfoTip from './InfoTip';

function splitLimitation(text) {
  const index = text.indexOf(': ');
  if (index > 0 && index < 42) {
    return { label: text.slice(0, index), body: text.slice(index + 2) };
  }
  return { label: null, body: text };
}

function Diagnostic({ label, value, help, children }) {
  return (
    <div className="rounded-lg border border-line/70 bg-base/60 p-2.5">
      <dt className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-muted">
        {label}
        {children}
      </dt>
      <dd className="numeric mt-1 font-mono text-[12px] font-semibold text-ink">{value}</dd>
      {help && <p className="mt-0.5 text-[9px] text-muted/80">{help}</p>}
    </div>
  );
}

export default function FindingsPanel({ findings, mannKendall, sensSlope, linearRegression, provenance, limitations }) {
  if (!findings || !mannKendall || !sensSlope || !linearRegression || !provenance) return null;

  const caveats = limitations && limitations.length > 0 ? limitations : [];

  return (
    <section
      aria-labelledby="findings-heading"
      className="rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-col gap-2 border-b border-line/80 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">05 · Evidence</p>
          <h2 id="findings-heading" className="mt-0.5 flex items-center gap-2 text-[14px] font-semibold tracking-tight text-ink">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            Statistical evidence &amp; caveats
          </h2>
        </div>
        <span className="text-[9px] text-muted">
          Two independent tests · α = {mannKendall.alpha ?? 0.05}
        </span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-lg border border-line/70 bg-base/60 p-3.5">
          <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            <FileText className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            How to read this result
          </h3>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/90">{findings.confidence_interval_statement}</p>
          <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-relaxed text-muted">
            Statistical significance describes the strength of evidence for a monotonic trend. It is not
            the size of the change, and it does not identify a cause. Read the rate and its confidence
            interval alongside the p-value.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <Diagnostic
            label="Mann–Kendall τ"
            value={mannKendall.tau.toFixed(3)}
            help="Rank correlation, −1 to +1"
          >
            <InfoTip label="Kendall's tau" align="right">
              A rank-based measure of monotonic association between year and the observed annual values.
              Values near +1 indicate a consistently increasing series; near −1, decreasing.
            </InfoTip>
          </Diagnostic>
          <Diagnostic label="Standardized z" value={formatSigned(mannKendall.z_score, 2)} help="Test statistic" />
          <Diagnostic
            label="Significance"
            value={formatPValue(mannKendall.p_value)}
            help="p-value, two-sided"
          />
          <Diagnostic
            label="OLS R²"
            value={linearRegression.r_squared.toFixed(3)}
            help={`${formatSigned(linearRegression.slope_per_decade, 3)} ${provenance.units}/decade`}
          />
        </dl>
      </div>

      {caveats.length > 0 && (
        <div className="mt-3 rounded-lg border border-accent/25 bg-accent/[0.04] p-3.5">
          <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            What this result does and does not establish
          </h3>
          <ul className="mt-2 space-y-1.5">
            {caveats.map((limitation) => {
              const { label, body } = splitLimitation(limitation);
              return (
                <li key={limitation} className="flex gap-2 text-[10px] leading-relaxed text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
                  <span>
                    {label && <strong className="font-semibold text-ink/90">{label}: </strong>}
                    {body}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
