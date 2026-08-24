"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "brand-gradient text-white shadow-md shadow-brand-500/25 hover:brightness-105",
  secondary: "bg-cream-200 text-ink-800 hover:bg-cream-300 border border-cream-300",
  outline: "bg-white text-brand-600 border border-brand-200 hover:border-brand-400 hover:bg-brand-50",
  ghost: "text-ink-500 hover:text-brand-600 hover:bg-brand-50 border border-transparent",
  danger: "bg-alert-500 text-white hover:bg-alert-600 shadow-md shadow-alert-500/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-10 px-5 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-pill font-semibold transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
