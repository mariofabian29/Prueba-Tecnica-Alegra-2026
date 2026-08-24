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
import type { DailyPoint, TripAnalytics } from "@/lib/analytics";
import { formatCompact, formatMoney } from "@/lib/format";

/**
 * Evolucion del gasto acumulado frente al ritmo planificado.
 * Complementa el anillo por categoria: muestra si el desvio crece o se corrige.
 */
export function SpendTrend({ a }: { a: TripAnalytics }) {
  const series = a.daily.map((d) => ({ ...d, cumulative: d.isFuture ? null : d.cumulative }));

  return (
    <section className="rounded-[18px] bg-cream-200 p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink-500">Evolucion del gasto</h3>
          <p className="mt-0.5 text-[12px] text-ink-400">
            Acumulado real frente al ritmo planificado de {formatMoney(a.plannedDailyBudget, a.currency)} por dia
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-brand-600" aria-hidden />
            Real
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-ink-300" aria-hidden />
            Plan
          </span>
        </div>
      </header>

      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e94e8f" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e94e8f" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,23,29,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#a89299", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={22}
            />
            <YAxis
              tick={{ fill: "#a89299", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatCompact(v, a.currency)}
            />

            <ReferenceLine
              y={a.budget}
              stroke="#e05252"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: "Presupuesto",
                position: "insideTopRight",
                fill: "#e05252",
                fontSize: 10,
                offset: 6,
              }}
            />

            <Tooltip
              cursor={{ stroke: "rgba(42,23,29,0.18)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as DailyPoint;
                return (
                  <div className="rounded-xl border border-cream-300 bg-white px-3 py-2 shadow-lg">
                    <p className="mb-1 text-[12px] font-semibold text-ink-900">{String(label)}</p>
                    <Row name="Gasto del dia" value={formatMoney(point.spent, a.currency)} />
                    <Row name="Acumulado" value={formatMoney(point.cumulative, a.currency)} />
                    <Row name="Plan" value={formatMoney(point.idealCumulative, a.currency)} />
                  </div>
                );
              }}
            />

            <Line
              type="monotone"
              dataKey="idealCumulative"
              stroke="#c4b2b7"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#d6247a"
              strokeWidth={2.5}
              fill="url(#trendFill)"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, fill: "#d6247a", stroke: "#fff", strokeWidth: 2 }}
              animationDuration={450}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[12px]">
      <span className="text-ink-500">{name}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
