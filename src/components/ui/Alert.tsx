import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/format";

type Props = {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

const TONES = {
  error: { box: "border-alert-500/25 bg-alert-500/[0.08] text-alert-600", Icon: AlertTriangle },
  success: { box: "border-ok-500/25 bg-ok-500/[0.08] text-ok-600", Icon: CheckCircle2 },
  info: { box: "border-brand-200 bg-brand-50 text-brand-700", Icon: Info },
} as const;

export function Alert({ tone = "info", children, className }: Props) {
  const { box, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[13.5px]", box, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="leading-snug">{children}</span>
    </div>
  );
}
