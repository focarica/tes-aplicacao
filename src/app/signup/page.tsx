import Link from "next/link";
import { signUpAction } from "@/app/actions/signup";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment p-6">
      <div className="w-full max-w-sm rounded-3xl border border-sand bg-cream p-6 shadow-[0_20px_60px_-30px_rgba(67,48,31,0.4)]">
        <h1 className="text-xl font-semibold text-espresso">Criar conta</h1>
        <p className="mt-1 text-sm text-stone-500">
          Cadastre-se para acessar a aplicação.
        </p>
        <AuthForm
          action={signUpAction}
          confirmRegistration
          submitLabel="Criar conta"
          fields={[
            { name: "fullName", label: "Nome completo", autoComplete: "name" },
            { name: "username", label: "Nome de usuário", autoComplete: "username" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Senha", type: "password", autoComplete: "new-password" },
          ]}
        />
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link href="/login" className="underline hover:text-espresso">
            Já tem conta? Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
