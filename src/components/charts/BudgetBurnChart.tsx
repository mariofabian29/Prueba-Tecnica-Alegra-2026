"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/analytics";
import { formatCompact, formatMoney } from "@/lib/format";
import { ChartFrame, ChartTooltip, EmptyChart } from "./ChartFrame";

type Props = { data: DailyPoint[]; currency: string; budget: number; hasExpenses: boolean };

export function BudgetBurnChart({ data, currency, budget, hasExpenses }: Props) {
  // Los dias futuros no tienen acumulado real: se cortan para no dibujar una linea plana.
  const series = data.map((d) => ({ ...d, cumulative: d.isFuture ? null : d.cumulative }));

  return (
    <ChartFrame
      title="Presupuesto consumido"
      subtitle="Gasto acumulado real contra el ritmo planificado"
      action={<Legend />}
    >
      {!hasExpenses ? (
        <EmptyChart message="Cuando registres gastos veras aqui si vas por encima o por debajo del ritmo planificado." />
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={22}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={62}
                tickFormatter={(v: number) => formatCompact(v, currency)}
              />

              <ReferenceLine
                y={budget}
                stroke="#fb7185"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: "Presupuesto",
                  position: "insideTopRight",
                  fill: "#fb7185",
                  fontSize: 10,
                  offset: 6,
                }}
              />

              <Tooltip
                cursor={{ stroke: "rgba(148,163,184,0.25)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as DailyPoint;
                  return (
                    <ChartTooltip
                      label={String(label)}
                      rows={[
                        { name: "Gasto del dia", value: formatMoney(point.spent, currency) },
                        { name: "Acumulado", value: formatMoney(point.cumulative, currency), color: "#818cf8" },
                        { name: "Plan", value: formatMoney(point.idealCumulative, currency), color: "#64748b" },
                      ]}
                    />
                  );
                }}
              />

              <Line
                type="monotone"
                dataKey="idealCumulative"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#818cf8"
                strokeWidth={2.5}
                fill="url(#burnFill)"
                connectNulls={false}
                dot={false}
                activeDot={{ r: 4, fill: "#818cf8", stroke: "#0b1120", strokeWidth: 2 }}
                animationDuration={450}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11.5px] text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-brand-400" aria-hidden />
        Real
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 rounded-full bg-slate-500" aria-hidden />
        Plan
      </span>
    </div>
  );
}
