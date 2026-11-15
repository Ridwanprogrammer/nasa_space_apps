import { useId, useState } from 'react';
import {
  ChevronDown,
  Database,
  ExternalLink,
  HardDriveDownload,
  Radio,
  ShieldCheck
} from 'lucide-react';
import { formatTimestamp } from '../utils/format';

function Field({ label, children, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[9px] uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-[11px] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

export default function ProvenanceDrawer({ provenance }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  if (!provenance) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-raised/60 sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Database className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              06 \u00b7 Dataset
            </span>
            <span className="block truncate text-[13px] font-semibold text-ink">
              Provenance & processing lineage
            </span>
          </span>
          <span className="hidden shrink-0 rounded-full border border-line bg-base px-2 py-0.5 text-[9px] text-muted sm:inline">
            {provenance.source_mission.replace(' (via NASA POWER)', '')}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted">
          <span className="hidden sm:inline">{isOpen ? 'Hide details' : 'Show details'}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen && (
        <div id={panelId} className="border-t border-line bg-base/40 px-4 py-4 sm:px-5">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Primary source">{provenance.source_mission}</Field>
            <Field label="NASA POWER product">{provenance.dataset_name}</Field>
            <Field label="Variable">
              {provenance.variable_name} <span className="font-mono text-muted">({provenance.variable_id})</span>
            </Field>
            <Field label="Native grid resolution">
              <span className="font-mono">{provenance.spatial_resolution}</span>
              <span className="ml-1 text-muted">
                ({provenance.lat_resolution}\u00b0 \u00d7 {provenance.lon_resolution}\u00b0)
              </span>
            </Field>
            <Field label="Spatial semantics" wide>
              {provenance.spatial_meaning}
            </Field>
            <Field label="Measurement units">
              <span className="font-mono">{provenance.units}</span>
            </Field>
            <Field label="Annual completeness rule">{provenance.completeness_rule}</Field>
            <Field label="Observation evaluation">
              <span className="font-mono">
                {provenance.valid_months_count} valid / {provenance.missing_months_count} missing
              </span>{' '}
              across {provenance.total_months_evaluated} months; {provenance.annual_observations_count} complete
              annual means.
            </Field>
            <Field label="Cache lineage">
              <span className="inline-flex items-center gap-1.5">
                {provenance.is_cached ? (
                  <>
                    <HardDriveDownload className="h-3.5 w-3.5 text-significant" aria-hidden="true" />
                    Deterministic local disk cache
                  </>
                ) : (
                  <>
                    <Radio className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    Live NASA POWER request
                  </>
                )}
              </span>
            </Field>
            <Field label="Retrieved">
              <span className="font-mono text-[10px]">{formatTimestamp(provenance.retrieval_timestamp)}</span>
            </Field>
            <Field label="Source lineage" wide>
              <span className="inline-flex items-start gap-1.5">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                {provenance.lineage_note}
              </span>
            </Field>
          </dl>

          <div className="mt-4 flex flex-col gap-2 border-t border-line/70 pt-3 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-muted/80">Endpoint: </span>
              <code className="break-all font-mono text-accent/90">{provenance.api_endpoint}</code>
            </div>
            {provenance.source_url && (
              <a
                href={provenance.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[10px] font-medium text-ink transition hover:border-accent/50 hover:text-accent"
              >
                NASA POWER portal
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}