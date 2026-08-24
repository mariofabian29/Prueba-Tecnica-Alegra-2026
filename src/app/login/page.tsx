import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterBar } from "@/components/shell/FooterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicia sesion" };

export default async function LoginPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav authenticated={Boolean(session)} />
      <main className="flex flex-1 items-center justify-center bg-cream-50 px-4 py-14">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </main>
      <FooterBar />
    </div>
  );
}
