"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdown } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { ChartFrame, ChartTooltip, EmptyChart } from "./ChartFrame";

type Props = { data: CategoryBreakdown[]; currency: string; total: number };

export function CategoryDonut({ data, currency, total }: Props) {
  return (
    <ChartFrame title="Gasto por categoria" subtitle="Donde se va tu presupuesto">
      {data.length === 0 ? (
        <EmptyChart message="Registra tu primer gasto para ver el reparto por categoria." />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-[190px] w-full sm:w-[190px] sm:shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive
                  animationDuration={450}
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as CategoryBreakdown;
                    return (
                      <ChartTooltip
                        rows={[
                          { name: item.label, value: formatMoney(item.total, currency), color: item.color },
                          { name: "Participacion", value: `${item.share.toFixed(1)}%` },
                          { name: "Registros", value: String(item.count) },
                        ]}
                      />
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">Total</span>
              <span className="text-[15px] font-bold text-white">{formatMoney(total, currency)}</span>
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-1.5">
            {data.map((item) => (
              <li key={item.category} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                  <span className="truncate text-slate-300">
                    {item.emoji} {item.label}
                  </span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="font-semibold text-white">{formatMoney(item.total, currency)}</span>
                  <span className="w-10 text-right text-[12px] text-slate-500">{item.share.toFixed(0)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartFrame>
  );
}
