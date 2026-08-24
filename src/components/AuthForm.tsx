"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Mode = "login" | "register";

const SOCIAL = [
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="#1877F2" />
        <path
          d="M15.4 12.5h-2.1V19h-2.7v-6.5H9.1v-2.3h1.5V8.6c0-1.9 1.1-3 2.9-3 .8 0 1.6.1 1.6.1v1.8h-.9c-.9 0-1.2.5-1.2 1.1v1.6h2.1l-.3 2.3Z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" fill="#4285F4" />
        <path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853" />
        <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" fill="#FBBC05" />
        <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M16.3 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7c1.2 0 2-1.1 2.7-2.2.8-1.2 1.2-2.4 1.2-2.5 0 0-2.2-.9-2.2-3.5ZM14.1 6.2c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z"
          fill="#0b0b0b"
        />
      </svg>
    ),
  },
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegister = mode === "register";

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    setFields({});

    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? values : { email: values.email, password: values.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos completar la operacion");
        setFields(data.fields ?? {});
        return;
      }

      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/viajes");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[560px] animate-fade-up rounded-[20px] border border-cream-300 bg-cream-50 px-8 py-10 sm:px-14">
      <h1 className="text-center text-[22px] font-bold tracking-tight text-ink-900">
        {isRegister ? "Crea tu cuenta para empezar" : "Inicia sesion para ver esta pagina"}
      </h1>

      {/* ------------------------------ Accesos sociales ----------------------- */}
      <div className="mt-7 space-y-3">
        {SOCIAL.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() =>
              setNotice(
                `El acceso con ${provider.label} no esta habilitado en esta version. Usa tu correo y contrasena.`
              )
            }
            className="mx-auto flex w-full max-w-[290px] items-center justify-center gap-2.5 rounded-pill border border-brand-200 bg-white px-6 py-2.5 text-[13.5px] font-bold text-ink-900 transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            {provider.icon}
            {isRegister ? "Registrate" : "Inicia sesion"} con {provider.label}
          </button>
        ))}
      </div>

      {notice && (
        <Alert tone="info" className="mt-4">
          {notice}
        </Alert>
      )}

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-cream-300" aria-hidden />
        <span className="text-[13px] text-ink-400">o</span>
        <span className="h-px flex-1 bg-cream-300" aria-hidden />
      </div>

      {/* -------------------------------- Formulario --------------------------- */}
      <form onSubmit={onSubmit} className="space-y-3">
        {error && <Alert tone="error">{error}</Alert>}

        {isRegister && (
          <div>
            <input
              name="name"
              autoComplete="name"
              placeholder="Nombre"
              aria-label="Nombre"
              value={values.name}
              onChange={set("name")}
              required
              className="input-base"
            />
            {fields.name && <p className="mt-1 text-[12.5px] text-alert-500">{fields.name}</p>}
          </div>
        )}

        <div>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Correo electronico"
            aria-label="Correo electronico"
            value={values.email}
            onChange={set("email")}
            required
            className="input-base"
          />
          {fields.email && <p className="mt-1 text-[12.5px] text-alert-500">{fields.email}</p>}
        </div>

        <div>
          <input
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Contrasena"
            aria-label="Contrasena"
            value={values.password}
            onChange={set("password")}
            required
            className="input-base"
          />
          {fields.password && <p className="mt-1 text-[12.5px] text-alert-500">{fields.password}</p>}
        </div>

        {!isRegister && (
          <p className="text-center">
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "La recuperacion de contrasena requiere un servicio de correo y no esta habilitada en esta version."
                )
              }
              className="text-[12.5px] font-bold text-ink-500 underline underline-offset-2 transition-colors hover:text-brand-600"
            >
              ¿Olvidaste tu contrasena?
            </button>
          </p>
        )}

        <div className="flex justify-center pt-2">
          <Button type="submit" size="lg" loading={loading} className="min-w-[160px]">
            {isRegister ? "Registrate" : "Inicia sesion"}
          </Button>
        </div>
      </form>

      <p className="mt-5 text-center text-[13.5px] text-ink-700">
        {isRegister ? "¿Ya tienes una cuenta? " : "¿Aun no tienes una cuenta? "}
        <Link
          href={isRegister ? "/login" : "/registro"}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          {isRegister ? "Inicia sesion" : "Registrate"}
        </Link>
      </p>

      {!isRegister && (
        <p className="mt-5 rounded-[14px] bg-cream-200 px-4 py-3 text-center text-[12.5px] text-ink-500">
          Cuenta de demostracion: <span className="font-semibold text-ink-800">demo@tripflow.app</span> /{" "}
          <span className="font-semibold text-ink-800">demo1234</span>
        </p>
      )}
    </div>
  );
}
