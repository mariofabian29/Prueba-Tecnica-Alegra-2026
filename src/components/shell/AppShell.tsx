"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { FooterBar } from "./FooterBar";
import { Sidebar, SidebarContent, type SidebarSection } from "./Sidebar";

type Props = {
  userName: string;
  active: SidebarSection;
  budgetHref?: string;
  onAssistant?: () => void;
  children: React.ReactNode;
};

/** Layout con barra de marca, navegación lateral y franja inferior. */
export function AppShell({ userName, active, budgetHref, onAssistant, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  // En móvil el menú se superpone: bloqueamos el desplazamiento del fondo.
  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const nav = { userName, active, budgetHref, onAssistant };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="brand-gradient sticky top-0 z-40">
        <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir el menú"
            aria-expanded={menuOpen}
            className="-ml-1 rounded-lg p-2 text-white transition-opacity hover:opacity-80 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <Logo href="/viajes" />
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar {...nav} />
        <main className="min-w-0 flex-1 bg-cream-50">{children}</main>
      </div>

      {/* --------------------------- Menú en móvil --------------------------- */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="animate-fade-up absolute inset-y-0 left-0 w-[276px] max-w-[85vw] bg-cream-200 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar el menú"
              className="absolute right-3 top-4 rounded-lg p-2 text-ink-500 transition-colors hover:text-ink-900"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <SidebarContent {...nav} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <FooterBar />
    </div>
  );
}
