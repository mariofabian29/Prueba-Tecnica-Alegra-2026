"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/lib/analytics";
import { formatCompact, formatMoney } from "@/lib/format";
import { ChartFrame, ChartTooltip, EmptyChart } from "./ChartFrame";

type Props = {
  data: DailyPoint[];
  currency: string;
  dailyTarget: number;
  hasExpenses: boolean;
};

export function DailySpendChart({ data, currency, dailyTarget, hasExpenses }: Props) {
  const series = data.filter((d) => !d.isFuture);

  return (
    <ChartFrame
      title="Gasto diario"
      subtitle={`Meta diaria: ${formatMoney(dailyTarget, currency)}`}
    >
      {!hasExpenses || series.length === 0 ? (
        <EmptyChart message="Aqui veras cuanto gastas cada dia y si superas tu meta diaria." />
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={16}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={62}
                tickFormatter={(v: number) => formatCompact(v, currency)}
              />

              <ReferenceLine y={dailyTarget} stroke="#34d399" strokeDasharray="5 4" strokeWidth={1.5} />

              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as DailyPoint;
                  const delta = point.spent - dailyTarget;
                  return (
                    <ChartTooltip
                      label={String(label)}
                      rows={[
                        { name: "Gastado", value: formatMoney(point.spent, currency) },
                        {
                          name: delta > 0 ? "Sobre la meta" : "Bajo la meta",
                          value: formatMoney(Math.abs(delta), currency),
                          color: delta > 0 ? "#fb7185" : "#34d399",
                        },
                      ]}
                    />
                  );
                }}
              />

              <Bar dataKey="spent" radius={[5, 5, 0, 0]} maxBarSize={38} animationDuration={450}>
                {series.map((point) => (
                  <Cell key={point.date} fill={point.spent > dailyTarget ? "#fb7185" : "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}
