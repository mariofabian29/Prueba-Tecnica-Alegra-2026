"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/shell/Logo";

const LINKS = ["Inicio", "Presupuesto", "Gastos"];

export function LandingNav({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <header className="brand-gradient sticky top-0 z-40">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-6 px-6">
        <div className="flex items-center gap-7">
          <Logo href="/" />
          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((link) => (
              <a
                key={link}
                href={link === "Inicio" ? "#inicio" : link === "Presupuesto" ? "#funciones" : "#únete"}
                className="text-[14px] font-semibold text-white/95 transition-opacity hover:opacity-80"
              >
                {link}
              </a>
            ))}
          </nav>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(query.trim() ? `/viajes?q=${encodeURIComponent(query.trim())}` : "/viajes");
          }}
          className="mx-auto hidden w-full max-w-[330px] sm:block"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Explora por destino"
            aria-label="Explora por destino"
            className="h-11 w-full rounded-pill border-0 bg-white/95 px-5 text-[14px] text-ink-800 outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-white/70"
          />
        </form>

        <div className="ml-auto flex items-center gap-5">
          {authenticated ? (
            <Link
              href="/viajes"
              className="rounded-pill bg-white px-6 py-2.5 text-[14px] font-bold text-brand-600 transition-transform hover:scale-[1.02]"
            >
              Mis viajes
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-[13.5px] font-semibold text-white/95 transition-opacity hover:opacity-80 sm:block"
              >
                Inicia sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-pill bg-white px-6 py-2.5 text-[14px] font-bold text-brand-600 transition-transform hover:scale-[1.02]"
              >
                Regístrate
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
