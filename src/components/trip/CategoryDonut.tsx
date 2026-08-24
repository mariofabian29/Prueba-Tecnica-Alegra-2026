"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

/**
 * Anillo de gasto por grupo. El tramo gris representa el presupuesto que
 * todavia no se ha usado, de modo que el anillo siempre esta completo.
 */
export function CategoryDonut({ a }: { a: TripAnalytics }) {
  const spent = a.byBucket.filter((b) => b.total > 0);
  const unused = Math.max(0, a.budget - a.totalSpent);

  const data = [
    ...spent.map((b) => ({ name: b.label, value: b.total, color: b.color })),
    ...(unused > 0 ? [{ name: "Sin usar", value: unused, color: "#d8d2c9" }] : []),
  ];

  const pctLabel = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(
    Math.min(999, a.usedPct)
  );

  return (
    <section className="rounded-[18px] bg-cream-200 p-6">
      <h3 className="text-[13px] font-semibold text-ink-500">Gasto por categoria</h3>

      <div className="relative mx-auto mt-4 h-[190px] w-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length > 0 ? data : [{ name: "Sin usar", value: 1, color: "#d8d2c9" }]}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              strokeWidth={4}
              stroke="#f7f0e9"
              isAnimationActive
              animationDuration={500}
            >
              {(data.length > 0 ? data : [{ color: "#d8d2c9" }]).map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            {a.totalSpent > 0 && (
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as { name: string; value: number };
                  return (
                    <div className="rounded-xl border border-cream-300 bg-white px-3 py-2 shadow-lg">
                      <p className="text-[12px] font-semibold text-ink-900">{item.name}</p>
                      <p className="text-[12px] text-ink-500">{formatMoney(item.value, a.currency)}</p>
                    </div>
                  );
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-bold text-ink-900">{pctLabel}%</span>
          <span className="text-[11px] text-ink-400">gastado</span>
        </div>
      </div>
    </section>
  );
}
