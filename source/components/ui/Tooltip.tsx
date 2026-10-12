"use client";

import { Info } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

// Rendered through a portal so it is never clipped by scrolling table containers.
export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{
    x: number;
    y: number;
    below: boolean;
  } | null>(null);

  const show = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const below = rect.top < 120;
    setPos({
      x: rect.left + rect.width / 2,
      y: below ? rect.bottom + 8 : rect.top - 8,
      below,
    });
  }, []);
  const hide = useCallback(() => setPos(null), []);

  return (
    <span
      ref={ref}
      className={cn("inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={pos ? id : undefined}
    >
      {children}
      {pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{
              left: Math.min(Math.max(pos.x, 150), window.innerWidth - 150),
              top: pos.y,
            }}
            className={cn(
              "pointer-events-none fixed z-[100] w-max max-w-[280px] -translate-x-1/2 rounded-lg bg-navy-950 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-overlay",
              !pos.below && "-translate-y-full",
            )}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}

export function InfoTip({
  content,
  label = "More information",
}: {
  content: React.ReactNode;
  label?: string;
}) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-navy-700"
        onClick={(e) => e.stopPropagation()}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
