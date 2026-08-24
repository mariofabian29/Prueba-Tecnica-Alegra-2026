"use client";

import { Logo } from "./Logo";
import { FooterBar } from "./FooterBar";
import { Sidebar, type SidebarSection } from "./Sidebar";

/** Layout con barra de marca, navegación lateral y franja inferior. */
export function AppShell({
  userName,
  active,
  budgetHref,
  onAssistant,
  children,
}: {
  userName: string;
  active: SidebarSection;
  budgetHref?: string;
  onAssistant?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="brand-gradient sticky top-0 z-40">
        <div className="flex h-[72px] items-center px-6">
          <Logo href="/viajes" />
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar userName={userName} active={active} budgetHref={budgetHref} onAssistant={onAssistant} />
        <main className="min-w-0 flex-1 bg-cream-50">{children}</main>
      </div>

      <FooterBar />
    </div>
  );
}
