"use client";

import { useState } from "react";

import { formatMonth, formatMonthShort } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";

import { ChartTooltip } from "./ChartTooltip";
import { columnPath, niceMax, useWidth } from "./useWidth";

export type SplitPoint = {
  month: string;
  renewalCents: number;
  newCents: number;
};

const HEIGHT = 220;
const PAD = { top: 16, right: 8, bottom: 28, left: 60 };
export const SPLIT_COLORS = { renewal: "#2a78d6", new: "#eb6834" };

export function RevenueSplitChart({ data }: { data: SplitPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(
    Math.max(...data.map((d) => d.newCents + d.renewalCents), 1),
  );
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.min(38, band * 0.55);
  const scale = (v: number) => (v / max) * plotH;
  const base = PAD.top + plotH;
  const ticks = [0, 0.5, 1].map((t) => t * max);

  return (
    <div>
      <div
        className="mb-2 flex gap-4 text-xs text-slate-600"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: SPLIT_COLORS.renewal }}
          />
          Renewal
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: SPLIT_COLORS.new }}
          />
          New subscription
        </span>
      </div>
      <div
        ref={ref}
        className="relative w-full min-w-0 overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="Eligible subscription revenue by month, split into renewal and new"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={base - scale(t)}
                y2={base - scale(t)}
                stroke="#E5E7EB"
              />
              <text
                x={PAD.left - 8}
                y={base - scale(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-slate-500 text-[11px]"
              >
                {`$${Math.round(t / 100).toLocaleString("en-US")}`}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = PAD.left + band * i + (band - barW) / 2;
            const renewalH = scale(d.renewalCents);
            const newH = scale(d.newCents);
            const gap = newH > 0 && renewalH > 0 ? 2 : 0;
            return (
              <g
                key={d.month}
                opacity={hover === null || hover === i ? 1 : 0.55}
              >
                {renewalH > 0 && (
                  <path
                    d={
                      newH > 0
                        ? `M${x},${base} V${base - renewalH} H${x + barW} V${base} Z`
                        : columnPath(x, base - renewalH, barW, renewalH)
                    }
                    fill={SPLIT_COLORS.renewal}
                  />
                )}
                {newH > 0 && (
                  <path
                    d={columnPath(x, base - renewalH - newH, barW, newH - gap)}
                    fill={SPLIT_COLORS.new}
                  />
                )}
                <text
                  x={PAD.left + band * i + band / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px]"
                >
                  {formatMonthShort(d.month)}
                </text>
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  aria-label={`${formatMonth(d.month)}: renewal ${formatMoney(d.renewalCents)}, new ${formatMoney(d.newCents)}`}
                />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <ChartTooltip
            x={PAD.left + band * hover + band / 2}
            y={base - scale(data[hover].newCents + data[hover].renewalCents)}
            containerWidth={width}
            title={formatMonth(data[hover].month)}
            rows={[
              {
                label: "New",
                value: formatMoney(data[hover].newCents),
                swatch: SPLIT_COLORS.new,
              },
              {
                label: "Renewal",
                value: formatMoney(data[hover].renewalCents),
                swatch: SPLIT_COLORS.renewal,
              },
              {
                label: "Total eligible",
                value: formatMoney(
                  data[hover].newCents + data[hover].renewalCents,
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
