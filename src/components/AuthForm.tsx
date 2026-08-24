"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";
import { checkPassword, passwordStrength } from "@/lib/password";
import { cn } from "@/lib/format";

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

const STRENGTH = [
  { label: "", color: "" },
  { label: "Débil", color: "bg-alert-500" },
  { label: "Aceptable", color: "bg-warn-500" },
  { label: "Sólida", color: "bg-ok-500" },
] as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegister = mode === "register";

  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    // Al corregir un campo, su error deja de mostrarse.
    setFields((f) => (f[key] ? { ...f, [key]: "" } : f));
  };

  const checks = checkPassword(values.password);
  const strength = passwordStrength(values.password);

  function validateLocally(): boolean {
    const next: Record<string, string> = {};

    if (isRegister && values.name.trim().length < 2) {
      next.name = "El nombre debe tener al menos 2 caracteres";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Escribe un correo válido";
    }
    if (!values.password) {
      next.password = "Escribe tu contraseña";
    } else if (isRegister && checks.some((c) => !c.met)) {
      next.password = "La contraseña no cumple los requisitos";
    }
    if (isRegister && values.confirmPassword !== values.password) {
      next.confirmPassword = "Las contraseñas no coinciden";
    }

    setFields(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!validateLocally()) return;

    setStatus("sending");

    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? {
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
                confirmPassword: values.confirmPassword,
              }
            : { email: values.email.trim(), password: values.password }
        ),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "No pudimos completar la operación");
        setFields(data.fields ?? {});
        setStatus("idle");
        return;
      }

      // Se mantiene la pantalla de carga hasta que el destino esté montado.
      setStatus("done");
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/viajes");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex min-h-[320px] w-full max-w-[560px] items-center justify-center">
        <Loader label={isRegister ? "Creando tu cuenta..." : "Entrando..."} />
      </div>
    );
  }

  const busy = status === "sending";

  return (
    <div className="w-full max-w-[560px] animate-fade-up rounded-[20px] border border-cream-300 bg-cream-50 px-8 py-10 sm:px-14">
      <h1 className="text-center text-[22px] font-bold tracking-tight text-ink-900">
        {isRegister ? "Crea tu cuenta" : "Inicia sesión para ver esta página"}
      </h1>
      {isRegister && (
        <p className="mt-2 text-center text-[14px] text-ink-700">
          Solo necesitas un nombre, un correo y una contraseña.
        </p>
      )}

      {/* ------------------------------ Accesos sociales ----------------------- */}
      <div className="mt-7 space-y-3">
        {SOCIAL.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={busy}
            onClick={() =>
              setNotice(
                `El acceso con ${provider.label} no está habilitado en esta versión. Usa tu correo y contraseña.`
              )
            }
            className="mx-auto flex w-full max-w-[290px] items-center justify-center gap-2.5 rounded-pill border border-brand-200 bg-white px-6 py-2.5 text-[13.5px] font-bold text-ink-900 transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
          >
            {provider.icon}
            {isRegister ? "Regístrate" : "Inicia sesión"} con {provider.label}
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
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {error && <Alert tone="error">{error}</Alert>}

        {isRegister && (
          <Field id="name" error={fields.name}>
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Nombre"
              aria-label="Nombre"
              aria-invalid={Boolean(fields.name)}
              value={values.name}
              onChange={set("name")}
              disabled={busy}
              className={inputClass(fields.name)}
            />
          </Field>
        )}

        <Field id="email" error={fields.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Correo electrónico"
            aria-label="Correo electrónico"
            aria-invalid={Boolean(fields.email)}
            value={values.email}
            onChange={set("email")}
            disabled={busy}
            className={inputClass(fields.email)}
          />
        </Field>

        <Field id="password" error={fields.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="Contraseña"
              aria-label="Contraseña"
              aria-invalid={Boolean(fields.password)}
              value={values.password}
              onChange={set("password")}
              disabled={busy}
              className={cn(inputClass(fields.password), "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar la contraseña" : "Mostrar la contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition-colors hover:text-ink-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </Field>

        {isRegister && values.password.length > 0 && (
          <div className="rounded-[14px] bg-cream-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-400">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", STRENGTH[strength].color)}
                  style={{ width: `${(strength / 3) * 100}%` }}
                />
              </div>
              <span className="text-[12px] font-semibold text-ink-500">{STRENGTH[strength].label}</span>
            </div>
            <ul className="mt-2.5 space-y-1">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(
                    "flex items-center gap-1.5 text-[12.5px]",
                    check.met ? "text-ok-600" : "text-ink-500"
                  )}
                >
                  {check.met ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isRegister && (
          <Field id="confirmPassword" error={fields.confirmPassword}>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              aria-label="Repite la contraseña"
              aria-invalid={Boolean(fields.confirmPassword)}
              value={values.confirmPassword}
              onChange={set("confirmPassword")}
              disabled={busy}
              className={inputClass(fields.confirmPassword)}
            />
          </Field>
        )}

        {!isRegister && (
          <p className="text-center">
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "La recuperación de contraseña requiere un servicio de correo y no está habilitada en esta versión."
                )
              }
              className="text-[12.5px] font-bold text-ink-500 underline underline-offset-2 transition-colors hover:text-brand-600"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        )}

        <div className="flex justify-center pt-2">
          <Button type="submit" size="lg" loading={busy} className="min-w-[160px]">
            {busy ? (isRegister ? "Creando cuenta" : "Entrando") : isRegister ? "Crear cuenta" : "Inicia sesión"}
          </Button>
        </div>
      </form>

      <p className="mt-5 text-center text-[13.5px] text-ink-700">
        {isRegister ? "¿Ya tienes una cuenta? " : "¿Aún no tienes una cuenta? "}
        <Link
          href={isRegister ? "/login" : "/registro"}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          {isRegister ? "Inicia sesión" : "Regístrate"}
        </Link>
      </p>

      {!isRegister && (
        <p className="mt-5 rounded-[14px] bg-cream-200 px-4 py-3 text-center text-[12.5px] text-ink-500">
          Cuenta de demostración: <span className="font-semibold text-ink-800">demo@tripflow.app</span> /{" "}
          <span className="font-semibold text-ink-800">demo1234</span>
        </p>
      )}
    </div>
  );
}

function Field({ id, error, children }: { id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[12.5px] text-alert-500">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(error?: string): string {
  return cn("input-base", error && "border-alert-500 bg-alert-500/[0.06]");
}
