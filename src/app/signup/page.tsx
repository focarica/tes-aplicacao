import Link from "next/link";
import { signUpAction } from "@/app/actions/signup";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="auth-card">
      <h1>Criar conta</h1>
      <p>Cadastre-se para acessar a aplicação.</p>
      <AuthForm
        action={signUpAction}
        submitLabel="Criar conta"
        fields={[
          { name: "fullName", label: "Nome completo", autoComplete: "name" },
          { name: "username", label: "Nome de usuário", autoComplete: "username" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Senha", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p><Link href="/confirm-signup">Já tem um código de confirmação?</Link></p>
      <p><Link href="/login">Já tem conta? Entrar</Link></p>
    </main>
  );
}
