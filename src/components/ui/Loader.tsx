import { cn } from "@/lib/format";

/** Loader de marca: disco rosa con el glifo y un arco girando alrededor. */
export function Loader({
  label,
  className,
  size = "md",
}: {
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? 44 : 68;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)} role="status" aria-live="polite">
      <span className="relative inline-flex" style={{ width: px, height: px }}>
        <span className="absolute inset-0 rounded-full bg-brand-200/70" />
        <span
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, transparent 250deg, #d6247a 340deg, transparent 360deg)",
            animationDuration: "1.1s",
          }}
        />
        <span className="absolute inset-[14%] flex items-center justify-center rounded-full brand-gradient shadow-md">
          <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" aria-hidden>
            <path
              d="M4.6 5.2h14.8c1 0 1.6 1.1 1.1 1.9l-6.6 10.4a2.3 2.3 0 0 1-3.8 0L3.5 7.1c-.5-.8.1-1.9 1.1-1.9Z"
              fill="#fff"
              opacity=".95"
            />
          </svg>
        </span>
      </span>
      {label && <p className="text-[15px] font-medium text-ink-800">{label}</p>}
      <span className="sr-only">Cargando</span>
    </div>
  );
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream-100 px-6">
      <Loader label={label} />
    </div>
  );
}
