"use client";

import { AlertTriangle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TripAnalytics } from "@/lib/analytics";
import { formatMoney, cn } from "@/lib/format";

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
  const over = a.totalSpent > a.budget;

  return (
    <section
      className={cn(
        "rounded-[18px] p-6 transition-colors",
        over ? "bg-alert-500/[0.09] ring-1 ring-alert-500/35" : "bg-cream-200"
      )}
    >
      <h3 className="text-[13px] font-semibold text-ink-500">Gasto por categoría</h3>

      {over && (
        <p className="mt-2 flex items-center gap-1.5 rounded-pill bg-alert-500/15 px-3 py-1 text-[11.5px] font-semibold text-alert-600">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          Excedido en {formatMoney(a.totalSpent - a.budget, a.currency)}
        </p>
      )}

      <div className={cn("relative mx-auto h-[190px] w-[190px]", over ? "mt-2" : "mt-4")}>
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
              stroke={over ? "#faeceb" : "#f7f0e9"}
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
          <span className={cn("text-[18px] font-bold", over ? "text-alert-600" : "text-ink-900")}>
            {pctLabel}%
          </span>
          <span className="text-[11px] text-ink-400">gastado</span>
        </div>
      </div>
    </section>
  );
}
