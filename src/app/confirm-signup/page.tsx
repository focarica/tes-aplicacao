import Link from "next/link";
import { confirmSignUpAction } from "@/app/actions/signup";
import { AuthForm } from "@/components/auth/auth-form";

export default function ConfirmSignupPage() {
  return (
    <main className="auth-card">
      <h1>Confirmar cadastro</h1>
      <p>Informe seu nome de usuário e o código enviado pelo Cognito.</p>
      <AuthForm
        action={confirmSignUpAction}
        submitLabel="Confirmar conta"
        fields={[
          { name: "username", label: "Nome de usuário", autoComplete: "username" },
          { name: "code", label: "Código de confirmação", autoComplete: "one-time-code" },
        ]}
      />
      <p><Link href="/login">Voltar ao login</Link></p>
    </main>
  );
}
