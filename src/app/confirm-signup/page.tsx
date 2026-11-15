import Link from "next/link";
import { confirmSignUpAction } from "@/app/actions/signup";
import { AuthForm } from "@/components/auth/auth-form";

export default function ConfirmSignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment p-6">
      <div className="w-full max-w-sm rounded-3xl border border-sand bg-cream p-6 shadow-[0_20px_60px_-30px_rgba(67,48,31,0.4)]">
        <h1 className="text-xl font-semibold text-espresso">Confirmar cadastro</h1>
        <p className="mt-1 text-sm text-stone-500">
          Informe seu nome de usuário e o código enviado pelo Cognito.
        </p>
        <AuthForm
          action={confirmSignUpAction}
          submitLabel="Confirmar conta"
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
