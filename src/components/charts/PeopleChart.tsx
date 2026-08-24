"use client";

import type { PersonBreakdown } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { ChartFrame, EmptyChart } from "./ChartFrame";

type Props = { data: PersonBreakdown[]; currency: string; groupSize: number };

const BAR_COLORS = ["#6366f1", "#10b981", "#f97316", "#a855f7", "#0ea5e9", "#ec4899"];

export function PeopleChart({ data, currency, groupSize }: Props) {
  const fairShare = 100 / Math.max(1, groupSize);

  return (
    <ChartFrame
      title="Quien ha pagado"
      subtitle={`Reparto parejo: ${fairShare.toFixed(0)}% por persona`}
    >
      {data.length === 0 ? (
        <EmptyChart message="Cuando registres gastos veras como se reparte el pago entre el grupo." />
      ) : (
        <ul className="space-y-3.5">
          {data.map((person, index) => {
            const color = BAR_COLORS[index % BAR_COLORS.length];
            const overFair = person.share > fairShare * 1.2;
            return (
              <li key={person.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="truncate font-medium text-slate-200">{person.name}</span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="font-semibold text-white">{formatMoney(person.total, currency)}</span>
                    <span className={overFair ? "text-[12px] text-amber-300" : "text-[12px] text-slate-500"}>
                      {person.share.toFixed(0)}%
                    </span>
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(person.share, 2)}%`, backgroundColor: color }}
                  />
                  {groupSize > 1 && (
                    <span
                      className="absolute top-0 h-full w-px bg-white/40"
                      style={{ left: `${fairShare}%` }}
                      aria-hidden
                    />
                  )}
                </div>
                <p className="mt-1 text-[11.5px] text-slate-500">
                  {person.count} {person.count === 1 ? "gasto registrado" : "gastos registrados"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </ChartFrame>
  );
}
