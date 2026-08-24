import { cn } from "@/lib/format";

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      title={name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white font-semibold text-brand-600 shadow-sm",
        size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-[12px]",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
