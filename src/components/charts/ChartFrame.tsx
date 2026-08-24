"use client";

import { cn } from "@/lib/format";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

export function ChartFrame({ title, subtitle, action, className, bodyClassName, children }: Props) {
  return (
    <section className={cn("card card-pad flex flex-col", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-white/10 px-6 text-center">
      <p className="max-w-xs text-[13px] leading-relaxed text-slate-500">{message}</p>
    </div>
  );
}

export function ChartTooltip({
  label,
  rows,
}: {
  label?: string;
  rows: { name: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-ink-900/95 px-3 py-2 shadow-xl backdrop-blur">
      {label && <p className="mb-1.5 text-[12px] font-semibold text-white">{label}</p>}
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              {row.color && (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} aria-hidden />
              )}
              {row.name}
            </span>
            <span className="font-semibold text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
