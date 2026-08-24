"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegister = mode === "register";

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
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
    <div className="w-full max-w-md animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/20 ring-1 ring-brand-500/30">
          <Plane className="h-7 w-7 text-brand-300" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {isRegister ? "Crea tu cuenta" : "Bienvenido de vuelta"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {isRegister
            ? "Empieza a controlar el presupuesto de tus viajes."
            : "Ingresa para seguir el control de tus viajes."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card card-pad space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {isRegister && (
          <Field label="Nombre" htmlFor="name" error={fields.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Ana Martinez"
              value={values.name}
              onChange={set("name")}
              required
            />
          </Field>
        )}

        <Field label="Correo electronico" htmlFor="email" error={fields.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={values.email}
            onChange={set("email")}
            required
          />
        </Field>

        <Field
          label="Contrasena"
          htmlFor="password"
          error={fields.password}
          hint={isRegister ? "Minimo 6 caracteres" : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={values.password}
            onChange={set("password")}
            required
          />
        </Field>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {isRegister ? "Crear cuenta" : "Entrar"}
        </Button>

        <p className="pt-1 text-center text-[13.5px] text-slate-400">
          {isRegister ? "¿Ya tienes cuenta? " : "¿Aun no tienes cuenta? "}
          <Link
            href={isRegister ? "/login" : "/registro"}
            className="font-medium text-brand-300 hover:text-brand-200"
          >
            {isRegister ? "Inicia sesion" : "Registrate"}
          </Link>
        </p>
      </form>

      {!isRegister && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-[12.5px] text-slate-400">
          Cuenta de demostracion:{" "}
          <span className="font-mono text-slate-200">demo@viajero.app</span> /{" "}
          <span className="font-mono text-slate-200">demo1234</span>
        </div>
      )}
    </div>
  );
}
