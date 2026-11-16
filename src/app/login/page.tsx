import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmed?: string }> }) {
  const { confirmed } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment p-6">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-sand bg-cream p-6 shadow-[0_20px_60px_-30px_rgba(67,48,31,0.4)]">
        <h1 className="text-xl font-semibold text-espresso">Entrar na Galeria</h1>
        <p className="mt-1 text-sm text-stone-500">Acesse sua conta.</p>
        {confirmed === "1" && (
          <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Conta confirmada. Você já pode entrar.
          </p>
        )}
        <AuthForm
          action={signInAction}
          submitLabel="Entrar"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Senha", type: "password", autoComplete: "current-password" },
          ]}
        />
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link href="/signup" className="underline hover:text-espresso">
            Criar nova conta
          </Link>
        </p>
      </div>
    </main>
  );
}
