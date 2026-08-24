import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/format";

type Props = {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

const TONES = {
  error: { box: "border-rose-500/30 bg-rose-500/10 text-rose-200", Icon: AlertTriangle },
  success: { box: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200", Icon: CheckCircle2 },
  info: { box: "border-brand-500/30 bg-brand-500/10 text-brand-300", Icon: Info },
} as const;

export function Alert({ tone = "info", children, className }: Props) {
  const { box, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13.5px]", box, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="leading-snug">{children}</span>
    </div>
  );
}
