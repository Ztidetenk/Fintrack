import { useId } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { monthYear, usd, usdAxis, usdCompact } from '../lib/format';
import { CHART, SERIES } from '../lib/palette';
import type { Projection, ProjectionPoint } from '../lib/projection';

export type ChartView = 'area' | 'bar' | 'table';

interface ProjectionChartProps {
  projection: Projection;
  /** Optional baseline drawn as a neutral line (e.g. the roadmap plan under a custom scenario). */
  compareTo?: Projection;
  compareLabel?: string;
  view?: Exclude<ChartView, 'table'>;
  height?: number;
  showMilestones?: boolean;
}

type Row = ProjectionPoint & { compare?: number };

const AREA_TICKS = [12, 36, 60, 84, 108, 132, 156, 180];
const yearTick = (m: number) => `Y${Math.round(m / 12)}`;

const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.tick, fontSize: 11 },
  tickLine: false,
} as const;

export function ProjectionChart({
  projection,
  compareTo,
  compareLabel = 'Roadmap plan',
  view = 'area',
  height = 300,
  showMilestones = true,
}: ProjectionChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const fillTreasury = `${uid}-treasury`;
  const fillHard = `${uid}-hard`;
  const rows: Row[] = (view === 'bar' ? projection.yearly : projection.points).map((p) => ({
    ...p,
    compare: compareTo?.points[p.month - 1]?.netWorth,
  }));
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  const milestones = projection.acquisitions.filter((a) => a.milestoneId);

  const tooltip = ({ active, label }: { active?: boolean; label?: string | number }) => (
    <ProjectionTooltip active={active} row={label != null ? byMonth.get(Number(label)) : undefined} compareLabel={compareLabel} />
  );

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {view === 'bar' ? (
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="month"
              tickFormatter={yearTick}
              {...axisProps}
              axisLine={{ stroke: CHART.axis }}
              interval="preserveStartEnd"
            />
            <YAxis tickFormatter={usdAxis} width={56} {...axisProps} axisLine={false} tickCount={5} />
            <Tooltip content={tooltip} cursor={{ fill: 'rgb(255 255 255 / 0.04)' }} />
            <Bar dataKey="treasury" stackId="nw" fill={SERIES.treasury} stroke={CHART.surface} strokeWidth={2} maxBarSize={22} />
            <Bar
              dataKey="hardAssets"
              stackId="nw"
              fill={SERIES.vault}
              stroke={CHART.surface}
              strokeWidth={2}
              maxBarSize={22}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : (
          <ComposedChart data={rows} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={fillTreasury} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.treasury} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SERIES.treasury} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id={fillHard} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.vault} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SERIES.vault} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="month"
              type="number"
              domain={[1, 180]}
              ticks={AREA_TICKS}
              tickFormatter={yearTick}
              {...axisProps}
              axisLine={{ stroke: CHART.axis }}
            />
            <YAxis tickFormatter={usdAxis} width={56} {...axisProps} axisLine={false} tickCount={5} />
            <Tooltip content={tooltip} cursor={{ stroke: CHART.reference, strokeWidth: 1, strokeOpacity: 0.6 }} />
            {showMilestones &&
              milestones.map((a, i) => (
                <ReferenceLine
                  key={a.key}
                  x={a.month}
                  stroke={CHART.reference}
                  strokeOpacity={0.3}
                  label={{ value: String(i + 1), position: 'top', fill: CHART.reference, fontSize: 10 }}
                />
              ))}
            <Area
              type="monotone"
              dataKey="treasury"
              stackId="nw"
              stroke={SERIES.treasury}
              strokeWidth={2}
              fill={`url(#${fillTreasury})`}
              activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2, fill: SERIES.treasury }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="hardAssets"
              stackId="nw"
              stroke={SERIES.vault}
              strokeWidth={2}
              fill={`url(#${fillHard})`}
              activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2, fill: SERIES.vault }}
              isAnimationActive={false}
            />
            {compareTo && (
              <Line
                type="monotone"
                dataKey="compare"
                stroke={CHART.reference}
                strokeWidth={2}
                strokeOpacity={0.7}
                dot={false}
                activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2, fill: CHART.reference }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ProjectionTooltip({ active, row, compareLabel }: { active?: boolean; row?: Row; compareLabel: string }) {
  if (!active || !row) return null;
  const lines = [
    { key: 'hard', label: 'Hard asset equity', value: row.hardAssets, color: SERIES.vault },
    { key: 'treasury', label: 'Private brokerage', value: row.treasury, color: SERIES.treasury },
    ...(row.compare != null ? [{ key: 'compare', label: compareLabel, value: row.compare, color: CHART.reference }] : []),
  ];
  return (
    <div className="min-w-52 rounded-xl border border-zinc-700/80 bg-zinc-950/95 p-3 text-xs shadow-2xl backdrop-blur-md">
      <p className="font-medium text-zinc-200">
        Year {Math.ceil(row.month / 12)} · {monthYear(row.date)}
      </p>
      <p className="text-[11px] text-zinc-500">
        Month {row.month} · Age {row.age} · Phase {row.phase} · {usdCompact(row.payout)}/mo payout
      </p>
      <div className="mt-2.5 space-y-1.5">
        {lines.map((l) => (
          <div key={l.key} className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full" style={{ background: l.color }} aria-hidden />
            <span className="font-semibold text-zinc-50 tabular-nums">{usd(l.value)}</span>
            <span className="text-zinc-400">{l.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-zinc-800 pt-2">
        <span className="text-zinc-400">Net worth</span>
        <span className="font-semibold text-zinc-50 tabular-nums">{usd(row.netWorth)}</span>
      </div>
    </div>
  );
}

export function ProjectionLegend({ projection, compareLabel }: { projection: Projection; compareLabel?: string }) {
  const f = projection.final;
  const items = [
    { label: 'Private brokerage', value: f.treasury, color: SERIES.treasury, shape: 'rect' },
    { label: 'Hard asset equity', value: f.hardAssets, color: SERIES.vault, shape: 'rect' },
    ...(compareLabel ? [{ label: compareLabel, value: null, color: CHART.reference, shape: 'line' }] : []),
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          {i.shape === 'rect' ? (
            <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
          ) : (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: i.color }} aria-hidden />
          )}
          <span className="text-zinc-400">{i.label}</span>
          {i.value != null && <span className="font-medium text-zinc-100">{usdCompact(i.value)} at Y15</span>}
        </li>
      ))}
    </ul>
  );
}

export function ProjectionTable({ projection }: { projection: Projection }) {
  return (
    <div className="max-h-[340px] overflow-auto rounded-xl ring-1 ring-zinc-800">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead className="sticky top-0 bg-zinc-900 text-zinc-400">
          <tr>
            {['Year', 'Age', 'Payout / mo', 'Brokerage', 'Hard assets', 'Net worth'].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-medium first:pl-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80 font-mono tabular-nums">
          {projection.yearly.map((p) => (
            <tr key={p.month} className="text-zinc-300 hover:bg-zinc-800/40">
              <td className="px-3 py-2 pl-4 text-zinc-100">Y{p.month / 12}</td>
              <td className="px-3 py-2">{p.age}</td>
              <td className="px-3 py-2">{usd(p.payout)}</td>
              <td className="px-3 py-2">{usd(p.treasury)}</td>
              <td className="px-3 py-2">{usd(p.hardAssets)}</td>
              <td className="px-3 py-2 text-zinc-50">{usd(p.netWorth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AcquisitionChips({ projection }: { projection: Projection }) {
  const core = projection.acquisitions.filter((a) => a.milestoneId);
  const extra = projection.acquisitions.filter((a) => !a.milestoneId);
  if (!projection.acquisitions.length)
    return <p className="text-xs text-zinc-500">No milestones get funded inside 15 years at this payout.</p>;
  return (
    <ol className="flex flex-wrap gap-2 text-[11px]">
      {core.map((a, i) => (
        <li key={a.key} className="flex items-center gap-1.5 rounded-lg bg-zinc-900/80 px-2 py-1 ring-1 ring-zinc-800">
          <span className="flex size-4 items-center justify-center rounded-full bg-amber-500/15 font-mono text-[10px] text-amber-300">
            {i + 1}
          </span>
          <span className="text-zinc-200">{a.name}</span>
          <span className="text-zinc-500">
            M{a.month} · Age {a.age}
          </span>
        </li>
      ))}
      {extra.length > 0 && (
        <li className="flex items-center gap-1.5 rounded-lg bg-zinc-900/80 px-2 py-1 text-zinc-400 ring-1 ring-zinc-800">
          +{extra.length} more Dubai unit{extra.length > 1 ? 's' : ''} by M{extra[extra.length - 1].month}
        </li>
      )}
    </ol>
  );
}
