"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";

/**
 * Barra superior con gradiente de marca.
 * Los enlaces "Guías" y "Hoteles" son parte del diseño pero aún no tienen
 * pantalla propia, así que se muestran sin comportamiento.
 */
export function TopNav({
  userName,
  searchPlaceholder = "Introduce lugar",
  links = ["Inicio", "Guías", "Hoteles"],
}: {
  userName: string;
  searchPlaceholder?: string;
  links?: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <header className="brand-gradient sticky top-0 z-40">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-6 px-6">
        <div className="flex items-center gap-7">
          <Logo href="/viajes" />
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) =>
              link === "Inicio" ? (
                <button
                  key={link}
                  type="button"
                  onClick={() => router.push("/viajes")}
                  className="text-[14px] font-semibold text-white/95 transition-opacity hover:opacity-80"
                >
                  {link}
                </button>
              ) : (
                <span
                  key={link}
                  className="cursor-default text-[14px] font-semibold text-white/70"
                  title="Sección del diseño todavia no implementada"
                >
                  {link}
                </span>
              )
            )}
          </nav>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(query.trim() ? `/viajes?q=${encodeURIComponent(query.trim())}` : "/viajes");
          }}
          className="mx-auto hidden w-full max-w-[320px] sm:block"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Buscar por destino"
            className="h-11 w-full rounded-pill border-0 bg-white/95 px-5 text-[14px] text-ink-800 outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-white/70"
          />
        </form>

        <div className="ml-auto flex items-center">
          <Avatar name={userName} />
        </div>
      </div>
    </header>
  );
}
