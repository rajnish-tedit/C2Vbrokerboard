"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

type Option<V extends string> = { value: V; label: string; count?: number };

type FilterPillsProps<V extends string> = {
  options: Option<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
};

export function FilterPills<V extends string>({
  options,
  value,
  onChange,
  label,
}: FilterPillsProps<V>) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-navy-900",
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  "num rounded-full px-1.5 text-[10px]",
                  active ? "bg-white/20" : "bg-slate-100 text-slate-500",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type SelectProps<V extends string> = {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: Option<V>[];
  className?: string;
  hideLabel?: boolean;
};

export function Select<V extends string>({
  label,
  value,
  onChange,
  options,
  className,
  hideLabel,
}: SelectProps<V>) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1 text-xs font-medium text-slate-500",
        className,
      )}
    >
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        className="field min-w-[9rem] py-1.5 pr-8"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: SearchInputProps) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field py-1.5 pl-9"
      />
    </label>
  );
}

type DateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
};

export function DateInput({
  label,
  value,
  onChange,
  min,
  max,
}: DateInputProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="field py-1.5"
      />
    </label>
  );
}
