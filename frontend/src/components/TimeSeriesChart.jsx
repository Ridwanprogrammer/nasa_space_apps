import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { CalendarDays, Rows3, Table2, TrendingUp } from 'lucide-react';
import { palette } from '../utils/theme';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

function CustomTooltip({ active, payload, units, showOLS, showCI }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="max-w-[260px] rounded-lg border border-line bg-raised p-3 text-[11px] shadow-2xl">
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-line pb-1.5">
        <span className="font-semibold text-ink">Year {point.year}</span>
        {point.isComplete ? (
          <span className="rounded border border-significant/35 bg-significant/10 px-1.5 py-0.5 text-[9px] font-medium text-significant">
            12/12 months
          </span>
        ) : (
          <span className="rounded border border-line bg-base px-1.5 py-0.5 text-[9px] font-medium text-muted">
            {point.validMonths}/12 months
          </span>
        )}
      </div>
      <dl className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
            Annual mean
          </dt>
          <dd className="numeric font-mono text-ink">
            {point.annualValue?.toFixed(2)} {units}
          </dd>
        </div>
        {point.sensTrend !== null && point.sensTrend !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted">
              <span className="h-0.5 w-3 bg-accent" aria-hidden="true" />
              Sen trend
            </dt>
            <dd className="numeric font-mono text-accent">
              {point.sensTrend.toFixed(2)} {units}
            </dd>
          </div>
        )}
        {showCI && point.ciLow !== null && (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Sen slope CI</dt>
            <dd className="numeric font-mono text-muted">
              {point.ciLow?.toFixed(2)} – {point.ciHigh?.toFixed(2)}
            </dd>
          </div>
        )}
        {showOLS && point.olsTrend !== null && (
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted">
              <span className="h-0.5 w-3 bg-cool" aria-hidden="true" />
              OLS fit
            </dt>
            <dd className="numeric font-mono text-cool">
              {point.olsTrend.toFixed(2)} {units}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Toggle({ active, tone = 'accent', onClick, children, expanded, controls, title }) {
  const activeClass =
    tone === 'cool'
      ? 'border-cool/60 bg-cool/10 text-cool'
      : 'border-accent/60 bg-accent/10 text-ink';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-expanded={expanded}
      aria-controls={controls}
      title={title}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-medium transition ${
        active ? activeClass : 'border-line bg-base text-muted hover:border-accent/40 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function TimeSeriesChart({
  annualData,
  monthlyData,
  sensSlope,
  linearRegression,
  variableMeta
}) {
  const [showOLS, setShowOLS] = useState(false);
  const [showCI, setShowCI] = useState(false);
  const [tableView, setTableView] = useState(null);
  const reduceMotion = usePrefersReducedMotion();

  const units = variableMeta?.units || '°C';
  const hasData = Boolean(annualData && annualData.length > 0);

  const completeAnnual = useMemo(
    () => (annualData || []).filter((entry) => entry.is_complete),
    [annualData]
  );

  // The Sen slope confidence interval describes the rate, not the intercept.
  // Anchor the interval at the period mean so the band visualizes plausible
  // trend rates without the artificial fan produced by year-zero intercepts.
  const center = useMemo(() => {
    if (completeAnnual.length === 0) return null;
    const year =
      completeAnnual.reduce((sum, entry) => sum + entry.year, 0) / completeAnnual.length;
    const value =
      completeAnnual.reduce((sum, entry) => sum + entry.value, 0) / completeAnnual.length;
    return { year, value };
  }, [completeAnnual]);

  const chartData = useMemo(() => {
    if (!annualData || annualData.length === 0) return [];

    const sensMap = new Map((sensSlope?.trend_line || []).map((item) => [item.year, item.trend]));
    const olsMap = new Map((linearRegression?.trend_line || []).map((item) => [item.year, item.trend]));
    const lowSlope = (sensSlope?.slope_min_ci ?? 0) / 10;
    const highSlope = (sensSlope?.slope_max_ci ?? 0) / 10;
    const anchorYear = center?.year ?? 0;
    const anchorValue = center?.value ?? 0;

    return annualData.map((entry) => ({
      year: entry.year,
      annualValue: entry.value,
      sensTrend: sensMap.get(entry.year) ?? null,
      olsTrend: olsMap.get(entry.year) ?? null,
      ciLow: sensSlope && center ? anchorValue + lowSlope * (entry.year - anchorYear) : null,
      ciHigh: sensSlope && center ? anchorValue + highSlope * (entry.year - anchorYear) : null,
      isComplete: entry.is_complete,
      validMonths: entry.valid_months
    }));
  }, [annualData, sensSlope, linearRegression, center]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const values = chartData
      .flatMap((entry) => [entry.annualValue, entry.sensTrend, entry.ciLow, entry.ciHigh])
      .filter((value) => value !== null && value !== undefined && Number.isFinite(value));
    if (values.length === 0) return ['auto', 'auto'];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.12, 0.25);
    return [
      Math.floor((min - padding) * 2) / 2,
      Math.ceil((max + padding) * 2) / 2
    ];
  }, [chartData]);

  const mean = center?.value ?? null;

  return (
    <section
      aria-labelledby="chart-heading"
      className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 border-b border-line/80 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">03 · Time series</p>
          <h2 id="chart-heading" className="mt-0.5 flex items-center gap-2 text-[14px] font-semibold tracking-tight text-ink">
            <TrendingUp className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            Annual observations &amp; trend
          </h2>
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {variableMeta?.name || 'NASA variable'} · {units} · complete 12-month years
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Toggle active={showOLS} tone="cool" onClick={() => setShowOLS((value) => !value)}>
            OLS
          </Toggle>
          <Toggle
            active={showCI}
            onClick={() => setShowCI((value) => !value)}
            title="95% confidence interval for Sen's slope, centered on the period mean"
          >
            95% CI
          </Toggle>
          <Toggle
            active={tableView === 'annual'}
            onClick={() => setTableView((value) => (value === 'annual' ? null : 'annual'))}
            expanded={tableView === 'annual'}
            controls="annual-data-table"
          >
            <Table2 className="h-3 w-3" aria-hidden="true" />
            Annual table
          </Toggle>
          <Toggle
            active={tableView === 'monthly'}
            onClick={() => setTableView((value) => (value === 'monthly' ? null : 'monthly'))}
            expanded={tableView === 'monthly'}
            controls="monthly-data-table"
          >
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            Monthly data
          </Toggle>
        </div>
      </div>

      {hasData ? (
        <div
          className="mt-3 h-[300px] w-full sm:h-[360px]"
          role="img"
          aria-label={`Annual mean ${variableMeta?.name || 'variable'} time series with Sen's trend line`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid stroke={palette.line} strokeDasharray="3 3" vertical={false} opacity={0.55} />
              <XAxis
                dataKey="year"
                stroke={palette.muted}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: palette.line }}
                minTickGap={26}
                dy={6}
              />
              <YAxis
                domain={yDomain}
                stroke={palette.muted}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: palette.line }}
                tickFormatter={(value) => Number(value).toFixed(1)}
                width={48}
              />
              <Tooltip
                content={<CustomTooltip units={units} showOLS={showOLS} showCI={showCI} />}
                cursor={{ stroke: palette.muted, strokeDasharray: '3 3', strokeOpacity: 0.5 }}
              />

              {mean !== null && (
                <ReferenceLine
                  y={mean}
                  stroke={palette.muted}
                  strokeDasharray="2 5"
                  strokeOpacity={0.55}
                />
              )}

              {showCI && (
                <>
                  <Line
                    type="linear"
                    dataKey="ciLow"
                    name="95% CI lower"
                    stroke={palette.accent}
                    strokeOpacity={0.35}
                    strokeWidth={1}
                    strokeDasharray="2 5"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    legendType="none"
                  />
                  <Line
                    type="linear"
                    dataKey="ciHigh"
                    name="95% CI upper"
                    stroke={palette.accent}
                    strokeOpacity={0.35}
                    strokeWidth={1}
                    strokeDasharray="2 5"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    legendType="none"
                  />
                </>
              )}

              <Line
                type="linear"
                dataKey="annualValue"
                name={`Annual mean (${units})`}
                stroke={palette.ink}
                strokeWidth={1.9}
                dot={{ r: 2.5, fill: palette.surface, stroke: palette.ink, strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: palette.accent, stroke: palette.base, strokeWidth: 2 }}
                isAnimationActive={!reduceMotion}
                animationDuration={500}
              />

              <Line
                type="linear"
                dataKey="sensTrend"
                name="Sen's slope"
                stroke={palette.accent}
                strokeWidth={2.2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={!reduceMotion}
                animationDuration={500}
              />

              {showOLS && (
                <Line
                  type="linear"
                  dataKey="olsTrend"
                  name="OLS fit"
                  stroke={palette.cool}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={!reduceMotion}
                  animationDuration={500}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-3 flex h-[300px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-base px-6 text-center sm:h-[360px]">
          <TrendingUp className="h-7 w-7 text-line" aria-hidden="true" />
          <p className="text-[11px] font-medium text-muted">No annual series yet</p>
          <p className="max-w-xs text-[10px] leading-relaxed text-muted/80">
            Run an investigation to plot annual means, the Sen trend, and optional confidence bounds.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5 text-[9px] text-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-ink bg-surface" aria-hidden="true" />
            Annual mean
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dashed border-accent" aria-hidden="true" />
            Sen trend
          </span>
          {mean !== null && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dotted border-muted" aria-hidden="true" />
              Period mean {mean.toFixed(2)} {units}
            </span>
          )}
          {showOLS && (
            <span className="flex items-center gap-1.5 text-cool">
              <span className="h-0.5 w-4 border-t border-dashed border-cool" aria-hidden="true" />
              OLS fit
            </span>
          )}
          {showCI && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dotted border-accent/50" aria-hidden="true" />
              Sen slope 95% CI
            </span>
          )}
        </div>
        <span className="numeric font-mono">
          {hasData
            ? `${completeAnnual.length} complete yrs · ${chartData[0].year}–${chartData[chartData.length - 1].year}`
            : 'Awaiting run'}
        </span>
      </div>

      {tableView === 'annual' && annualData && (
        <div id="annual-data-table" className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-line bg-base">
          <table className="w-full text-left text-[11px]">
            <caption className="sr-only">Annual means and completeness for the selected period</caption>
            <thead className="sticky top-0 bg-raised text-[9px] uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Year</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Mean ({units})</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Months</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono">
              {annualData.map((entry) => (
                <tr key={entry.year} className={entry.is_complete ? '' : 'opacity-55'}>
                  <th scope="row" className="px-3 py-1.5 text-left font-normal text-ink">{entry.year}</th>
                  <td className="numeric px-3 py-1.5 text-right text-ink">{entry.value.toFixed(2)}</td>
                  <td className="numeric px-3 py-1.5 text-right text-muted">{entry.valid_months}/12</td>
                  <td className="px-3 py-1.5 text-right text-[9px]">
                    {entry.is_complete ? (
                      <span className="text-significant">Complete</span>
                    ) : (
                      <span className="text-muted">Excluded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tableView === 'monthly' && monthlyData && (
        <div id="monthly-data-table" className="mt-3 rounded-lg border border-line bg-base">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <h3 className="flex items-center gap-1.5 text-[10px] font-semibold text-ink">
              <Rows3 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Monthly observations
            </h3>
            <span className="text-[9px] text-muted">{monthlyData.length} records · fill values removed</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <caption className="sr-only">Monthly observations used in the annual means</caption>
              <thead className="sticky top-0 bg-raised text-[9px] uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Date</th>
                  <th scope="col" className="px-3 py-2 font-medium">Year</th>
                  <th scope="col" className="px-3 py-2 font-medium">Month</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Value ({units})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-mono">
                {monthlyData.map((entry) => (
                  <tr key={entry.date_key} className="hover:bg-raised/50">
                    <th scope="row" className="px-3 py-1.5 text-left font-normal text-ink">{entry.date_key}</th>
                    <td className="px-3 py-1.5 text-muted">{entry.year}</td>
                    <td className="px-3 py-1.5 text-muted">{String(entry.month).padStart(2, '0')}</td>
                    <td className="numeric px-3 py-1.5 text-right text-ink">{entry.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
