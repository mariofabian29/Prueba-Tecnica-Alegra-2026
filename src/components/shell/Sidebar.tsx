"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/format";

export type SidebarSection =
  | "trips"
  | "budget"
  | "assistant"
  | "profile"
  | "notifications"
  | "settings";

type Props = {
  userName: string;
  active: SidebarSection;
  budgetHref?: string;
  onAssistant?: () => void;
  /** Se invoca al pulsar cualquier destino, para cerrar el menú en móvil. */
  onNavigate?: () => void;
};

/**
 * Contenido de la navegación privada.
 * "Mis viajes" y "Presupuesto" navegan; el resto son secciones del diseño que
 * todavía no tienen pantalla, así que se muestran sin comportamiento.
 */
export function SidebarContent({ userName, active, budgetHref, onAssistant, onNavigate }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const items: { key: SidebarSection; label: string; href?: string }[] = [
    { key: "trips", label: "Mis viajes", href: "/viajes" },
    { key: "budget", label: "Presupuesto", href: budgetHref },
    { key: "profile", label: "Mi perfil" },
    { key: "notifications", label: "Notificaciones" },
    { key: "settings", label: "Ajustes" },
  ];

  return (
    <div className="flex h-full flex-col justify-between px-4 py-6">
      <div>
        {/* El asistente trabaja siempre sobre un viaje concreto: fuera de uno
            no se muestra, para no ofrecer una acción sin destino. */}
        {onAssistant ? (
          <button
            type="button"
            onClick={() => {
              onAssistant();
              onNavigate?.();
            }}
            className={cn(
              "brand-gradient mb-8 inline-flex h-11 items-center gap-2 rounded-pill px-6 text-[14px] font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-105 active:scale-[0.98]",
              active === "assistant" && "ring-2 ring-brand-300 ring-offset-2 ring-offset-cream-200"
            )}
            title="Abrir el asistente de IA"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Asistente IA
          </button>
        ) : (
          <div className="mb-8 h-11" aria-hidden />
        )}

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = item.key === active;
            const classes = cn(
              "block rounded-pill px-4 py-2.5 text-[14px] font-semibold transition-colors",
              isActive
                ? "brand-gradient text-white shadow-sm"
                : item.href
                  ? "text-ink-500 hover:bg-cream-300 hover:text-ink-800"
                  : "cursor-default text-ink-400"
            );

            return item.href && !isActive ? (
              <Link key={item.key} href={item.href} className={classes} onClick={onNavigate}>
                {item.label}
              </Link>
            ) : (
              <span
                key={item.key}
                className={classes}
                aria-current={isActive ? "page" : undefined}
                title={!item.href ? "Sección del diseño todavía no implementada" : undefined}
              >
                {item.label}
              </span>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex items-center gap-3 rounded-pill px-1 py-1 text-[14px] text-ink-500 transition-colors hover:text-brand-600 disabled:opacity-50"
      >
        <Avatar name={userName} size="sm" />
        {loggingOut ? "Cerrando..." : "Cerrar sesión"}
      </button>
    </div>
  );
}

/** Navegación lateral fija, visible a partir de pantallas grandes. */
export function Sidebar(props: Props) {
  return (
    <aside className="hidden w-[252px] shrink-0 bg-cream-200 lg:block">
      <SidebarContent {...props} />
    </aside>
  );
}
