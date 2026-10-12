"use client";

import { useState } from "react";

import { formatMonth, formatMonthShort } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";

import { ChartTooltip } from "./ChartTooltip";
import { columnPath, niceMax, useWidth } from "./useWidth";

export type TrendPoint = {
  month: string;
  valueCents: number;
  inProgress?: boolean;
  note?: string;
};

const HEIGHT = 220;
const PAD = { top: 24, right: 8, bottom: 28, left: 56 };
const SERIES = "#2a78d6";

export function CommissionTrendChart({
  data,
  label,
}: {
  data: TrendPoint[];
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => d.valueCents), 1));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.min(24 * 1.6, band * 0.55);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const lastIndex = data.length - 1;

  return (
    <div
      ref={ref}
      className="relative w-full min-w-0 overflow-visible"
      onMouseLeave={() => setHover(null)}
    >
      <svg width={width} height={HEIGHT} role="img" aria-label={label}>
        <defs>
          <pattern
            id="in-progress"
            width="6"
            height="6"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="#cde2fb" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={SERIES} strokeWidth="2" />
          </pattern>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
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
          const h = (d.valueCents / max) * plotH;
          return (
            <g key={d.month}>
              <path
                d={columnPath(x, y(d.valueCents), barW, h)}
                fill={d.inProgress ? "url(#in-progress)" : SERIES}
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
              <text
                x={PAD.left + band * i + band / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-slate-500 text-[11px]"
              >
                {formatMonthShort(d.month)}
              </text>
              {(i === lastIndex || i === lastIndex - 1) && (
                <text
                  x={PAD.left + band * i + band / 2}
                  y={y(d.valueCents) - 6}
                  textAnchor="middle"
                  className="num fill-navy-950 text-[11px] font-semibold"
                >
                  {formatMoney(d.valueCents).replace(/\.00$/, "")}
                </text>
              )}
              <rect
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${formatMonth(d.month)}: ${formatMoney(d.valueCents)}${d.inProgress ? " (in progress)" : ""}`}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <ChartTooltip
          x={PAD.left + band * hover + band / 2}
          y={y(data[hover].valueCents)}
          containerWidth={width}
          title={formatMonth(data[hover].month)}
          rows={[
            {
              label: data[hover].inProgress
                ? "Net commission to date"
                : "Net commission",
              value: formatMoney(data[hover].valueCents),
              swatch: SERIES,
            },
            ...(data[hover].note
              ? [{ label: data[hover].note!, value: "" }]
              : []),
          ]}
        />
      )}
    </div>
  );
}
