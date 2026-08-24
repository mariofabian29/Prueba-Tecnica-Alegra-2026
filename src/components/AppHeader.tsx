"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AppHeader({ userName, showNewTrip = true }: { userName: string; showNewTrip?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/viajes" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20 ring-1 ring-brand-500/30">
            <Plane className="h-4.5 w-4.5 text-brand-300" aria-hidden />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">Viajero</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {showNewTrip && (
            <Link href="/nuevo-viaje">
              <Button size="sm">
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Nuevo viaje</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1 pl-1 pr-1">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600/30 text-[11px] font-bold text-brand-200"
              title={userName}
            >
              {initials}
            </span>
            <span className="hidden pr-1 text-[13px] font-medium text-slate-300 sm:inline">{userName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              loading={loading}
              aria-label="Cerrar sesion"
              className="!px-2"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
