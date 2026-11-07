import { BUCKETS, type Bucket } from '../data/roadmap';
import { pct, usdCompact } from '../lib/format';
import { SERIES } from '../lib/palette';

interface SplitBarProps {
  split: Record<Bucket, number>;
  /** When given, segments also show the dollar amount. */
  amounts?: Record<Bucket, number>;
  height?: 'sm' | 'lg';
}

const ORDER: Bucket[] = ['lifestyle', 'vault', 'treasury'];

/** Part-to-whole bar: 2px surface gaps between segments, direct labels plus a legend. */
export function SplitBar({ split, amounts, height = 'lg' }: SplitBarProps) {
  return (
    <div>
      <div className={`flex w-full gap-[2px] overflow-hidden rounded-lg ${height === 'lg' ? 'h-11' : 'h-7'}`}>
        {ORDER.map((b) => (
          <div
            key={b}
            className="flex min-w-0 items-center justify-center first:rounded-l-lg last:rounded-r-lg transition-[flex-grow] duration-500"
            style={{ flexGrow: split[b], flexBasis: 0, background: SERIES[b] }}
            title={`${BUCKETS[b].label}: ${pct(split[b])}${amounts ? ` · ${usdCompact(amounts[b])}` : ''}`}
          >
            <span className="truncate px-1 text-[11px] font-semibold text-zinc-950">
              {pct(split[b])}
              {amounts && height === 'lg' && <span className="hidden font-medium sm:inline"> · {usdCompact(amounts[b])}</span>}
            </span>
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
        {ORDER.map((b) => (
          <li key={b} className="flex items-center gap-1.5">
            <span className="size-2 rounded-[3px]" style={{ background: SERIES[b] }} aria-hidden />
            {BUCKETS[b].short}
          </li>
        ))}
      </ul>
    </div>
  );
}
