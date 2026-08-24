"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useTrips } from "@/hooks/useTrip";
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
  /** Viaje abierto ahora mismo, para resaltarlo dentro de "Presupuesto". */
  activeTripId?: string;
  onAssistant?: () => void;
  /** Se invoca al pulsar cualquier destino, para cerrar el menú en móvil. */
  onNavigate?: () => void;
};

const SECONDARY: { key: SidebarSection; label: string }[] = [
  { key: "profile", label: "Mi perfil" },
  { key: "notifications", label: "Notificaciones" },
  { key: "settings", label: "Ajustes" },
];

/**
 * Contenido de la navegación privada.
 * "Mis viajes" navega y "Presupuesto" despliega los viajes vigentes; el resto
 * son secciones del diseño que todavía no tienen pantalla.
 */
export function SidebarContent({ userName, active, activeTripId, onAssistant, onNavigate }: Props) {
  const { trips, isLoading } = useTrips();
  const insideTrip = active === "budget" || active === "assistant";
  const [open, setOpen] = useState(insideTrip);

  // Al entrar en un viaje, el desplegable se abre para mostrar dónde estás.
  useEffect(() => {
    if (insideTrip) setOpen(true);
  }, [insideTrip]);

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
          <Item href="/viajes" active={active === "trips"} onNavigate={onNavigate}>
            Mis viajes
          </Item>

          {/* ---------------------- Presupuesto (desplegable) ------------------ */}
          <div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-presupuesto"
              className={cn(
                "flex w-full items-center justify-between rounded-pill px-4 py-2.5 text-[14px] font-semibold transition-colors",
                insideTrip
                  ? "brand-gradient text-white shadow-sm"
                  : "text-ink-500 hover:bg-cream-300 hover:text-ink-800"
              )}
            >
              Presupuesto
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>

            {open && (
              <ul id="menu-presupuesto" className="mt-1 space-y-0.5 pl-3">
                {isLoading && trips.length === 0 ? (
                  <li className="px-4 py-2 text-[13px] text-ink-400">Cargando viajes...</li>
                ) : trips.length === 0 ? (
                  <li className="px-4 py-2 text-[13px] text-ink-400">
                    Aún no tienes viajes.{" "}
                    <Link
                      href="/nuevo-viaje"
                      onClick={onNavigate}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Crea uno
                    </Link>
                  </li>
                ) : (
                  trips.map((trip) => {
                    const isCurrent = trip.id === activeTripId;
                    return (
                      <li key={trip.id}>
                        <Link
                          href={`/viajes/${trip.id}`}
                          onClick={onNavigate}
                          aria-current={isCurrent ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2 rounded-pill px-4 py-2 text-[13.5px] transition-colors",
                            isCurrent
                              ? "bg-brand-50 font-semibold text-brand-700"
                              : "text-ink-500 hover:bg-cream-300 hover:text-ink-800"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              isCurrent ? "bg-brand-600" : "bg-cream-400"
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{trip.destination}</span>
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>

          {SECONDARY.map((item) => (
            <span
              key={item.key}
              className="block cursor-default rounded-pill px-4 py-2.5 text-[14px] font-semibold text-ink-400"
              title="Sección del diseño todavía no implementada"
            >
              {item.label}
            </span>
          ))}
        </nav>
      </div>

      <LogoutButton userName={userName} />
    </div>
  );
}

function Item({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const classes = cn(
    "block rounded-pill px-4 py-2.5 text-[14px] font-semibold transition-colors",
    active ? "brand-gradient text-white shadow-sm" : "text-ink-500 hover:bg-cream-300 hover:text-ink-800"
  );

  return active ? (
    <span className={classes} aria-current="page">
      {children}
    </span>
  ) : (
    <Link href={href} className={classes} onClick={onNavigate}>
      {children}
    </Link>
  );
}

function LogoutButton({ userName }: { userName: string }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // Navegación dura: descarta la caché del router para que no quede
    // ninguna pantalla privada renderizada tras cerrar sesión.
    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loggingOut}
      className="flex items-center gap-3 rounded-pill px-1 py-1 text-[14px] text-ink-500 transition-colors hover:text-brand-600 disabled:opacity-50"
    >
      <Avatar name={userName} size="sm" />
      {loggingOut ? "Cerrando..." : "Cerrar sesión"}
    </button>
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
