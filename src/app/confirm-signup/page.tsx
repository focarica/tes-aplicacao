import Link from "next/link";
import { confirmSignUpAction } from "@/app/actions/signup";
import { AuthForm } from "@/components/auth/auth-form";

export default async function ConfirmSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const { username } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment p-6">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-sand bg-cream p-6 shadow-[0_20px_60px_-30px_rgba(67,48,31,0.4)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand/70 text-xl text-espresso" aria-hidden="true">
          ✉
        </div>
        <h1 className="mt-4 text-xl font-semibold text-espresso">Confirmar cadastro</h1>
        <p className="mt-1 text-sm text-stone-500">
          Enviamos um código para o email cadastrado. Informe o nome de usuário e o
          código para ativar a conta.
        </p>
        <AuthForm
          action={confirmSignUpAction}
          submitLabel="Confirmar conta"
          initialValues={username ? { username } : undefined}
          fields={[
            { name: "username", label: "Nome de usuário", autoComplete: "username" },
            { name: "code", label: "Código de confirmação", autoComplete: "one-time-code" },
          ]}
        />
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link href="/login" className="underline hover:text-espresso">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
