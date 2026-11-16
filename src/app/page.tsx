import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getAuthenticatedUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment p-6">
      <div className="w-full max-w-md rounded-3xl border border-sand bg-cream p-8 text-center shadow-[0_20px_60px_-30px_rgba(67,48,31,0.4)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-latte">
          TES
        </p>
        <h1 className="mt-2 text-3xl font-bold text-espresso">
          Suas fotos e vídeos, em casa
        </h1>
        <p className="mt-2 text-stone-500">
          Envie imagens e vídeos. Autenticação com AWS Cognito e armazenamento
          privado em S3.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-espresso px-5 py-2.5 font-medium text-amber-50 hover:bg-espresso-light"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-sand-dark bg-cream px-5 py-2.5 text-espresso hover:bg-parchment"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}
