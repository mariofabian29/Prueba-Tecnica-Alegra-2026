import Link from "next/link";
import { cn } from "@/lib/format";

/** Marca Tripflow: circulo blanco con el glifo rosa y el wordmark en minusculas. */
export function Logo({
  href = "/",
  className,
  tone = "light",
}: {
  href?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <defs>
            <linearGradient id="tf-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ee5a9b" />
              <stop offset="100%" stopColor="#c21f6d" />
            </linearGradient>
          </defs>
          <path
            d="M4.6 5.2h14.8c1 0 1.6 1.1 1.1 1.9l-6.6 10.4a2.3 2.3 0 0 1-3.8 0L3.5 7.1c-.5-.8.1-1.9 1.1-1.9Z"
            fill="url(#tf-mark)"
          />
          <circle cx="12" cy="9.4" r="1.7" fill="#fff" opacity=".9" />
        </svg>
      </span>
      <span
        className={cn(
          "text-[19px] font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-ink-900"
        )}
      >
        tripflow
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-85">
      {content}
    </Link>
  ) : (
    content
  );
}
